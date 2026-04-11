"use client";

import Link from "next/link";
import { Logo } from "@/assets/logo";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MenuIcon, XIcon } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { GITHUB_URL } from "@/constants/app";

function useGitHubStars() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://api.github.com/repos/zmeyer44/Locker")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);
  return stars;
}

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Storage", href: "#storage" },
  { label: "FAQ", href: "#faq" },
];

function formatStars(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return count.toString();
}

export function Navbar() {
  const { data: session } = useSession();
  const stars = useGitHubStars();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const updateScrollState = () => {
      setHasScrolled(window.scrollY > 50);
      ticking = false;
    };
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    // Check initial scroll position (e.g. back/forward navigation on mobile)
    updateScrollState();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="px-4 md:px-5 lg:px-14">
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative flex w-full pt-4 md:pt-5">
            <nav
              className={cn(
                "flex w-full flex-1 items-center justify-between border rounded-xl  transition-all duration-300",
                hasScrolled
                  ? "mx-auto max-w-4xl border-border/50 bg-background/80 p-1 pl-5 shadow-sm"
                  : "border-transparent bg-transparent shadow-none",
              )}
            >
              {/* Left */}
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2.5">
                  <Logo
                    className={cn(
                      "size-7 transition-colors",
                      hasScrolled ? "text-primary" : "text-primary-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-lg font-semibold tracking-tight transition-colors",
                      hasScrolled
                        ? "text-foreground"
                        : "text-primary-foreground",
                    )}
                  >
                    Locker
                  </span>
                </Link>

                <div className="hidden items-center gap-1 lg:flex">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        hasScrolled
                          ? "text-muted-foreground hover:text-foreground"
                          : "text-primary-foreground/70 hover:text-primary-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "hidden items-center gap-1.5 rounded-full pr-4 pl-3 py-1.5 text-nowrap transition-colors sm:flex",
                    hasScrolled
                      ? "bg-muted hover:bg-muted/80 text-foreground"
                      : "bg-white/10 text-primary-foreground hover:bg-white/15",
                  )}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.49933 0.25C3.49635 0.25 0.25 3.49593 0.25 7.50024C0.25 10.703 2.32715 13.4206 5.2081 14.3797C5.57084 14.446 5.70302 14.2222 5.70302 14.0299C5.70302 13.8576 5.69679 13.4019 5.69323 12.797C3.67661 13.235 3.25112 11.825 3.25112 11.825C2.92132 10.9874 2.44599 10.7644 2.44599 10.7644C1.78773 10.3149 2.49584 10.3238 2.49584 10.3238C3.22353 10.375 3.60629 11.0711 3.60629 11.0711C4.25298 12.1788 5.30335 11.8588 5.71638 11.6732C5.78225 11.205 5.96962 10.8854 6.17658 10.7043C4.56675 10.5209 2.87415 9.89918 2.87415 7.12104C2.87415 6.32925 3.15677 5.68257 3.62053 5.17563C3.54576 4.99226 3.29697 4.25521 3.69174 3.25691C3.69174 3.25691 4.30015 3.06196 5.68522 3.99973C6.26337 3.83906 6.8838 3.75895 7.50022 3.75583C8.1162 3.75895 8.73619 3.83906 9.31523 3.99973C10.6994 3.06196 11.3069 3.25691 11.3069 3.25691C11.7026 4.25521 11.4538 4.99226 11.3795 5.17563C11.8441 5.68257 12.1245 6.32925 12.1245 7.12104C12.1245 9.9063 10.4292 10.5192 8.81452 10.6985C9.07444 10.9224 9.30633 11.3648 9.30633 12.0413C9.30633 13.0102 9.29742 13.7922 9.29742 14.0299C9.29742 14.2239 9.42828 14.4496 9.79591 14.3788C12.6746 13.4179 14.75 10.7025 14.75 7.50024C14.75 3.49593 11.5036 0.25 7.49933 0.25Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-none">
                      GitHub
                    </span>

                    <span
                      className={cn(
                        "text-xs leading-tight",
                        hasScrolled
                          ? "text-muted-foreground"
                          : "text-primary-foreground/60",
                      )}
                    >
                      {formatStars(stars !== null ? stars : 0)} stars
                    </span>
                  </div>
                </a>
                {session ? (
                  <Link href="/home">
                    <Button className="rounded-lg h-[40px]">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="hidden sm:block">
                      <Button
                        variant="ghost"
                        className={cn(
                          "rounded-lg h-[40px]",
                          !hasScrolled &&
                            "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
                        )}
                      >
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="rounded-lg h-[40px]">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  className={cn(
                    "ml-1 rounded-lg p-2 lg:hidden",
                    hasScrolled
                      ? "text-foreground hover:bg-muted"
                      : "text-primary-foreground hover:bg-white/10",
                  )}
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? (
                    <XIcon className="size-5" />
                  ) : (
                    <MenuIcon className="size-5" />
                  )}
                </button>
              </div>
            </nav>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="mt-2 rounded-xl border border-border/50 bg-background/95 p-4 shadow-lg backdrop-blur-xl lg:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {session ? (
                <Link
                  href="/home"
                  className="mt-2 block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="mt-2 block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted sm:hidden"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
