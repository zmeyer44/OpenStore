import dynamic from "next/dynamic";

const DocxViewer = dynamic(
  () =>
    import("@/components/docx-viewer").then((m) => ({ default: m.DocxViewer })),
  { ssr: false },
);

export function DocxPreview({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <div style={{ height: "100%" }}>
      <DocxViewer url={url} showThumbnails={false} />
    </div>
  );
}
