import path from "node:path";
import { and, eq } from "drizzle-orm";
import { files, folders } from "@openstore/database";
import type { Database } from "@openstore/database";
import type { StorageProvider } from "@openstore/storage";
import type {
  CpOptions,
  FsStat,
  IFileSystem,
  MkdirOptions,
  RmOptions,
} from "just-bash";

type ReadFileOptionsArg = Parameters<IFileSystem["readFile"]>[1];
type WriteFileOptionsArg = Parameters<IFileSystem["writeFile"]>[2];
type DirentEntryLike = Awaited<
  ReturnType<NonNullable<IFileSystem["readdirWithFileTypes"]>>
>[number];
type ReadEncoding =
  | "utf8"
  | "utf-8"
  | "ascii"
  | "binary"
  | "base64"
  | "hex"
  | "latin1";

/**
 * Read-only virtual filesystem for workspace traversal with just-bash.
 * It bootstraps a directory tree from folders/files rows and lazily reads
 * file bytes from the configured storage provider.
 */

const FILE_MODE = 0o444;
const DIRECTORY_MODE = 0o555;

const TREE_CACHE_TTL_MS = readPositiveInt(
  process.env.OPENSTORE_VFS_TREE_CACHE_TTL_MS,
  15_000,
);
const CONTENT_CACHE_TTL_MS = readPositiveInt(
  process.env.OPENSTORE_VFS_CONTENT_CACHE_TTL_MS,
  120_000,
);
const MAX_CONTENT_CACHE_ENTRIES = readPositiveInt(
  process.env.OPENSTORE_VFS_CONTENT_CACHE_MAX_ENTRIES,
  200,
);
const MAX_READ_BYTES = readPositiveInt(
  process.env.OPENSTORE_VFS_MAX_READ_BYTES,
  10 * 1024 * 1024,
);

type FolderRow = {
  id: string;
  parentId: string | null;
  name: string;
  updatedAt: Date;
};

type FileRow = {
  id: string;
  folderId: string | null;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
  updatedAt: Date;
};

interface VirtualFileNode {
  fileId: string;
  path: string;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
  mtime: Date;
}

interface DirectoryNode {
  path: string;
  mtime: Date;
  childrenByName: Map<string, DirentEntryLike>;
}

interface VfsSnapshot {
  directoriesByPath: Map<string, DirectoryNode>;
  filesByPath: Map<string, VirtualFileNode>;
  allPaths: string[];
}

interface SnapshotCacheEntry {
  snapshot: VfsSnapshot;
  expiresAt: number;
}

interface ContentCacheEntry {
  bytes: Uint8Array;
  expiresAt: number;
}

const snapshotCache = new Map<string, SnapshotCacheEntry>();
const pendingSnapshotBuilds = new Map<string, Promise<VfsSnapshot>>();
const fileContentCache = new Map<string, ContentCacheEntry>();

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeVirtualPath(inputPath: string): string {
  const withRoot = inputPath.startsWith("/") ? inputPath : `/${inputPath}`;
  const normalized = path.posix.normalize(withRoot);
  if (normalized.length > 1 && normalized.endsWith("/")) {
    return normalized.slice(0, -1);
  }
  return normalized || "/";
}

function dirnameVirtualPath(inputPath: string): string {
  if (inputPath === "/") return "/";
  const parent = path.posix.dirname(inputPath);
  return parent === "." ? "/" : parent;
}

function joinVirtualPath(parentPath: string, childName: string): string {
  if (parentPath === "/") return normalizeVirtualPath(`/${childName}`);
  return normalizeVirtualPath(`${parentPath}/${childName}`);
}

function toDirent(name: string, type: "file" | "directory"): DirentEntryLike {
  return {
    name,
    isFile: type === "file",
    isDirectory: type === "directory",
    isSymbolicLink: false,
  };
}

function createFsError(code: string, message: string): Error {
  const err = new Error(`${code}: ${message}`) as Error & { code?: string };
  err.code = code;
  return err;
}

function enoent(operation: string, inputPath: string): Error {
  return createFsError(
    "ENOENT",
    `no such file or directory, ${operation} '${inputPath}'`,
  );
}

function enotdir(operation: string, inputPath: string): Error {
  return createFsError(
    "ENOTDIR",
    `not a directory, ${operation} '${inputPath}'`,
  );
}

function eisdir(operation: string, inputPath: string): Error {
  return createFsError(
    "EISDIR",
    `illegal operation on a directory, ${operation} '${inputPath}'`,
  );
}

function readOnlyError(operation: string, inputPath: string): Error {
  return createFsError(
    "EROFS",
    `read-only file system, ${operation} '${inputPath}'`,
  );
}

function appendIdSuffix(name: string, id: string): string {
  const shortId = id.slice(0, 8);
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex > 0 && dotIndex < name.length - 1) {
    const base = name.slice(0, dotIndex);
    const ext = name.slice(dotIndex);
    return `${base} (${shortId})${ext}`;
  }
  return `${name} (${shortId})`;
}

function assignUniqueNames<T extends { id: string; name: string }>(
  items: T[],
  usedNames: Set<string>,
): Map<string, string> {
  const byBaseName = new Map<string, T[]>();

  for (const item of items) {
    if (!byBaseName.has(item.name)) byBaseName.set(item.name, []);
    byBaseName.get(item.name)!.push(item);
  }

  const assignments = new Map<string, string>();
  const nameGroups = [...byBaseName.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  for (const [baseName, group] of nameGroups) {
    const sortedGroup = [...group].sort((a, b) => a.id.localeCompare(b.id));

    if (sortedGroup.length === 1 && !usedNames.has(baseName)) {
      assignments.set(sortedGroup[0]!.id, baseName);
      usedNames.add(baseName);
      continue;
    }

    for (const item of sortedGroup) {
      let candidate = appendIdSuffix(baseName, item.id);
      let suffix = 2;
      while (usedNames.has(candidate)) {
        candidate = `${appendIdSuffix(baseName, item.id)}-${suffix}`;
        suffix += 1;
      }
      assignments.set(item.id, candidate);
      usedNames.add(candidate);
    }
  }

  return assignments;
}

function maxDate(left: Date, right: Date): Date {
  return left.getTime() >= right.getTime() ? left : right;
}

async function readStreamToUint8Array(
  stream: ReadableStream,
  maxBytes: number,
  inputPath: string,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw createFsError(
        "EFBIG",
        `file too large, read '${inputPath}' (${totalBytes} bytes, max ${maxBytes})`,
      );
    }
    chunks.push(value);
  }

  if (chunks.length === 0) return new Uint8Array();
  if (chunks.length === 1) return chunks[0]!;

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function resolveReadEncoding(options?: ReadFileOptionsArg): ReadEncoding {
  if (typeof options === "string") {
    return options as ReadEncoding;
  }
  if (typeof options?.encoding === "string") {
    return options.encoding as ReadEncoding;
  }
  return "utf8";
}

function getCachedContent(cacheKey: string): Uint8Array | null {
  const now = Date.now();
  const entry = fileContentCache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    fileContentCache.delete(cacheKey);
    return null;
  }

  // Refresh insertion order to preserve LRU-ish behavior.
  fileContentCache.delete(cacheKey);
  fileContentCache.set(cacheKey, entry);
  return new Uint8Array(entry.bytes);
}

function setCachedContent(cacheKey: string, bytes: Uint8Array): void {
  fileContentCache.delete(cacheKey);
  fileContentCache.set(cacheKey, {
    bytes: new Uint8Array(bytes),
    expiresAt: Date.now() + CONTENT_CACHE_TTL_MS,
  });

  while (fileContentCache.size > MAX_CONTENT_CACHE_ENTRIES) {
    const oldestKey = fileContentCache.keys().next().value as
      | string
      | undefined;
    if (!oldestKey) break;
    fileContentCache.delete(oldestKey);
  }
}

async function buildWorkspaceSnapshot(params: {
  db: Database;
  workspaceId: string;
}): Promise<VfsSnapshot> {
  const [folderRowsRaw, fileRowsRaw] = await Promise.all([
    params.db
      .select({
        id: folders.id,
        parentId: folders.parentId,
        name: folders.name,
        updatedAt: folders.updatedAt,
      })
      .from(folders)
      .where(eq(folders.workspaceId, params.workspaceId)),
    params.db
      .select({
        id: files.id,
        folderId: files.folderId,
        name: files.name,
        mimeType: files.mimeType,
        size: files.size,
        storagePath: files.storagePath,
        updatedAt: files.updatedAt,
      })
      .from(files)
      .where(
        and(
          eq(files.workspaceId, params.workspaceId),
          eq(files.status, "ready"),
        ),
      ),
  ]);

  const folderRows: FolderRow[] = folderRowsRaw;
  const fileRows: FileRow[] = fileRowsRaw;
  const foldersById = new Map(folderRows.map((row) => [row.id, row]));

  const folderRowsByParent = new Map<string | null, FolderRow[]>();
  for (const row of folderRows) {
    const parentKey =
      row.parentId && foldersById.has(row.parentId) ? row.parentId : null;
    if (!folderRowsByParent.has(parentKey))
      folderRowsByParent.set(parentKey, []);
    folderRowsByParent.get(parentKey)!.push(row);
  }

  const uniqueFolderNameById = new Map<string, string>();
  for (const [, siblingFolders] of folderRowsByParent) {
    const assigned = assignUniqueNames(siblingFolders, new Set());
    for (const [id, uniqueName] of assigned.entries()) {
      uniqueFolderNameById.set(id, uniqueName);
    }
  }

  const folderPathById = new Map<string, string>();
  const resolvingStack = new Set<string>();

  const resolveFolderPath = (folderId: string): string => {
    const cached = folderPathById.get(folderId);
    if (cached) return cached;

    if (resolvingStack.has(folderId)) return "/";
    resolvingStack.add(folderId);

    const row = foldersById.get(folderId);
    if (!row) return "/";

    const parentPath =
      row.parentId && foldersById.has(row.parentId)
        ? resolveFolderPath(row.parentId)
        : "/";

    const uniqueName = uniqueFolderNameById.get(folderId) ?? row.name;
    const resolved = joinVirtualPath(parentPath, uniqueName);
    folderPathById.set(folderId, resolved);
    resolvingStack.delete(folderId);
    return resolved;
  };

  const directoriesByPath = new Map<string, DirectoryNode>();
  const filesByPath = new Map<string, VirtualFileNode>();

  const ensureDirectory = (directoryPath: string): DirectoryNode => {
    const normalized = normalizeVirtualPath(directoryPath);
    const existing = directoriesByPath.get(normalized);
    if (existing) return existing;

    const created: DirectoryNode = {
      path: normalized,
      mtime: new Date(0),
      childrenByName: new Map<string, DirentEntryLike>(),
    };
    directoriesByPath.set(normalized, created);
    return created;
  };

  ensureDirectory("/");

  for (const row of folderRows) {
    const folderPath = resolveFolderPath(row.id);
    const folderNode = ensureDirectory(folderPath);
    folderNode.mtime = maxDate(folderNode.mtime, row.updatedAt);

    const parentPath = dirnameVirtualPath(folderPath);
    const parentNode = ensureDirectory(parentPath);
    parentNode.childrenByName.set(
      path.posix.basename(folderPath),
      toDirent(path.posix.basename(folderPath), "directory"),
    );
    parentNode.mtime = maxDate(parentNode.mtime, row.updatedAt);
  }

  const filesByParentPath = new Map<string, FileRow[]>();
  for (const row of fileRows) {
    const parentPath =
      row.folderId && folderPathById.has(row.folderId)
        ? folderPathById.get(row.folderId)!
        : "/";
    if (!filesByParentPath.has(parentPath))
      filesByParentPath.set(parentPath, []);
    filesByParentPath.get(parentPath)!.push(row);
  }

  for (const [parentPath, siblingFiles] of filesByParentPath.entries()) {
    const parentNode = ensureDirectory(parentPath);
    const usedNames = new Set(parentNode.childrenByName.keys());
    const uniqueNamesById = assignUniqueNames(siblingFiles, usedNames);

    for (const row of siblingFiles) {
      const uniqueName = uniqueNamesById.get(row.id) ?? row.name;
      const filePath = joinVirtualPath(parentPath, uniqueName);
      const fileNode: VirtualFileNode = {
        fileId: row.id,
        path: filePath,
        name: uniqueName,
        mimeType: row.mimeType,
        size: row.size,
        storagePath: row.storagePath,
        mtime: row.updatedAt,
      };

      filesByPath.set(filePath, fileNode);
      parentNode.childrenByName.set(uniqueName, toDirent(uniqueName, "file"));
      parentNode.mtime = maxDate(parentNode.mtime, row.updatedAt);
    }
  }

  const allPaths = [...directoriesByPath.keys(), ...filesByPath.keys()].sort(
    (a, b) => a.localeCompare(b),
  );

  return {
    directoriesByPath,
    filesByPath,
    allPaths,
  };
}

// Tracks which builds were started before the most recent invalidation.
// When a build completes, it only populates the cache if its generation
// matches the current generation, preventing stale data after invalidation.
const snapshotGeneration = new Map<string, number>();

async function getWorkspaceSnapshot(params: {
  db: Database;
  workspaceId: string;
}): Promise<VfsSnapshot> {
  const now = Date.now();
  const cached = snapshotCache.get(params.workspaceId);
  if (cached && cached.expiresAt > now) {
    return cached.snapshot;
  }

  const pending = pendingSnapshotBuilds.get(params.workspaceId);
  if (pending) {
    return pending;
  }

  const generation = (snapshotGeneration.get(params.workspaceId) ?? 0);
  const buildPromise = buildWorkspaceSnapshot(params)
    .then((snapshot) => {
      // Only cache if no invalidation occurred since this build started
      if ((snapshotGeneration.get(params.workspaceId) ?? 0) === generation) {
        snapshotCache.set(params.workspaceId, {
          snapshot,
          expiresAt: Date.now() + TREE_CACHE_TTL_MS,
        });
      }
      return snapshot;
    })
    .finally(() => {
      pendingSnapshotBuilds.delete(params.workspaceId);
    });

  pendingSnapshotBuilds.set(params.workspaceId, buildPromise);
  return buildPromise;
}

export function invalidateWorkspaceVfsSnapshot(workspaceId: string): void {
  snapshotCache.delete(workspaceId);
  pendingSnapshotBuilds.delete(workspaceId);
  snapshotGeneration.set(workspaceId, (snapshotGeneration.get(workspaceId) ?? 0) + 1);
}

export class OpenStoreVirtualFileSystem implements IFileSystem {
  private readonly workspaceId: string;
  private readonly storage: StorageProvider;
  private readonly snapshot: VfsSnapshot;

  private constructor(params: {
    workspaceId: string;
    storage: StorageProvider;
    snapshot: VfsSnapshot;
  }) {
    this.workspaceId = params.workspaceId;
    this.storage = params.storage;
    this.snapshot = params.snapshot;
  }

  static async create(params: {
    db: Database;
    workspaceId: string;
    storage: StorageProvider;
  }): Promise<OpenStoreVirtualFileSystem> {
    const snapshot = await getWorkspaceSnapshot({
      db: params.db,
      workspaceId: params.workspaceId,
    });

    return new OpenStoreVirtualFileSystem({
      workspaceId: params.workspaceId,
      storage: params.storage,
      snapshot,
    });
  }

  private normalized(inputPath: string): string {
    return normalizeVirtualPath(inputPath);
  }

  private async loadFileBytes(
    fileNode: VirtualFileNode,
    inputPath: string,
  ): Promise<Uint8Array> {
    const cacheKey = `${this.workspaceId}:${fileNode.fileId}:${fileNode.size}:${fileNode.mtime.getTime()}`;
    const cached = getCachedContent(cacheKey);
    if (cached) return cached;

    if (fileNode.size > MAX_READ_BYTES) {
      throw createFsError(
        "EFBIG",
        `file too large, read '${inputPath}' (${fileNode.size} bytes, max ${MAX_READ_BYTES})`,
      );
    }

    try {
      const { data } = await this.storage.download(fileNode.storagePath);
      const bytes = await readStreamToUint8Array(
        data,
        MAX_READ_BYTES,
        inputPath,
      );
      setCachedContent(cacheKey, bytes);
      return bytes;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("EFBIG:")) {
        throw error;
      }
      throw enoent("open", inputPath);
    }
  }

  async readFile(
    inputPath: string,
    options?: ReadFileOptionsArg,
  ): Promise<string> {
    const bytes = await this.readFileBuffer(inputPath);
    const encoding = resolveReadEncoding(options);
    return Buffer.from(bytes).toString(encoding);
  }

  async readFileBuffer(inputPath: string): Promise<Uint8Array> {
    const normalizedPath = this.normalized(inputPath);
    const fileNode = this.snapshot.filesByPath.get(normalizedPath);
    if (fileNode) {
      return this.loadFileBytes(fileNode, inputPath);
    }

    if (this.snapshot.directoriesByPath.has(normalizedPath)) {
      throw eisdir("read", inputPath);
    }

    throw enoent("open", inputPath);
  }

  async writeFile(
    inputPath: string,
    _content: string | Uint8Array,
    _options?: WriteFileOptionsArg,
  ): Promise<void> {
    throw readOnlyError("write", inputPath);
  }

  async appendFile(
    inputPath: string,
    _content: string | Uint8Array,
    _options?: WriteFileOptionsArg,
  ): Promise<void> {
    throw readOnlyError("append", inputPath);
  }

  async exists(inputPath: string): Promise<boolean> {
    if (inputPath.includes("\0")) return false;
    const normalizedPath = this.normalized(inputPath);
    return (
      this.snapshot.filesByPath.has(normalizedPath) ||
      this.snapshot.directoriesByPath.has(normalizedPath)
    );
  }

  async stat(inputPath: string): Promise<FsStat> {
    const normalizedPath = this.normalized(inputPath);
    const fileNode = this.snapshot.filesByPath.get(normalizedPath);
    if (fileNode) {
      return {
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
        mode: FILE_MODE,
        size: fileNode.size,
        mtime: fileNode.mtime,
      };
    }

    const directoryNode = this.snapshot.directoriesByPath.get(normalizedPath);
    if (directoryNode) {
      return {
        isFile: false,
        isDirectory: true,
        isSymbolicLink: false,
        mode: DIRECTORY_MODE,
        size: 0,
        mtime: directoryNode.mtime,
      };
    }

    throw enoent("stat", inputPath);
  }

  async mkdir(_path: string, _options?: MkdirOptions): Promise<void> {
    throw readOnlyError("mkdir", _path);
  }

  async readdir(inputPath: string): Promise<string[]> {
    const entries = await this.readdirWithFileTypes(inputPath);
    return entries.map((entry) => entry.name);
  }

  async readdirWithFileTypes(inputPath: string): Promise<DirentEntryLike[]> {
    const normalizedPath = this.normalized(inputPath);
    const directoryNode = this.snapshot.directoriesByPath.get(normalizedPath);
    if (!directoryNode) {
      if (this.snapshot.filesByPath.has(normalizedPath)) {
        throw enotdir("scandir", inputPath);
      }
      throw enoent("scandir", inputPath);
    }

    return [...directoryNode.childrenByName.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  async rm(inputPath: string, _options?: RmOptions): Promise<void> {
    throw readOnlyError("rm", inputPath);
  }

  async cp(_src: string, dest: string, _options?: CpOptions): Promise<void> {
    throw readOnlyError("cp", dest);
  }

  async mv(_src: string, dest: string): Promise<void> {
    throw readOnlyError("mv", dest);
  }

  resolvePath(base: string, targetPath: string): string {
    const normalizedBase = normalizeVirtualPath(base || "/");
    const resolved = path.posix.resolve(normalizedBase, targetPath);
    return normalizeVirtualPath(resolved);
  }

  getAllPaths(): string[] {
    return [...this.snapshot.allPaths];
  }

  async chmod(inputPath: string, _mode: number): Promise<void> {
    throw readOnlyError("chmod", inputPath);
  }

  async symlink(_target: string, linkPath: string): Promise<void> {
    throw readOnlyError("symlink", linkPath);
  }

  async link(_existingPath: string, newPath: string): Promise<void> {
    throw readOnlyError("link", newPath);
  }

  async readlink(inputPath: string): Promise<string> {
    const normalizedPath = this.normalized(inputPath);
    const exists =
      this.snapshot.directoriesByPath.has(normalizedPath) ||
      this.snapshot.filesByPath.has(normalizedPath);
    if (!exists) throw enoent("readlink", inputPath);
    throw createFsError("EINVAL", `invalid argument, readlink '${inputPath}'`);
  }

  async lstat(inputPath: string): Promise<FsStat> {
    return this.stat(inputPath);
  }

  async realpath(inputPath: string): Promise<string> {
    const normalizedPath = this.normalized(inputPath);
    const exists =
      this.snapshot.directoriesByPath.has(normalizedPath) ||
      this.snapshot.filesByPath.has(normalizedPath);
    if (!exists) throw enoent("realpath", inputPath);
    return normalizedPath;
  }

  async utimes(inputPath: string, _atime: Date, _mtime: Date): Promise<void> {
    throw readOnlyError("utimes", inputPath);
  }
}
