import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";

interface DropOverlayProps {
  // Called once a drag-drop sequence ends with a non-empty file list. The
  // popup converts the dropped files into an UploadView; this component is
  // only responsible for surfacing the affordance.
  onFilesDropped: (files: File[]) => void;
}

export function DropOverlay({ onFilesDropped }: DropOverlayProps) {
  const [show, setShow] = useState(false);
  // Browsers fire dragenter/dragleave for every child, including children
  // hidden under the overlay itself once it mounts. A counter approach
  // (reference-counted enter/leave) is the standard way to keep the overlay
  // visible while the user drags around inside the popup.
  const counter = useRef(0);

  const onEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer?.types.includes("Files")) return;
    counter.current += 1;
    if (counter.current === 1) setShow(true);
  }, []);

  const onLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    counter.current = Math.max(0, counter.current - 1);
    if (counter.current === 0) setShow(false);
  }, []);

  const onOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      counter.current = 0;
      setShow(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) onFilesDropped(files);
    },
    [onFilesDropped],
  );

  useEffect(() => {
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [onEnter, onLeave, onOver, onDrop]);

  if (!show) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <Upload size={20} style={{ color: "#3a62f5" }} />
        </div>
        <div style={styles.title}>Drop to upload</div>
        <div style={styles.sub}>Release to add files to your workspace</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(247, 247, 245, 0.85)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    pointerEvents: "none",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "20px 18px",
    border: "2px dashed #3a62f5",
    background: "rgba(58, 98, 245, 0.04)",
    borderRadius: 14,
    width: "100%",
    boxSizing: "border-box",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    background: "rgba(58, 98, 245, 0.12)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: "#14110f",
  },
  sub: {
    fontSize: 12,
    color: "#5a554f",
    textAlign: "center",
  },
};
