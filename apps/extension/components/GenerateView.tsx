import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  Loader2,
  Paperclip,
  RotateCcw,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import {
  sendMessage,
  type FileRow,
  type GenerationTypeRow,
} from "../utils/messaging";
import { Select } from "./Select";
import { FileBrowser } from "./FileBrowser";

interface GenerateViewProps {
  // HTML5 input.accept tokens. We narrow the available generation kinds to
  // ones that satisfy at least one token; if accept is unset, everything is
  // available.
  accept?: string[];
  // Called once a generated file is ready — same shape as fetchFileForUpload.
  onGenerated: (meta: {
    name: string;
    mimeType: string;
    size: number;
    dataBase64: string;
  }) => void;
  onBack: () => void;
}

interface ComputerAttachment {
  kind: "computer";
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataBase64: string;
}

interface LockerAttachment {
  kind: "locker";
  id: string; // file id
  name: string;
  mimeType: string;
  size: number;
}

type AttachmentRow = ComputerAttachment | LockerAttachment;

function matchesAcceptToken(type: GenerationTypeRow, token: string): boolean {
  const t = token.trim().toLowerCase();
  if (!t || t === "*/*" || t === "*") return true;
  if (t.includes("/")) {
    if (t.endsWith("/*")) {
      const prefix = t.slice(0, -1); // "image/"
      return type.mimeType.toLowerCase().startsWith(prefix);
    }
    return type.mimeType.toLowerCase() === t;
  }
  if (t.startsWith(".")) {
    return type.extension.toLowerCase() === t;
  }
  return false;
}

function filterTypesByAccept(
  types: GenerationTypeRow[],
  accept: string[] | undefined,
): GenerationTypeRow[] {
  if (!accept || accept.length === 0) return types;
  return types.filter((t) => accept.some((tok) => matchesAcceptToken(t, tok)));
}

function blobFromBase64(b64: string, mimeType: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

interface GeneratedFile {
  name: string;
  mimeType: string;
  size: number;
  dataBase64: string;
}

export function GenerateView({
  accept,
  onGenerated,
  onBack,
}: GenerateViewProps) {
  const [allTypes, setAllTypes] = useState<GenerationTypeRow[] | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The latest generated file. While this is set we render the preview
  // surface instead of the initial composer; the user can either accept it
  // or send it back through the model with a refinement instruction.
  const [result, setResult] = useState<GeneratedFile | null>(null);
  const [refinePrompt, setRefinePrompt] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await sendMessage("listGenerationTypes", undefined);
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error);
        setAllTypes([]);
        return;
      }
      setAllTypes(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableTypes = useMemo(
    () => filterTypesByAccept(allTypes ?? [], accept),
    [allTypes, accept],
  );

  // Default the type to whatever the page would accept first. If the catalog
  // changes (e.g. user lands here without sign-in and re-fetches later) and
  // the previously selected id is no longer available, reset.
  useEffect(() => {
    if (!availableTypes.length) {
      setTypeId(null);
      return;
    }
    if (!typeId || !availableTypes.some((t) => t.id === typeId)) {
      setTypeId(availableTypes[0]!.id);
    }
  }, [availableTypes, typeId]);

  const removeAttachment = (id: string) => {
    setAttachments((rows) => rows.filter((r) => r.id !== id));
  };

  const handleComputerPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    try {
      const dataBase64 = await fileToBase64(file);
      setAttachments((rows) => [
        ...rows,
        {
          kind: "computer",
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          dataBase64,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    }
  };

  const handleLockerPick = (file: FileRow) => {
    if (attachments.some((a) => a.kind === "locker" && a.id === file.id)) {
      setPickerOpen(false);
      return;
    }
    setAttachments((rows) => [
      ...rows,
      {
        kind: "locker",
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
      },
    ]);
    setPickerOpen(false);
  };

  const submit = async () => {
    if (!typeId) return;
    if (!prompt.trim()) {
      setError("Add a prompt describing the file you want.");
      return;
    }
    const slug = await sendMessage("getActiveWorkspace", undefined);
    if (!slug) {
      setError("No active workspace. Open the extension popup to choose one.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const computerAttachments = attachments
        .filter((a): a is ComputerAttachment => a.kind === "computer")
        .map((a) => ({
          name: a.name,
          mimeType: a.mimeType,
          dataBase64: a.dataBase64,
        }));
      const lockerFileIds = attachments
        .filter((a): a is LockerAttachment => a.kind === "locker")
        .map((a) => a.id);

      const res = await sendMessage("generateFile", {
        workspaceSlug: slug,
        typeId,
        prompt: prompt.trim(),
        attachments: computerAttachments,
        lockerFileIds,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res.data);
      setRefinePrompt("");
    } finally {
      setGenerating(false);
    }
  };

  // Iterate on a generated file. We send the previous output back as an
  // in-memory attachment alongside the user's edit instructions so the model
  // sees the artifact it produced as context for the new request.
  const refine = async () => {
    if (!typeId || !result) return;
    if (!refinePrompt.trim()) {
      setError("Describe what you'd like to change.");
      return;
    }
    const slug = await sendMessage("getActiveWorkspace", undefined);
    if (!slug) {
      setError("No active workspace. Open the extension popup to choose one.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      // Carry forward the original composer attachments too — refinements
      // should still see whatever reference material the user supplied at
      // the start of the conversation, plus the previous output.
      const carryComputer = attachments
        .filter((a): a is ComputerAttachment => a.kind === "computer")
        .map((a) => ({
          name: a.name,
          mimeType: a.mimeType,
          dataBase64: a.dataBase64,
        }));
      const carryLocker = attachments
        .filter((a): a is LockerAttachment => a.kind === "locker")
        .map((a) => a.id);

      const res = await sendMessage("generateFile", {
        workspaceSlug: slug,
        typeId,
        prompt: refinePrompt.trim(),
        attachments: [
          ...carryComputer,
          {
            name: result.name,
            mimeType: result.mimeType,
            dataBase64: result.dataBase64,
          },
        ],
        lockerFileIds: carryLocker,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res.data);
      setRefinePrompt("");
    } finally {
      setGenerating(false);
    }
  };

  const startOver = () => {
    setResult(null);
    setRefinePrompt("");
    setError(null);
  };

  if (pickerOpen) {
    return (
      <FileBrowser
        mode="pick"
        onPickFile={(f) => handleLockerPick(f)}
        onClose={() => setPickerOpen(false)}
        height={320}
      />
    );
  }

  if (!allTypes) {
    return (
      <div style={loadingRow}>
        <Loader2 size={16} className="locker-spin" /> Loading…
      </div>
    );
  }

  if (availableTypes.length === 0) {
    return (
      <div style={emptyBox}>
        <p style={{ margin: "0 0 12px", color: "#5a554f", fontSize: 13.5 }}>
          Locker can't generate any of the file types this page accepts
          {accept ? ` (${accept.join(", ")})` : ""}.
        </p>
        <button style={ghostBtn} onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  const selectedType = availableTypes.find((t) => t.id === typeId) ?? null;

  return (
    <div style={root}>
      <div style={topRow}>
        <button style={iconGhostBtn} onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        {availableTypes.length > 1 ? (
          <Select
            value={typeId}
            options={availableTypes.map((t) => ({
              value: t.id,
              label: t.label,
              description: t.description,
            }))}
            onChange={(id) => setTypeId(id)}
          />
        ) : (
          <div style={singleTypePill}>
            <span style={{ fontWeight: 600 }}>{selectedType?.label}</span>
            {selectedType?.description ? (
              <span style={{ color: "#5a554f", fontSize: 12 }}>
                · {selectedType.description}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {error ? <div style={errorBox}>{error}</div> : null}

      {result ? (
        <PreviewSurface
          file={result}
          generating={generating}
          refinePrompt={refinePrompt}
          onRefinePromptChange={setRefinePrompt}
          onRefine={refine}
          onUse={() => onGenerated(result)}
          onStartOver={startOver}
        />
      ) : (
        <div style={composer}>
          <textarea
            style={textarea}
            placeholder={`Describe the ${selectedType?.label?.toLowerCase() ?? "file"} you want…`}
            value={prompt}
            rows={4}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
          />

          {attachments.length > 0 ? (
            <div style={attachmentList}>
              {attachments.map((a) => (
                <div key={a.id} style={attachmentChip} title={a.name}>
                  <span style={attachmentDot(a.kind)} />
                  <span style={attachmentName}>{a.name}</span>
                  <button
                    style={removeBtn}
                    onClick={() => removeAttachment(a.id)}
                    aria-label={`Remove ${a.name}`}
                    disabled={generating}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div style={composerActions}>
            <AttachMenu
              disabled={generating}
              onChooseComputer={() => fileInputRef.current?.click()}
              onChooseLocker={() => setPickerOpen(true)}
            />
            <button
              type="button"
              style={generateBtn}
              onClick={submit}
              disabled={generating || !prompt.trim() || !typeId}
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="locker-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generate
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleComputerPick}
      />
    </div>
  );
}

interface PreviewSurfaceProps {
  file: GeneratedFile;
  generating: boolean;
  refinePrompt: string;
  onRefinePromptChange: (s: string) => void;
  onRefine: () => void;
  onUse: () => void;
  onStartOver: () => void;
}

function PreviewSurface({
  file,
  generating,
  refinePrompt,
  onRefinePromptChange,
  onRefine,
  onUse,
  onStartOver,
}: PreviewSurfaceProps) {
  const isImage = file.mimeType.startsWith("image/");
  const isText =
    file.mimeType.startsWith("text/") ||
    ["application/json", "application/xml", "application/javascript"].includes(
      file.mimeType,
    );

  // Image previews come straight from the in-memory base64 — no need to
  // round-trip through a Blob URL since the data is already in scope.
  const imageDataUrl = isImage
    ? `data:${file.mimeType};base64,${file.dataBase64}`
    : null;
  // Text previews decode once and clamp; refining replaces the file so we
  // recompute on every render (cheap for the small caps we accept).
  const textPreview = isText
    ? decodeBase64Utf8(file.dataBase64).slice(0, 4000)
    : null;

  return (
    <>
      <div style={previewCard}>
        {isImage && imageDataUrl ? (
          <img src={imageDataUrl} alt={file.name} style={previewImage} />
        ) : isText && textPreview != null ? (
          <pre style={previewText}>{textPreview}</pre>
        ) : (
          <div style={previewGeneric}>
            <FileText size={28} />
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{file.name}</div>
            <div style={{ color: "#5a554f", fontSize: 12 }}>
              Preview not available — use the file or refine to retry.
            </div>
          </div>
        )}
        <div style={previewMeta}>
          <span style={previewName} title={file.name}>
            {file.name}
          </span>
          <span style={previewSize}>{formatBytes(file.size)}</span>
        </div>
      </div>

      <div style={previewActions}>
        <button
          type="button"
          style={ghostBtn}
          onClick={onStartOver}
          disabled={generating}
        >
          <RotateCcw size={14} /> Start over
        </button>
        <button
          type="button"
          style={generateBtn}
          onClick={onUse}
          disabled={generating}
        >
          <Check size={14} /> Use this file
        </button>
      </div>

      <div style={composer}>
        <textarea
          style={textarea}
          placeholder="What should change? e.g. 'make the sky more orange', 'add a section about pricing'…"
          value={refinePrompt}
          rows={3}
          onChange={(e) => onRefinePromptChange(e.target.value)}
          disabled={generating}
        />
        <div style={composerActions}>
          <span style={refineHint}>
            We'll send this file back to the model along with your edits.
          </span>
          <button
            type="button"
            style={generateBtn}
            onClick={onRefine}
            disabled={generating || !refinePrompt.trim()}
          >
            {generating ? (
              <>
                <Loader2 size={14} className="locker-spin" /> Refining…
              </>
            ) : (
              <>
                <Wand2 size={14} /> Refine
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function decodeBase64Utf8(b64: string): string {
  // Decode base64 → bytes → UTF-8 string. We avoid TextDecoder.decode on the
  // result of atob() directly since atob produces a Latin-1 string; that
  // round-trip mangles multi-byte characters. Going through Uint8Array gives
  // us proper UTF-8 reconstruction.
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return "";
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

interface AttachMenuProps {
  disabled?: boolean;
  onChooseComputer: () => void;
  onChooseLocker: () => void;
}

function AttachMenu({
  disabled,
  onChooseComputer,
  onChooseLocker,
}: AttachMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Outside-click + Escape close. composedPath lets this work when the menu
  // is mounted inside the content-script's shadow root — the path includes
  // the wrap even though `target` would be the shadow host.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const path = e.composedPath ? e.composedPath() : [];
      if (
        wrapRef.current &&
        (path.includes(wrapRef.current) ||
          wrapRef.current.contains(e.target as Node))
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (handler: () => void) => {
    setOpen(false);
    handler();
  };

  return (
    <div ref={wrapRef} style={attachWrap}>
      <button
        ref={triggerRef}
        type="button"
        style={attachBtn}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Paperclip size={14} /> Attach
        <ChevronDown size={12} style={{ opacity: 0.6 }} />
      </button>

      {open ? (
        <div role="menu" style={attachMenu}>
          <button
            type="button"
            role="menuitem"
            style={attachMenuItem}
            onClick={() => choose(onChooseComputer)}
          >
            <Upload size={16} style={{ color: "#5a554f", flex: "0 0 auto" }} />
            <span>
              Upload from computer
              <span style={attachMenuItemSub}>
                Pick a file from this device
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            style={attachMenuItem}
            onClick={() => choose(onChooseLocker)}
          >
            <FolderOpen
              size={16}
              style={{ color: "#3a62f5", flex: "0 0 auto" }}
            />
            <span>
              Choose from Locker
              <span style={attachMenuItemSub}>
                Pull a file from your workspace
              </span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

const root: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  fontFamily: "inherit",
};

const topRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const iconGhostBtn: React.CSSProperties = {
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
};

const singleTypePill: React.CSSProperties = {
  flex: 1,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "0 14px",
  height: 36,
  background: "rgba(20, 17, 15, 0.045)",
  border: "1px solid transparent",
  borderRadius: 9999,
  fontSize: 13,
};

const composer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 10,
  background: "#fff",
  border: "1px solid rgba(20, 17, 15, 0.10)",
  borderRadius: 14,
};

const textarea: React.CSSProperties = {
  width: "100%",
  resize: "vertical",
  minHeight: 80,
  border: "none",
  outline: "none",
  background: "transparent",
  fontFamily: "inherit",
  fontSize: 13.5,
  color: "#14110f",
  padding: 0,
  lineHeight: 1.45,
};

const composerActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 6,
};

const attachWrap: React.CSSProperties = {
  position: "relative",
};

const attachBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  background: "rgba(20, 17, 15, 0.045)",
  border: "1px solid transparent",
  borderRadius: 9999,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
  color: "#14110f",
  fontFamily: "inherit",
};

const attachMenu: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 6px)",
  left: 0,
  zIndex: 100,
  minWidth: 200,
  background: "#fff",
  border: "1px solid rgba(20, 17, 15, 0.10)",
  borderRadius: 14,
  padding: 6,
  boxShadow: "0 14px 40px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const attachMenuItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  background: "transparent",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  color: "#14110f",
  fontFamily: "inherit",
  textAlign: "left",
  width: "100%",
};

const attachMenuItemSub: React.CSSProperties = {
  display: "block",
  color: "#5a554f",
  fontSize: 11.5,
  fontWeight: 400,
  marginTop: 2,
};

const generateBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  background: "#3a62f5",
  color: "#fff",
  border: "none",
  borderRadius: 9999,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
};

const attachmentList: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const attachmentChip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 4px 4px 10px",
  background: "rgba(20, 17, 15, 0.05)",
  borderRadius: 9999,
  fontSize: 12,
  maxWidth: 220,
};

const attachmentDot = (kind: "computer" | "locker"): React.CSSProperties => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: kind === "locker" ? "#3a62f5" : "#9e9890",
  flex: "0 0 auto",
});

const attachmentName: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const removeBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  background: "transparent",
  border: "none",
  borderRadius: 9999,
  cursor: "pointer",
  color: "#5a554f",
};

const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "transparent",
  border: "1px solid rgba(20, 17, 15, 0.10)",
  padding: "8px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "inherit",
  color: "#14110f",
};

const errorBox: React.CSSProperties = {
  padding: "8px 10px",
  background: "#fbe9e6",
  color: "#8a261d",
  fontSize: 12,
  borderRadius: 8,
};

const loadingRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: 16,
  color: "#5a554f",
};

const emptyBox: React.CSSProperties = { padding: 16 };

const previewCard: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background: "#fff",
  border: "1px solid rgba(20, 17, 15, 0.10)",
  borderRadius: 14,
  overflow: "hidden",
};

const previewImage: React.CSSProperties = {
  display: "block",
  width: "100%",
  maxHeight: 320,
  objectFit: "contain",
  background:
    "repeating-conic-gradient(rgba(20,17,15,0.04) 0% 25%, transparent 0% 50%) 50% / 20px 20px",
};

const previewText: React.CSSProperties = {
  margin: 0,
  padding: 12,
  maxHeight: 280,
  overflow: "auto",
  background: "#fbfaf7",
  fontFamily:
    "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
  fontSize: 12,
  lineHeight: 1.5,
  color: "#14110f",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const previewGeneric: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  padding: 24,
  color: "#5a554f",
  textAlign: "center",
};

const previewMeta: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 12px",
  borderTop: "1px solid rgba(20, 17, 15, 0.06)",
  background: "rgba(20, 17, 15, 0.02)",
};

const previewName: React.CSSProperties = {
  fontSize: 12,
  color: "#14110f",
  fontWeight: 500,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const previewSize: React.CSSProperties = {
  fontSize: 11,
  color: "#5a554f",
  fontVariantNumeric: "tabular-nums",
  flex: "0 0 auto",
};

const previewActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const refineHint: React.CSSProperties = {
  flex: 1,
  fontSize: 11.5,
  color: "#5a554f",
};

// blobFromBase64 stays nearby in case the dialog wants to do client-side
// validation later — the inject path lives in filepicker.content.
void blobFromBase64;
