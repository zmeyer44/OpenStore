import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "OpenStore",
  description: "Open-source file storage platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          GeistSans.variable,
          GeistMono.variable,
          "antialiased"
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
