"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Gear, Info, SignOut } from "@phosphor-icons/react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSidebar } from "@/context/SidebarContext";

// ─── Skeleton primitives ──────────────────────────────────────────────────────

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-3 rounded-full bg-[#1a1a2e] animate-pulse ${className}`} />
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-[#1a1a2e] animate-pulse ${className}`} />
  );
}

// ─── PageShell ────────────────────────────────────────────────────────────────

interface PageShellProps {
  title: string;
  avatarUrl?: string;
  loading: boolean;
  skeleton: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  children: React.ReactNode;
}

const AVATAR_MENU = [
  { label: "Profile", href: "/dashboard", Icon: User },
  { label: "Settings", href: "/settings", Icon: Gear },
  { label: "About", href: "/about", Icon: Info },
] as const;

export default function PageShell({
  title,
  avatarUrl,
  loading,
  skeleton,
  actions,
  backHref,
  children,
}: PageShellProps) {
  const { openSidebar } = useSidebar();
  const router = useRouter();
  const showMobileSidebarButton = !backHref;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut(auth);
    router.push("/");
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-base">
        <div className="flex items-center gap-2">
          {showMobileSidebarButton ? (
            <button
              type="button"
              onClick={openSidebar}
              className="lg:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              aria-label="Open sidebar"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          ) : null}
          {backHref ? (
            <Link
              href={backHref}
              className="p-2 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              aria-label="Go back"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </Link>
          ) : null}
          <h1 className="font-heading text-2xl text-text-primary tracking-wide">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {actions}
          <div ref={menuRef} className="relative shrink-0">
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Open account menu"
                aria-expanded={menuOpen}
                className="block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt="Profile"
                  width={36}
                  height={36}
                  className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors"
                />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#1a1a2e] animate-pulse" />
            )}

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border bg-[#0d0d14] shadow-xl z-50 overflow-hidden">
                {AVATAR_MENU.map(({ label, href, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                  >
                    <Icon size={16} weight="bold" />
                    {label}
                  </Link>
                ))}
                <div className="border-t border-border" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                >
                  <SignOut size={16} weight="bold" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{skeleton}</div>
      ) : (
        children
      )}
    </div>
  );
}
