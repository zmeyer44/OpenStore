import dynamic from "next/dynamic";

const XlsxViewer = dynamic(
  () =>
    import("@/components/xlsx-viewer").then((m) => ({ default: m.XlsxViewer })),
  { ssr: false },
);

export function XlsxPreview({ url, name }: { url: string | null; name: string }) {
  if (!url) return null;
  return (
    <div style={{ height: "100%" }}>
      <XlsxViewer url={url} name={name} />
    </div>
  );
}
