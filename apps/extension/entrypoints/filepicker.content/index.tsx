import { defineContentScript } from "wxt/utils/define-content-script";
import { createRoot, type Root } from "react-dom/client";
import { StrictMode, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { FileBrowser } from "../../components/FileBrowser";
import { GenerateView } from "../../components/GenerateView";
import { Logo } from "../../components/Logo";
import { sendMessage, type FileRow } from "../../utils/messaging";
import { isSignedIn } from "../../utils/storage";

export default defineContentScript({
  matches: ["<all_urls>"],
  // Run before the page's own click handlers can pop the OS file picker.
  runAt: "document_start",
  async main() {
    // ── 1. The intercept ───────────────────────────────────────────────
    // Pages that want a fallback to the native picker call into here. We
    // mark the input as "let the next click pass through" so our own
    // re-trigger doesn't loop back into this handler.
    const passthrough = new WeakSet<HTMLInputElement>();

    function findFileInput(
      target: EventTarget | null,
    ): HTMLInputElement | null {
      // Walk the composed path so clicks on <label> or shadow-DOM children
      // still resolve to the underlying input. The browser dispatches the
      // click on the input itself when a label is activated, but we also
      // want to handle JS-initiated `input.click()` calls.
      if (!(target instanceof HTMLInputElement)) return null;
      if (target.type !== "file") return null;
      if (target.disabled) return null;
      return target;
    }

    function onClickCapture(e: MouseEvent) {
      const input = findFileInput(e.target);
      if (!input) return;
      if (passthrough.has(input)) {
        passthrough.delete(input);
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      void openDialogFor(input);
    }

    document.addEventListener("click", onClickCapture, true);

    // ── 2. Dialog mount ────────────────────────────────────────────────
    let mountHost: HTMLElement | null = null;
    let mountRoot: Root | null = null;

    function ensureMount(): { host: HTMLElement; root: Root } {
      if (mountHost && mountRoot) return { host: mountHost, root: mountRoot };
      mountHost = document.createElement("div");
      mountHost.style.cssText =
        "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;";
      // Shadow DOM so the page's CSS can't bleed in and rewrite our styles.
      const shadow = mountHost.attachShadow({ mode: "open" });
      const inner = document.createElement("div");
      inner.style.cssText = "pointer-events: auto;";
      shadow.appendChild(inner);
      // We also want lucide icons / spinner CSS inside the shadow root.
      const style = document.createElement("style");
      style.textContent = `
        .locker-spin { animation: locker-spin 0.8s linear infinite; }
        @keyframes locker-spin { to { transform: rotate(360deg); } }
      `;
      shadow.appendChild(style);
      document.documentElement.appendChild(mountHost);
      mountRoot = createRoot(inner);
      return { host: mountHost, root: mountRoot };
    }

    function unmount() {
      if (mountRoot) mountRoot.render(null);
    }

    function parseAccept(input: HTMLInputElement): string[] | undefined {
      // input.accept is a comma-separated list per HTML5; whitespace around
      // tokens is allowed. Empty string ⇒ no constraint, treat as undefined.
      const raw = input.accept?.trim();
      if (!raw) return undefined;
      const tokens = raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return tokens.length > 0 ? tokens : undefined;
    }

    async function openDialogFor(input: HTMLInputElement) {
      const signedIn = await isSignedIn();
      const accept = parseAccept(input);
      const { root } = ensureMount();

      const close = () => unmount();

      const useComputer = () => {
        // Re-fire the click but mark it as a passthrough so our own listener
        // ignores it and the OS picker opens. Stay inside the synchronous
        // user-activation window — Chrome blocks file pickers from clicks
        // dispatched after a setTimeout boundary.
        passthrough.add(input);
        input.click();
        close();
      };

      const useLocker = async (file: FileRow, workspaceSlug: string) => {
        const result = await sendMessage("fetchFileForUpload", {
          workspaceSlug,
          fileId: file.id,
        });
        if (!result.ok) {
          // Surface the error inside the dialog instead of leaving the user
          // staring at a half-finished modal. The dialog component owns
          // error state; we just rerender it.
          root.render(
            <Dialog
              onUseComputer={useComputer}
              onClose={close}
              signedIn={signedIn}
              error={result.error}
              onPickLocker={useLocker}
              onGenerated={useGenerated}
              accept={accept}
            />,
          );
          return;
        }
        injectFile(input, result.data);
        close();
      };

      const useGenerated = (meta: {
        name: string;
        mimeType: string;
        size: number;
        dataBase64: string;
      }) => {
        injectFile(input, meta);
        close();
      };

      root.render(
        <StrictMode>
          <Dialog
            onUseComputer={useComputer}
            onClose={close}
            signedIn={signedIn}
            onPickLocker={useLocker}
            onGenerated={useGenerated}
            accept={accept}
          />
        </StrictMode>,
      );
    }

    function injectFile(
      input: HTMLInputElement,
      meta: {
        name: string;
        mimeType: string;
        size: number;
        dataBase64: string;
      },
    ) {
      const binary = atob(meta.dataBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], meta.name, { type: meta.mimeType });

      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;

      // Pages typically wire onChange (React) or addEventListener('change'),
      // but some libs listen on 'input' too. Fire both, bubbling, composed
      // so handlers attached above shadow boundaries see them.
      input.dispatchEvent(
        new Event("input", { bubbles: true, composed: true }),
      );
      input.dispatchEvent(
        new Event("change", { bubbles: true, composed: true }),
      );
    }
  },
});

interface DialogProps {
  signedIn: boolean;
  onUseComputer: () => void;
  onClose: () => void;
  onPickLocker: (file: FileRow, workspaceSlug: string) => void | Promise<void>;
  onGenerated: (meta: {
    name: string;
    mimeType: string;
    size: number;
    dataBase64: string;
  }) => void;
  error?: string;
  accept?: string[];
}

function Dialog({
  signedIn,
  onUseComputer,
  onClose,
  onPickLocker,
  onGenerated,
  error,
  accept,
}: DialogProps) {
  const [view, setView] = useState<"choose" | "locker" | "generate">("choose");

  const headerTitle =
    view === "locker"
      ? "From Locker"
      : view === "generate"
        ? "Generate with AI"
        : "Choose a file";

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={panelHeader}>
          <span style={brandRow}>
            <Logo style={brandLogo} aria-hidden="true" />
            <span style={brandLabel}>Locker</span>
            <span style={brandSep}>·</span>
            <span style={brandTitle}>{headerTitle}</span>
          </span>
          <button style={closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {error ? <div style={errorBox}>{error}</div> : null}

        {view === "choose" ? (
          <>
            <div style={chooseGrid}>
              <button style={choiceBtn} onClick={() => setView("locker")}>
                <span style={choiceTitle}>From Locker</span>
                <span style={choiceSub}>
                  {signedIn
                    ? "Pick a file from your workspace"
                    : "Sign in to your Locker account"}
                </span>
              </button>
              <button style={choiceBtn} onClick={onUseComputer}>
                <span style={choiceTitle}>From Computer</span>
                <span style={choiceSub}>Open the standard file picker</span>
              </button>
            </div>
            <button
              style={generateChoiceBtn}
              onClick={() => setView("generate")}
            >
              <Sparkles size={14} />
              Generate with AI
            </button>
          </>
        ) : view === "locker" ? (
          signedIn ? (
            <FileBrowser
              mode="pick"
              onPickFile={(f, slug) => onPickLocker(f, slug)}
              onClose={() => setView("choose")}
              height={320}
              accept={accept}
            />
          ) : (
            <SignInPrompt onBack={() => setView("choose")} />
          )
        ) : signedIn ? (
          <GenerateView
            accept={accept}
            onBack={() => setView("choose")}
            onGenerated={onGenerated}
          />
        ) : (
          <SignInPrompt onBack={() => setView("choose")} />
        )}
      </div>
    </div>
  );
}

function SignInPrompt({ onBack }: { onBack: () => void }) {
  const handle = () => {
    chrome.runtime
      .sendMessage({ type: "locker:open-popup-signin" })
      .catch(() => undefined);
    onBack();
  };
  return (
    <div style={{ padding: 16, textAlign: "center" }}>
      <p style={{ color: "#5a554f", margin: "4px 0 12px", fontSize: 13.5 }}>
        Sign in via the Locker extension popup, then come back and click the
        upload button again.
      </p>
      <button style={primaryBtn} onClick={handle}>
        Open extension
      </button>
      <button style={ghostBtn} onClick={onBack}>
        Back
      </button>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 15, 15, 0.42)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const panel: React.CSSProperties = {
  width: 460,
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "calc(100vh - 64px)",
  overflow: "auto",
  background: "#fbfaf7",
  color: "#14110f",
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 14,
  gap: 8,
};

const brandRow: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
};

const brandLogo: React.CSSProperties = {
  width: 20,
  height: 20,
  color: "#3a62f5",
  flex: "0 0 auto",
};

const brandLabel: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: "-0.01em",
  color: "#14110f",
};

const brandSep: React.CSSProperties = {
  color: "#9e9890",
  fontSize: 14,
};

const brandTitle: React.CSSProperties = {
  color: "#5a554f",
  fontSize: 13.5,
  fontWeight: 500,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const closeBtn: React.CSSProperties = {
  width: 32,
  height: 32,
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
  transition: "background 120ms ease",
};

const chooseGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const choiceBtn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 4,
  padding: "14px 14px",
  background: "#fff",
  border: "1px solid rgba(20, 17, 15, 0.10)",
  borderRadius: 12,
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  color: "#14110f",
};

const choiceTitle: React.CSSProperties = { fontWeight: 600, fontSize: 14 };
const choiceSub: React.CSSProperties = { color: "#5a554f", fontSize: 12 };

const generateChoiceBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "10px 14px",
  background: "#3a62f5",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "inherit",
};

const primaryBtn: React.CSSProperties = {
  background: "#3a62f5",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  marginRight: 8,
  fontFamily: "inherit",
};

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(0,0,0,0.12)",
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
