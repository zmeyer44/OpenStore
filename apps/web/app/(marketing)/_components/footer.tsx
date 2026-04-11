import { Logo } from "@/assets/logo";
import Link from "next/link";
import { GithubIcon } from "lucide-react";
import { GITHUB_URL, X_URL } from "@/constants/app";

const footerSections = [
  {
    title: "Product",
    items: [
      { label: "Features", href: "#features" },
      { label: "Storage Providers", href: "#storage" },
      { label: "Self-Hosting", href: "#faq" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Documentation", href: GITHUB_URL },
      { label: "GitHub", href: GITHUB_URL },
      {
        label: "Changelog",
        href: `${GITHUB_URL}/releases`,
      },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-mkt-dark">
      <div className="grid-layout py-12 text-sm">
        <div className="col-span-full md:col-span-3">
          <div className="flex items-center gap-2.5">
            <Logo className="size-7 text-primary" />
            <span className="text-lg font-semibold text-white">Locker</span>
          </div>
          <p className="mt-3 max-w-xs text-white/40 mkt-body-sm">
            Open-source file storage. Self-hostable alternative to Dropbox and
            Google Drive.
          </p>
        </div>

        {footerSections.map((section) => (
          <div
            key={section.title}
            className="col-span-full flex flex-col gap-2 sm:col-span-4 md:col-span-3"
          >
            <p className="mkt-label text-white/50 mb-1">{section.title}</p>
            {section.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-white/70 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="col-span-full mt-8 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} Locker. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 transition-colors hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
                aria-label="X"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Link>
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 transition-colors hover:text-white"
            >
              <GithubIcon className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
