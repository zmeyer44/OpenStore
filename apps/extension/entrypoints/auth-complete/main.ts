import { setSignedIn } from "../../utils/storage";

const status = document.getElementById("status");
const params = new URLSearchParams(location.search);
const ok = params.get("ok");

if (ok !== "1") {
  if (status)
    status.textContent = "Sign-in did not complete. Please try again.";
} else {
  setSignedIn(true)
    .then(() => {
      if (status) status.textContent = "Signed in — you can close this tab.";
      // Tell anyone listening (popup) that we're signed in. The popup also
      // re-checks on visibility change, but a runtime ping makes it instant.
      chrome.runtime
        .sendMessage({ type: "locker:signed-in" })
        .catch(() => undefined);
      setTimeout(() => window.close(), 400);
    })
    .catch((err) => {
      console.error("[locker] auth-complete failed", err);
      if (status) status.textContent = "Failed to store sign-in state.";
    });
}
