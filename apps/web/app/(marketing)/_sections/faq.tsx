"use client";

import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GITHUB_URL } from "@/constants/app";

const faqItems = [
  {
    question: "What is Locker?",
    answer:
      "Locker is an open-source, self-hostable file storage platform. Think of it as your own Dropbox or Google Drive that you control completely\u2014deploy it on your own servers, use your own storage backend, and own your data.",
  },
  {
    question: "What storage providers are supported?",
    answer:
      "Locker supports local filesystem, AWS S3, Cloudflare R2, and Vercel Blob out of the box. You can switch between them by changing a single environment variable. No code changes required.",
  },
  {
    question: "Is Locker free to use?",
    answer:
      "Yes. Locker is free and open source. You can use it for personal projects, your team, or your entire organization at no cost. You only pay for the infrastructure you choose to host it on.",
  },
  {
    question: "How do share links work?",
    answer:
      "You can generate shareable links for any file or folder. Each link can optionally have password protection, an expiration date, and a maximum number of downloads. Recipients don\u2019t need an account to access shared files.",
  },
  {
    question: "Can other people upload files to me?",
    answer:
      "Yes. Upload links let anyone send files to your storage without creating an account. Great for collecting documents from clients, students, or collaborators.",
  },
  {
    question: "What\u2019s the tech stack?",
    answer:
      "Next.js 16 with App Router, PostgreSQL with Drizzle ORM, tRPC for type-safe APIs, BetterAuth for authentication, and Tailwind CSS for the UI. The project uses a Turborepo monorepo with pnpm workspaces.",
  },
  {
    question: "How do I deploy Locker?",
    answer:
      "Clone the repo, run pnpm install, start a PostgreSQL database, configure your .env file, run migrations, and start the server. The defaults work out of the box for local development. For production, deploy to any Node.js-compatible platform.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-border last:border-b-0">
      <h3 data-state={isOpen ? "open" : "closed"} className="flex">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="mkt-subheading flex flex-1 cursor-pointer items-start justify-between gap-4 rounded-md py-4 text-left text-foreground outline-none transition-all hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {question}
          <ArrowRightIcon
            className={cn(
              "mt-1 size-5 shrink-0 transition-transform duration-300",
              isOpen ? "rotate-90" : "rotate-0",
            )}
          />
        </button>
      </h3>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isOpen
            ? elementRef.current?.getBoundingClientRect().height
            : 0,
        }}
      >
        <div className="pb-4 pt-0" ref={elementRef}>
          <p className="mkt-body text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="flex flex-col bg-mkt-dark">
      <div className="grid-layout w-full py-20">
        <motion.div
          className="col-span-full"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mkt-heading text-white">Frequently Asked Questions</h2>
        </motion.div>

        <div className="col-span-full mt-4">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="[&_*]:!text-white/90 [&_p]:!text-white/50 [&_button]:!text-white/90"
            >
              <FaqItem question={item.question} answer={item.answer} />
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <motion.div
          className="col-span-full mt-14 flex flex-col items-center gap-5 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mkt-heading text-white">Ready to own your files?</h2>
          <p className="mkt-body max-w-lg text-balance text-white/50">
            Deploy Locker in minutes and take back control of your file storage.
            Free forever, open source, no strings attached.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/register">
              <Button size="lg" className="rounded-lg">
                Get Started
                <ArrowRightIcon className="ml-1 size-4" />
              </Button>
            </Link>
            <Link target="_blank" href={GITHUB_URL}>
              <Button
                variant="outline"
                size="lg"
                className="rounded-lg border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                View on GitHub
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
