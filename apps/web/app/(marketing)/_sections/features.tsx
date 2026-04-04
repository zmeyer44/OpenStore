"use client";

import {
  HardDriveIcon,
  GaugeIcon,
  TerminalIcon,
  ShieldCheckIcon,
  UsersIcon,
  KeyIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { FolderSvg } from "../_components/folder-svg";

const features = [
  {
    title: "Storage Provider Agnostic",
    icon: HardDriveIcon,
    description:
      "Swap between local filesystem, AWS S3, Cloudflare R2, or Vercel Blob with a single environment variable. Your data, your infrastructure.",
  },
  {
    title: "Storage Quotas",
    icon: GaugeIcon,
    description:
      "Per-user storage limits with real-time usage tracking. Set limits per workspace and monitor consumption at a glance.",
  },
  {
    title: "Virtual Bash Shell",
    icon: TerminalIcon,
    description:
      "Navigate your files with familiar commands. Use ls, cd, find, cat, and grep through a virtual filesystem API.",
  },
  {
    title: "Workspace Teams",
    icon: UsersIcon,
    description:
      "Invite team members with role-based access. Organize files across workspaces with granular permissions.",
  },
  {
    title: "Secure by Default",
    icon: ShieldCheckIcon,
    description:
      "Email/password and Google OAuth authentication. Sessions managed server-side with encrypted cookies.",
  },
  {
    title: "API Keys",
    icon: KeyIcon,
    description:
      "Programmatic access to your files through API keys. Build integrations and automate workflows with full tRPC type safety.",
  },
];

export function Features() {
  return (
    <section id="features" className="flex flex-col bg-background">
      <div className="grid-layout w-full py-20">
        <motion.div
          className="col-span-full mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="mkt-label text-primary">Built for power users</p>
          <h2 className="mkt-heading mt-2 text-foreground">
            Everything you need to manage files
          </h2>
          <p className="mkt-body mt-4 max-w-2xl text-balance text-muted-foreground">
            Locker gives you the full toolkit for file management, sharing, and
            collaboration&mdash;all self-hosted on your own terms.
          </p>
        </motion.div>

        {features.map(({ title, icon: Icon, description }, index) => (
          <motion.div
            key={title}
            className="col-span-full flex gap-5 border-t-2 border-primary/15 pt-5 lg:col-span-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 p-2.5",
                "transition-all duration-300 hover:bg-primary/20",
              )}
            >
              <Icon className="size-full text-primary" />
            </div>
            <div>
              <h3 className="mkt-subheading text-foreground">{title}</h3>
              <p className="mkt-body-sm text-muted-foreground">{description}</p>
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
