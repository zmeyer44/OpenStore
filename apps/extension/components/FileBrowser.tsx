import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Folder,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  ArrowLeft,
  Loader2,
  Upload,
} from "lucide-react";
import {
  sendMessage,
  type Breadcrumb,
  type FileRow,
  type FolderRow,
  type Workspace,
} from "../utils/messaging";
import { Select } from "./Select";

export interface FileBrowserProps {
  // Whether to render the "pick this file" affordance. The popup is read-only;
  // the file-input intercept dialog needs to commit a selection back to the
  // page.
  mode: "browse" | "pick";
  // May be async — the dialog's pick handler runs a fetchFileForUpload
  // round-trip and we await it to keep the row's loading state honest.
  onPickFile?: (file: FileRow, workspaceSlug: string) => void | Promise<void>;
  onClose?: () => void;
  // Allow the host (popup) to render in a tighter box than the dialog.
  height?: number;
  // HTML5 input.accept tokens — narrow the file list to types the page
  // accepts. Forwarded to the server-side files.list query.
  accept?: string[];
  // Lets the host track the "current location" so it can route uploads to
  // the right workspace + folder without owning the navigation state itself.
  onContextChange?: (ctx: {
    workspaceSlug: string;
    folderId: string | null;
  }) => void;
  // Render an "Upload" affordance in browse mode and call this when clicked.
  // Host owns the upload UI itself; we just surface the trigger.
  onUpload?: () => void;
  // Bump to force a refetch — used after a host-driven action (e.g. an
  // upload) mutates the current folder while we're showing it.
  refreshSignal?: number;
}

function fileIcon(mimeType: string, size = 16) {
  if (mimeType.startsWith("image/")) return <ImageIcon size={size} />;
  if (mimeType.startsWith("video/")) return <Film size={size} />;
  if (mimeType.startsWith("audio/")) return <Music size={size} />;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("compressed")
  )
    return <Archive size={size} />;
  return <FileText size={size} />;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function FileBrowser({
  mode,
  onPickFile,
  onClose,
  height = 360,
  accept,
  onContextChange,
  onUpload,
  refreshSignal,
}: FileBrowserProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  // Synchronous mirror of `picking` for the moment between the click handler
  // setting state and React committing — without it, a hard double-click can
  // fire two handlePick calls before the disabled prop takes effect, and
  // both injections race into the same <input>.
  const pickingRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await sendMessage("listWorkspaces", undefined);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setWorkspaces(result.data);
      const stored = await sendMessage("getActiveWorkspace", undefined);
      const initial =
        stored && result.data.some((w) => w.slug === stored)
          ? stored
          : (result.data[0]?.slug ?? null);
      setActiveSlug(initial);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeSlug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await sendMessage("listFolder", {
        workspaceSlug: activeSlug,
        folderId,
        accept,
      });
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setFolders(result.data.folders);
      setFiles(result.data.files);
      setBreadcrumbs(result.data.breadcrumbs);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Stringify accept so a new array literal from the parent on each render
    // doesn't refire the query — only a token-set change should.
    // refreshSignal is included so the host can force a refetch (e.g. after
    // an upload) without us tracking that mutation ourselves.
  }, [activeSlug, folderId, accept ? accept.join("|") : null, refreshSignal]);

  // Bubble (slug, folder) up so the host can route uploads to wherever the
  // user is currently browsing. Fires whenever either changes — including the
  // initial slug resolution after listWorkspaces returns.
  useEffect(() => {
    if (!onContextChange || !activeSlug) return;
    onContextChange({ workspaceSlug: activeSlug, folderId });
  }, [activeSlug, folderId, onContextChange]);

  const switchWorkspace = async (slug: string) => {
    setActiveSlug(slug);
    setFolderId(null);
    await sendMessage("setActiveWorkspace", { slug });
  };

  const goUp = () => {
    if (breadcrumbs.length === 0) return;
    const parent = breadcrumbs[breadcrumbs.length - 2];
    setFolderId(parent ? parent.id : null);
  };

  const handlePick = async (file: FileRow) => {
    if (!activeSlug || !onPickFile) return;
    if (pickingRef.current) return;
    pickingRef.current = file.id;
    setPicking(file.id);
    try {
      // Awaited so the in-flight state survives across the
      // fetchFileForUpload round-trip; without await the finally clears
      // `picking` synchronously and a second click would race the first.
      await onPickFile(file, activeSlug);
    } finally {
      pickingRef.current = null;
      setPicking(null);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.workspaceRow}>
        {onClose ? (
          <button style={styles.backBtn} onClick={onClose} aria-label="Back">
            <ArrowLeft size={16} />
          </button>
        ) : null}
        <Select
          value={activeSlug}
          options={workspaces.map((w) => ({
            value: w.slug,
            label: w.name,
            description: w.role,
          }))}
          onChange={(slug) => switchWorkspace(slug)}
          placeholder={
            workspaces.length === 0 ? "No workspaces" : "Select workspace"
          }
          disabled={workspaces.length === 0}
        />
        {mode === "browse" && onUpload ? (
          <button
            type="button"
            style={styles.uploadBtn}
            onClick={onUpload}
            disabled={!activeSlug}
            aria-label="Upload files"
            title="Upload files"
          >
            <Upload size={14} />
          </button>
        ) : null}
      </div>

      <div style={styles.breadcrumbRow}>
        <button
          style={styles.crumb}
          onClick={() => setFolderId(null)}
          disabled={folderId === null}
        >
          Root
        </button>
        {breadcrumbs.map((b) => (
          <span key={b.id} style={styles.crumbWrap}>
            <ChevronRight size={12} style={{ opacity: 0.4 }} />
            <button style={styles.crumb} onClick={() => setFolderId(b.id)}>
              {b.name}
            </button>
          </span>
        ))}
      </div>

      <div style={{ ...styles.list, height }}>
        {loading ? (
          <div style={styles.center}>
            <Loader2 size={16} className="locker-spin" /> Loading…
          </div>
        ) : error ? (
          <div style={styles.errorBox}>{error}</div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div style={styles.empty}>This folder is empty.</div>
        ) : (
          <>
            {folderId !== null ? (
              <button style={styles.row} onClick={goUp}>
                <ArrowLeft size={16} />
                <span style={styles.rowName}>..</span>
              </button>
            ) : null}
            {folders.map((f) => (
              <button
                key={f.id}
                style={styles.row}
                onClick={() => setFolderId(f.id)}
              >
                <Folder size={16} />
                <span style={styles.rowName}>{f.name}</span>
              </button>
            ))}
            {files.map((f) => (
              <div key={f.id} style={styles.fileRow}>
                <span style={styles.fileIcon}>{fileIcon(f.mimeType)}</span>
                <span style={styles.rowName} title={f.name}>
                  {f.name}
                </span>
                <span style={styles.size}>{formatBytes(f.size)}</span>
                {mode === "pick" ? (
                  <button
                    style={styles.pickBtn}
                    onClick={() => handlePick(f)}
                    // Lock every Use button while any pick is in flight —
                    // injecting a second file would clobber the first.
                    disabled={picking !== null}
                  >
                    {picking === f.id ? "…" : "Use"}
                  </button>
                ) : null}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  workspaceRow: { display: "flex", alignItems: "center", gap: 8 },
  uploadBtn: {
    width: 36,
    height: 36,
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#3a62f5",
    color: "#fff",
    border: "none",
    borderRadius: 9999,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  backBtn: {
    width: 36,
    height: 36,
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(20, 17, 15, 0.045)",
    border: "1px solid transparent",
    borderRadius: 9999,
    cursor: "pointer",
    color: "#5a554f",
    fontFamily: "inherit",
  },
  breadcrumbRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "#5a554f",
    flexWrap: "wrap",
  },
  crumbWrap: { display: "inline-flex", alignItems: "center", gap: 2 },
  crumb: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "inherit",
    padding: "2px 4px",
    fontSize: 12,
    fontFamily: "inherit",
    borderRadius: 4,
  },
  list: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 10,
    overflowY: "auto",
    background: "#fff",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 10px",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    fontSize: 13,
    color: "#14110f",
  },
  fileRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
    fontSize: 13,
    color: "#14110f",
  },
  fileIcon: { display: "inline-flex", alignItems: "center", color: "#5a554f" },
  rowName: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  size: { color: "#5a554f", fontSize: 11, fontVariantNumeric: "tabular-nums" },
  pickBtn: {
    background: "#3a62f5",
    color: "white",
    border: "none",
    padding: "4px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  center: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: 16,
    color: "#5a554f",
  },
  empty: { padding: 16, color: "#5a554f", fontSize: 13, textAlign: "center" },
  errorBox: {
    padding: "10px 12px",
    background: "#fbe9e6",
    color: "#8a261d",
    fontSize: 12,
    margin: 8,
    borderRadius: 8,
  },
};
