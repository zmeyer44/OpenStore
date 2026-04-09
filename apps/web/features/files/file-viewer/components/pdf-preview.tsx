import dynamic from "next/dynamic";

const PDFViewer = dynamic(
  () =>
    import("@/components/pdf-viewer").then((m) => ({ default: m.PDFViewer })),
  { ssr: false },
);

export function PdfPreview({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <div style={{ height: "100%" }}>
      <PDFViewer url={url} showThumbnails={false} />
    </div>
  );
}
