"use client";

import React from "react";
import Link from "next/link";
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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-base">
        <div className="flex items-center gap-2">
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
          {avatarUrl ? (
            <Link href="/profile" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt="Profile"
                width={36}
                height={36}
                className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors"
              />
            </Link>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#1a1a2e] animate-pulse" />
          )}
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
