import { GoogleAnalytics as GA } from "@next/third-parties/google";

export function GoogleAnalytics() {
  if (!process.env.NEXT_PUBLIC_GA_TRACKING_ID) return null;
  return <GA gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID} />;
}
