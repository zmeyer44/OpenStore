import { createRoot } from "react-dom/client";
import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "../../utils/messaging";
import { webHost } from "../../utils/web-host";
import { PRIVACY_POLICY_URL } from "../../utils/constants";
import { FileBrowser } from "../../components/FileBrowser";
import { Logo } from "../../components/Logo";
import { UploadView } from "../../components/UploadView";
import { DropOverlay } from "../../components/DropOverlay";

interface BrowserContext {
  workspaceSlug: string;
  folderId: string | null;
}

function Popup() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [view, setView] = useState<"browse" | "upload">("browse");
  // Mirrors whatever folder/workspace the FileBrowser is currently on so a
  // drop or button click routes uploads to the right place. Null until the
  // browser has resolved a workspace.
  const [browserCtx, setBrowserCtx] = useState<BrowserContext | null>(null);
  const [uploadInitialFiles, setUploadInitialFiles] = useState<File[]>([]);
  // Bumped after a successful upload to force FileBrowser to refetch the
  // current folder. Without this the browser would show the pre-upload
  // listing until the user navigates somewhere else and back.
  const [refreshSignal, setRefreshSignal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Always re-probe the cookie on open: the user may have signed out from
      // another browser, or the session may have expired since they last
      // opened the extension.
      const ok = await sendMessage("refreshSession", undefined);
      if (!cancelled) setSignedIn(ok);
    })();

    // The auth-complete page broadcasts when sign-in lands so the popup picks
    // it up if it's still open in another window.
    const handler = (msg: { type?: string }) => {
      if (msg?.type === "locker:signed-in") setSignedIn(true);
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => {
      cancelled = true;
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, []);

  const handleContextChange = useCallback((ctx: BrowserContext) => {
    setBrowserCtx(ctx);
  }, []);

  const handleUploadClick = useCallback(() => {
    if (!browserCtx) return;
    setUploadInitialFiles([]);
    setView("upload");
  }, [browserCtx]);

  const handleFilesDropped = useCallback(
    (files: File[]) => {
      if (!browserCtx) return;
      setUploadInitialFiles(files);
      setView("upload");
    },
    [browserCtx],
  );

  const handleUploadClose = useCallback(() => {
    setView("browse");
    setUploadInitialFiles([]);
  }, []);

  const handleUploaded = useCallback(() => {
    setRefreshSignal((n) => n + 1);
  }, []);

  const signIn = () => {
    const returnUrl = chrome.runtime.getURL("auth-complete.html");
    const url = `${webHost()}/extension-signin?return=${encodeURIComponent(returnUrl)}`;
    chrome.tabs.create({ url });
    window.close();
  };

  const signOut = async () => {
    await sendMessage("signOut", undefined);
    setSignedIn(false);
  };

  if (signedIn === null) {
    return (
      <div style={styles.container}>
        <Header />
        <div style={styles.body}>Loading…</div>
        <Footer />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div style={styles.container}>
        <Header />
        <p style={styles.body}>
          Sign in to browse your Locker workspace files from any tab.
        </p>
        <button style={styles.primaryButton} onClick={signIn}>
          Sign in
        </button>
        <Footer />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />
      {/* Keep FileBrowser mounted while UploadView is showing so navigation
          state (active workspace, current folder, breadcrumbs) survives a
          round trip through the upload flow. */}
      <div style={view === "upload" ? styles.hidden : undefined}>
        <FileBrowser
          mode="browse"
          onContextChange={handleContextChange}
          onUpload={handleUploadClick}
          refreshSignal={refreshSignal}
        />
      </div>
      {view === "upload" && browserCtx ? (
        <UploadView
          workspaceSlug={browserCtx.workspaceSlug}
          folderId={browserCtx.folderId}
          initialFiles={uploadInitialFiles}
          onClose={handleUploadClose}
          onUploaded={handleUploaded}
        />
      ) : null}
      <button style={styles.secondaryButton} onClick={signOut}>
        Sign out
      </button>
      <Footer />
      {/* Drop overlay is mounted only while browsing — UploadView has its own
          "Add files" affordance and we don't want a second drop target
          competing with it. */}
      {view === "browse" ? (
        <DropOverlay onFilesDropped={handleFilesDropped} />
      ) : null}
    </div>
  );
}

function Header() {
  return (
    <div style={styles.header}>
      <Logo style={styles.logoMark} aria-hidden="true" />
      <span style={styles.logo}>Locker</span>
    </div>
  );
}

function Footer() {
  // chrome.tabs is preferable to plain href so the popup can close cleanly
  // and the link opens in a regular tab rather than a popup-sized window.
  const openPrivacy = () => {
    chrome.tabs.create({ url: PRIVACY_POLICY_URL });
    window.close();
  };
  return (
    <div style={styles.footer}>
      <button type="button" style={styles.footerLink} onClick={openPrivacy}>
        Privacy policy
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  hidden: { display: "none" },
  header: { display: "flex", alignItems: "center", gap: 8 },
  logoMark: { width: 22, height: 22, color: "#3a62f5", flex: "0 0 auto" },
  logo: { fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" },
  body: { color: "#5a554f", lineHeight: 1.5, margin: 0, fontSize: 13.5 },
  primaryButton: {
    width: "100%",
    background: "#3a62f5",
    color: "#fff",
    padding: "10px 14px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  secondaryButton: {
    width: "100%",
    background: "#fff",
    color: "#14110f",
    padding: "8px 12px",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    paddingTop: 4,
    borderTop: "1px solid rgba(20, 17, 15, 0.06)",
    marginTop: 2,
  },
  footerLink: {
    background: "transparent",
    border: "none",
    padding: "6px 8px",
    color: "#79736a",
    fontSize: 11.5,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "none",
  },
};

const root = document.getElementById("root");
if (root) createRoot(root).render(<Popup />);
