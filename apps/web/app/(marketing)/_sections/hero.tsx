"use client";

import { motion } from "motion/react";
import {
  ArrowRightIcon,
  FolderIcon,
  ShareIcon,
  UploadCloudIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FolderSvg } from "../_components/folder-svg";
import Link from "next/link";

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
  accentClass,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  delay: number;
  accentClass: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className="group"
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-2xl border-2 p-6 lg:p-7",
          "bg-white/[0.025] transition-all duration-300 hover:bg-white/[0.05]",
          accentClass,
        )}
      >
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl border transition-colors duration-500",
            accentClass.includes("border-primary")
              ? "border-primary/25 bg-primary/10 group-hover:bg-primary/20"
              : accentClass.includes("border-blue-400")
                ? "border-blue-400/25 bg-blue-400/10 group-hover:bg-blue-400/20"
                : "border-violet-400/25 bg-violet-400/10 group-hover:bg-violet-400/20",
          )}
        >
          <Icon
            className={cn(
              "size-5",
              accentClass.includes("border-primary")
                ? "text-primary"
                : accentClass.includes("border-blue-400")
                  ? "text-blue-400"
                  : "text-violet-400",
            )}
          />
        </div>

        <h3 className="mkt-subheading mt-4 text-white">{title}</h3>
        <p className="mkt-body-sm mt-1.5 leading-relaxed text-white/40">
          {description}
        </p>

        <div className="mt-auto pt-5">
          <Link href="/register">
            <Button size="sm" className="w-full rounded-lg">
              Get Started
              <ArrowRightIcon className="ml-1 size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative flex flex-col overflow-hidden bg-mkt-dark">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Grid fade-out */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, var(--mkt-dark) 75%)",
        }}
      />
      {/* Ambient gradient orbs */}
      <div
        className="pointer-events-none absolute left-[8%] top-[12%] h-[500px] w-[500px] rounded-full bg-primary/[0.06] blur-[120px] lg:bg-primary/[0.12]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[18%] right-[12%] h-[400px] w-[400px] rounded-full bg-violet-500/[0.04] blur-[100px] lg:bg-violet-500/[0.08]"
        aria-hidden="true"
      />

      <div className="grid-layout w-full flex-1 items-center justify-center pb-12 pt-14">
        {/* Badge */}
        <motion.div
          className="col-span-full flex justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2",
              "border border-white/[0.09] bg-white/[0.07] backdrop-blur-xl",
            )}
          >
            <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[13px] font-medium text-white/80">
              Open source &middot; Self-hostable
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="col-span-full mkt-display mt-5 text-center text-white lg:mt-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
        >
          Your files. Your cloud.
          <br className="hidden sm:block" />
          Your rules.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="col-span-full mkt-body mx-auto mt-1 max-w-2xl text-balance text-center text-white/60"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}
        >
          A self-hostable alternative to Dropbox and Google Drive. Upload,
          organize, and share files from your own infrastructure&mdash;with any
          storage provider.
        </motion.p>

        {/* Feature cards */}
        <div className="col-span-full mt-8 grid grid-cols-1 gap-3 md:grid-cols-3 lg:mt-10 lg:gap-4">
          <FeatureCard
            icon={FolderIcon}
            title="File Explorer"
            description="Upload, organize, rename, move, and delete files and folders. Drag-and-drop support with a familiar interface."
            delay={0.28}
            accentClass="border-primary"
          />
          <FeatureCard
            icon={ShareIcon}
            title="Share Links"
            description="Generate shareable links with optional password protection, expiration dates, and download limits."
            delay={0.38}
            accentClass="border-blue-400"
          />
          <FeatureCard
            icon={UploadCloudIcon}
            title="Upload Links"
            description="Let others upload files to your storage without needing an account. Perfect for collecting documents."
            delay={0.48}
            accentClass="border-violet-400"
          />
        </div>
      </div>

      {/* Folder tab section divider */}
      <div className="relative w-full text-background">
        <div className="absolute bottom-0 left-0 right-0 grid">
          <div className="col-span-full flex flex-col justify-start">
            <div className="mx-auto w-full max-w-5xl">
              <FolderSvg className="ml-0 text-primary" />
            </div>
            <div className="h-4 w-full bg-primary" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 grid">
          <div className="col-span-full flex flex-col justify-start">
            <div className="mx-auto w-full max-w-5xl">
              <FolderSvg className="ml-[50px] text-blue-400" />
            </div>
            <div className="h-2 w-full bg-blue-400" />
          </div>
        </div>
        <div className="relative grid">
          <div className="col-span-full mx-auto flex w-full max-w-5xl justify-start">
            <FolderSvg className="ml-[100px] text-background" />
          </div>
        </div>
      </div>
    </section>
  );
}
