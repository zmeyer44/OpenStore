import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { sendMessage, type InitiateUploadResponse } from "../utils/messaging";
import {
  uploadMultipart,
  uploadPresignedPut,
  uploadServerBuffered,
  UPLOAD_MAX_FILE_SIZE,
} from "../utils/api";

interface UploadViewProps {
  workspaceSlug: string;
  folderId: string | null;
  // Files supplied via drag-and-drop or the popup's upload button. When the
  // view opens with no files (e.g. a deep-link from the future), it pops the
  // OS file picker on mount.
  initialFiles: File[];
  onClose: () => void;
  onUploaded: () => void;
}

interface Conflict {
  existingFileId: string;
  existingFileSize: number;
  resolution: "replace" | "keep-both" | null;
}

interface Entry {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error" | "rejected";
  progress?: number;
  error?: string;
  conflict?: Conflict;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function newEntryId(): string {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function UploadView({
  workspaceSlug,
  folderId,
  initialFiles,
  onClose,
  onUploaded,
}: UploadViewProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [uploading, setUploading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Debounce conflict checks across rapid back-to-back additions: the
  // background does one round-trip per add, but we don't want to block adds.
  const conflictsCheckedFor = useRef<Set<string>>(new Set());
  // Track whether any successful upload has happened so we can refresh the
  // file browser even if some entries failed.
  const successCountRef = useRef(0);

  // Bootstrap: seed with initial files; if there are none, prompt the user
  // to pick. We don't auto-open here on every render — only the first time
  // the view is mounted.
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    if (initialFiles.length > 0) {
      addFiles(initialFiles);
    } else {
      // Defer to after mount so the click can chain to the input element
      // that gets rendered below.
      setTimeout(() => fileInputRef.current?.click(), 0);
    }
    // We intentionally pin to mount-time only — initialFiles is sourced from
    // a single drag/click event and doesn't change after this view opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Defense-in-depth: if the popup tears the view down while an upload is
  // running (e.g. parent re-render, popup window closing on focus loss), abort
  // the controller so the in-flight XHRs don't keep transferring against a
  // dead component. The Back button is also disabled while uploading, so the
  // common path can't reach this — but extension popups can also be killed
  // out from under us.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    const accepted: Entry[] = [];
    const rejected: Entry[] = [];
    for (const file of files) {
      const id = newEntryId();
      if (file.size > UPLOAD_MAX_FILE_SIZE) {
        rejected.push({
          id,
          file,
          status: "rejected",
          error: `Exceeds ${formatBytes(UPLOAD_MAX_FILE_SIZE)} limit`,
        });
      } else {
        accepted.push({ id, file, status: "pending" });
      }
    }
    setEntries((prev) => [...prev, ...accepted, ...rejected]);
    if (accepted.length > 0) {
      void checkConflictsFor(accepted);
    }
  };

  const checkConflictsFor = async (newEntries: Entry[]) => {
    const names = newEntries
      .filter((e) => !conflictsCheckedFor.current.has(e.file.name))
      .map((e) => e.file.name);
    if (names.length === 0) return;
    for (const n of names) conflictsCheckedFor.current.add(n);

    const res = await sendMessage("checkUploadConflicts", {
      workspaceSlug,
      folderId,
      fileNames: names,
    });
    if (!res.ok) return; // Graceful degradation — proceed without conflict info.
    if (res.data.length === 0) return;

    const byName = new Map(
      res.data.map((c) => [c.name, { id: c.id, size: c.size }]),
    );
    setEntries((prev) =>
      prev.map((e) => {
        const match = byName.get(e.file.name);
        if (match && e.status === "pending" && !e.conflict) {
          return {
            ...e,
            conflict: {
              existingFileId: match.id,
              existingFileSize: match.size,
              resolution: null,
            },
          };
        }
        return e;
      }),
    );
  };

  const handlePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    e.target.value = ""; // allow re-picking the same file
    if (!list) return;
    addFiles(Array.from(list));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const resolveConflict = (id: string, resolution: "replace" | "keep-both") => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id && e.conflict
          ? { ...e, conflict: { ...e.conflict, resolution } }
          : e,
      ),
    );
  };

  const resolveAllConflicts = (resolution: "replace" | "keep-both") => {
    setEntries((prev) =>
      prev.map((e) =>
        e.conflict && e.conflict.resolution === null
          ? { ...e, conflict: { ...e.conflict, resolution } }
          : e,
      ),
    );
  };

  const updateEntry = (id: string, patch: Partial<Entry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  };

  const runUpload = async (entry: Entry, signal: AbortSignal) => {
    const init = await sendMessage("initiateUpload", {
      workspaceSlug,
      folderId,
      fileName: entry.file.name,
      fileSize: entry.file.size,
      contentType: entry.file.type || "application/octet-stream",
      conflictResolution: entry.conflict?.resolution ?? undefined,
    });
    if (!init.ok) throw new Error(init.error);
    const initData: InitiateUploadResponse = init.data;

    try {
      if (initData.strategy === "presigned-put") {
        await uploadPresignedPut(
          entry.file,
          initData.presignedUrl,
          (p) => updateEntry(entry.id, { progress: p.percentage }),
          signal,
        );
        const done = await sendMessage("completeUpload", {
          workspaceSlug,
          fileId: initData.fileId,
        });
        if (!done.ok) throw new Error(done.error);
      } else if (initData.strategy === "multipart") {
        const parts = await uploadMultipart(
          entry.file,
          initData.parts,
          initData.partSize,
          (p) => updateEntry(entry.id, { progress: p.percentage }),
          signal,
        );
        const done = await sendMessage("completeUpload", {
          workspaceSlug,
          fileId: initData.fileId,
          uploadId: initData.uploadId,
          parts,
        });
        if (!done.ok) throw new Error(done.error);
      } else {
        await uploadServerBuffered(
          entry.file,
          workspaceSlug,
          initData.fileId,
          (p) => updateEntry(entry.id, { progress: p.percentage }),
          signal,
        );
        // Server-buffered finalizes server-side (the streaming endpoint marks
        // the file ready when the body is fully consumed), so no completeUpload
        // call is needed in this branch.
      }
    } catch (err) {
      // Best-effort abort so partial S3 uploads don't strand multipart objects.
      try {
        await sendMessage("abortUpload", {
          workspaceSlug,
          fileId: initData.fileId,
          uploadId:
            initData.strategy === "multipart" ? initData.uploadId : undefined,
        });
      } catch {
        // ignore
      }
      throw err;
    }
  };

  const startUploads = async () => {
    setUploading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    // Snapshot the queue when the user clicks Upload — additions made while
    // uploading land in the next batch (i.e. they stay pending and the user
    // hits Upload again).
    const queue = entries.filter((e) => e.status === "pending");
    let successes = 0;
    let failures = 0;

    for (const entry of queue) {
      if (controller.signal.aborted) break;
      updateEntry(entry.id, { status: "uploading", progress: 0 });
      try {
        await runUpload(entry, controller.signal);
        successes += 1;
        successCountRef.current += 1;
        updateEntry(entry.id, { status: "done", progress: 100 });
      } catch (err) {
        if (controller.signal.aborted) {
          // Roll the active row back to pending so its progress bar clears
          // and the Upload button reappears for retry. Without this the row
          // is stranded in "uploading" with no remove affordance.
          updateEntry(entry.id, { status: "pending", progress: undefined });
          break;
        }
        failures += 1;
        const message = err instanceof Error ? err.message : "Upload failed";
        updateEntry(entry.id, { status: "error", error: message });
      }
    }

    setUploading(false);
    abortRef.current = null;

    if (successes > 0) onUploaded();

    // Auto-close on a clean run. If anything failed we keep the view open so
    // the user can read the per-row error. We use loop-local counters here
    // because reading `entries` would see pre-loop state — setEntries calls
    // we made above haven't flushed yet.
    if (failures === 0 && successes > 0 && !controller.signal.aborted) {
      onClose();
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const pending = useMemo(
    () => entries.filter((e) => e.status === "pending"),
    [entries],
  );
  const unresolvedConflicts = useMemo(
    () =>
      entries.filter(
        (e) => e.status === "pending" && e.conflict?.resolution === null,
      ),
    [entries],
  );
  const hasUnresolvedConflicts = unresolvedConflicts.length > 0;

  return (
    <div style={styles.root}>
      <div style={styles.headerRow}>
        <button
          style={uploading ? styles.backBtnDisabled : styles.backBtn}
          onClick={onClose}
          aria-label="Back"
          disabled={uploading}
          title={uploading ? "Cancel the upload first" : "Back"}
        >
          <ArrowLeft size={16} />
        </button>
        <span style={styles.title}>Upload</span>
        <button
          style={styles.addMoreBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Add files
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handlePicked}
        style={{ display: "none" }}
      />

      {entries.length === 0 ? (
        <button
          style={styles.dropzone}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={20} style={{ color: "#5a554f" }} />
          <span style={styles.dropzoneTitle}>Choose files to upload</span>
          <span style={styles.dropzoneSub}>
            Max {formatBytes(UPLOAD_MAX_FILE_SIZE)} per file
          </span>
        </button>
      ) : null}

      {unresolvedConflicts.length >= 2 && !uploading ? (
        <div style={styles.batchBar}>
          <span style={styles.batchText}>
            {unresolvedConflicts.length} files already exist
          </span>
          <div style={styles.batchActions}>
            <button
              style={styles.linkBtn}
              onClick={() => resolveAllConflicts("replace")}
            >
              Replace all
            </button>
            <span style={styles.divider}>|</span>
            <button
              style={styles.linkBtn}
              onClick={() => resolveAllConflicts("keep-both")}
            >
              Keep all
            </button>
          </div>
        </div>
      ) : null}

      {entries.length > 0 ? (
        <div style={styles.list}>
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              uploading={uploading}
              onRemove={() => removeEntry(entry.id)}
              onResolve={(r) => resolveConflict(entry.id, r)}
            />
          ))}
        </div>
      ) : null}

      {pending.length > 0 && !uploading ? (
        <button
          style={
            hasUnresolvedConflicts
              ? styles.primaryBtnDisabled
              : styles.primaryBtn
          }
          onClick={startUploads}
          disabled={hasUnresolvedConflicts}
        >
          <Upload size={14} />
          Upload {pending.length} {pending.length === 1 ? "file" : "files"}
        </button>
      ) : null}

      {uploading ? (
        <div style={styles.uploadingRow}>
          <button style={styles.primaryBtnDisabled} disabled>
            <Loader2 size={14} className="locker-spin" />
            Uploading…
          </button>
          <button style={styles.ghostBtn} onClick={cancel}>
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}

interface EntryRowProps {
  entry: Entry;
  uploading: boolean;
  onRemove: () => void;
  onResolve: (resolution: "replace" | "keep-both") => void;
}

function EntryRow({ entry, uploading, onRemove, onResolve }: EntryRowProps) {
  const showRemove =
    !uploading && (entry.status === "pending" || entry.status === "rejected");
  return (
    <div style={styles.entry}>
      <div style={styles.entryTop}>
        <FileText size={14} style={{ color: "#5a554f", flex: "0 0 auto" }} />
        <span style={styles.entryName} title={entry.file.name}>
          {entry.file.name}
        </span>
        <span style={styles.entrySize}>{formatBytes(entry.file.size)}</span>
        {entry.status === "done" ? (
          <CheckCircle
            size={14}
            style={{ color: "#1f9d55", flex: "0 0 auto" }}
          />
        ) : null}
        {entry.status === "error" || entry.status === "rejected" ? (
          <AlertCircle
            size={14}
            style={{ color: "#c94234", flex: "0 0 auto" }}
          />
        ) : null}
        {showRemove ? (
          <button
            style={styles.removeBtn}
            onClick={onRemove}
            aria-label={`Remove ${entry.file.name}`}
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      {entry.conflict && entry.status === "pending" && !uploading ? (
        <div style={styles.conflictRow}>
          {entry.conflict.resolution === null ? (
            <>
              <AlertTriangle
                size={12}
                style={{ color: "#d97706", flex: "0 0 auto" }}
              />
              <span style={styles.conflictText}>File exists</span>
              <button
                style={styles.linkBtn}
                onClick={() => onResolve("replace")}
              >
                Replace
              </button>
              <span style={styles.divider}>|</span>
              <button
                style={styles.linkBtn}
                onClick={() => onResolve("keep-both")}
              >
                Keep both
              </button>
            </>
          ) : (
            <span style={styles.conflictResolvedText}>
              {entry.conflict.resolution === "replace"
                ? "Will replace existing"
                : "Will keep both (renamed)"}
            </span>
          )}
        </div>
      ) : null}

      {entry.status === "uploading" && entry.progress !== undefined ? (
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${entry.progress}%`,
            }}
          />
        </div>
      ) : null}

      {(entry.status === "error" || entry.status === "rejected") &&
      entry.error ? (
        <div style={styles.errorText}>{entry.error}</div>
      ) : null}
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
  headerRow: { display: "flex", alignItems: "center", gap: 8 },
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
  backBtnDisabled: {
    width: 36,
    height: 36,
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(20, 17, 15, 0.045)",
    border: "1px solid transparent",
    borderRadius: 9999,
    cursor: "not-allowed",
    color: "#c4bfb8",
    fontFamily: "inherit",
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    color: "#14110f",
  },
  addMoreBtn: {
    background: "transparent",
    border: "1px solid rgba(20, 17, 15, 0.10)",
    padding: "6px 12px",
    borderRadius: 9999,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    color: "#14110f",
    fontFamily: "inherit",
  },
  dropzone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "28px 16px",
    background: "#fff",
    border: "2px dashed rgba(20, 17, 15, 0.12)",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  dropzoneTitle: { fontSize: 13.5, color: "#14110f", fontWeight: 500 },
  dropzoneSub: { fontSize: 11.5, color: "#79736a" },
  batchBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 8,
    background: "#fef6e7",
    border: "1px solid #f6dca8",
  },
  batchText: { fontSize: 12, color: "#a06414" },
  batchActions: { display: "inline-flex", alignItems: "center", gap: 6 },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxHeight: 220,
    overflowY: "auto",
  },
  entry: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "6px 8px",
    background: "rgba(20, 17, 15, 0.035)",
    borderRadius: 8,
  },
  entryTop: { display: "flex", alignItems: "center", gap: 6 },
  entryName: {
    flex: 1,
    fontSize: 12.5,
    color: "#14110f",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  entrySize: {
    fontSize: 11,
    color: "#5a554f",
    fontVariantNumeric: "tabular-nums",
    flex: "0 0 auto",
  },
  removeBtn: {
    width: 18,
    height: 18,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    color: "#5a554f",
    flex: "0 0 auto",
  },
  conflictRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    paddingLeft: 20,
  },
  conflictText: { fontSize: 11.5, color: "#a06414" },
  conflictResolvedText: {
    fontSize: 11.5,
    color: "#5a554f",
    paddingLeft: 20,
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontSize: 11.5,
    fontWeight: 600,
    color: "#3a62f5",
    fontFamily: "inherit",
  },
  divider: { fontSize: 11, color: "#c4bfb8" },
  progressTrack: {
    height: 3,
    background: "rgba(20, 17, 15, 0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#3a62f5",
    transition: "width 120ms ease",
  },
  errorText: { fontSize: 11.5, color: "#c94234", paddingLeft: 20 },
  primaryBtn: {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: "#3a62f5",
    color: "#fff",
    padding: "10px 14px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  primaryBtnDisabled: {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: "#9eb1f9",
    color: "#fff",
    padding: "10px 14px",
    border: "none",
    borderRadius: 10,
    cursor: "not-allowed",
    fontSize: 13.5,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  uploadingRow: { display: "flex", gap: 8 },
  ghostBtn: {
    background: "transparent",
    border: "1px solid rgba(20, 17, 15, 0.10)",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
    color: "#14110f",
  },
};
