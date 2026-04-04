import type { Metadata } from "next";
import { Hero } from "./_sections/hero";
import { Features } from "./_sections/features";
import { Product } from "./_sections/product";
import { Storage } from "./_sections/storage";
import { Faq } from "./_sections/faq";

export const metadata: Metadata = {
  title: "Locker | Open-Source File Storage Platform",
  description:
    "A self-hostable alternative to Dropbox and Google Drive. Upload, organize, and share files from your own infrastructure with any storage provider.",
  openGraph: {
    title: "Locker | Open-Source File Storage Platform",
    description:
      "Self-hostable file storage. Upload, organize, and share files from your own infrastructure.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Product />
      <Storage />
      <Faq />
    </>
  );
}
