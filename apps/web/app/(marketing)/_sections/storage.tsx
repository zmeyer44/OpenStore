"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { FolderSvg } from "../_components/folder-svg";

const providers = [
  {
    name: "Local Filesystem",
    env: "local",
    description: "Store files directly on your server. Zero config, zero cost.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.602H7.923a3.375 3.375 0 0 0-3.285 2.602l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m19.5 0a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3m16.5 0h.008v.008h-.008v-.008Zm-3 0h.008v.008h-.008v-.008Z"
        />
      </svg>
    ),
  },
  {
    name: "AWS S3",
    env: "s3",
    description:
      "The industry standard. Reliable, scalable, globally distributed.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"
        />
      </svg>
    ),
  },
  {
    name: "Cloudflare R2",
    env: "r2",
    description:
      "S3-compatible with zero egress fees. Great for bandwidth-heavy workloads.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558"
        />
      </svg>
    ),
  },
  {
    name: "Vercel Blob",
    env: "vercel",
    description:
      "Serverless-native storage. One token, no infrastructure to manage.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
        />
      </svg>
    ),
  },
];

export function Storage() {
  return (
    <section id="storage" className="flex flex-col bg-muted">
      <div className="grid-layout w-full py-20">
        <motion.div
          className="col-span-full mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="mkt-label text-primary">Bring your own backend</p>
          <h2 className="mkt-heading mt-2 text-foreground">
            One env var. Any storage provider.
          </h2>
          <p className="mkt-body mt-4 max-w-2xl text-balance text-muted-foreground">
            Set{" "}
            <code className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-sm">
              BLOB_STORAGE_PROVIDER
            </code>{" "}
            in your{" "}
            <code className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-sm">
              .env
            </code>{" "}
            and you&apos;re done. Switch providers anytime without touching a
            line of code.
          </p>
        </motion.div>

        {providers.map((provider, index) => (
          <motion.div
            key={provider.name}
            className="col-span-full md:col-span-6 lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <div
              className={cn(
                "flex h-full flex-col rounded-xl border border-border bg-background p-6",
                "transition-all duration-300 hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {provider.icon}
              </div>
              <h3 className="mkt-subheading mt-4 text-foreground">
                {provider.name}
              </h3>
              <p className="mkt-body-sm mt-1.5 flex-1 text-muted-foreground">
                {provider.description}
              </p>
              <div className="mt-4">
                <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                  BLOB_STORAGE_PROVIDER={provider.env}
                </code>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="w-full">
        <div className="grid-layout relative">
          <div className="col-span-full flex justify-start">
            <FolderSvg className="text-mkt-dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
