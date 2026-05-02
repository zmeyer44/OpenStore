import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { sendMessage } from "../../utils/messaging";
import { webHost } from "../../utils/web-host";
import { FileBrowser } from "../../components/FileBrowser";

function Popup() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

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
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />
      <FileBrowser mode="browse" />
      <button style={styles.secondaryButton} onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}

function Header() {
  return (
    <div style={styles.header}>
      <span style={styles.logoDot} />
      <span style={styles.logo}>Locker</span>
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
  header: { display: "flex", alignItems: "center", gap: 8 },
  logoDot: {
    display: "inline-block",
    width: 12,
    height: 12,
    borderRadius: 3,
    background: "#3a62f5",
  },
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
};

const root = document.getElementById("root");
if (root) createRoot(root).render(<Popup />);
