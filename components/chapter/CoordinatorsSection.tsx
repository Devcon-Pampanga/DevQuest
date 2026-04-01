"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TEAM_META } from "@/lib/seed/quests";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import type { ChapterVolunteer } from "@/types/chapter";

export function CoordinatorsSection({ coordinators }: { coordinators: ChapterVolunteer[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (coordinators.length > 0 && activeIdx >= coordinators.length) {
      setActiveIdx(0);
    }
  }, [coordinators.length, activeIdx]);

  const safeIdx = Math.min(activeIdx, Math.max(0, coordinators.length - 1));
  const active = coordinators[safeIdx] ?? null;
  const isMultiple = coordinators.length > 1;
  const primaryTeam = active?.teams?.[0] ?? null;
  const teamMeta = primaryTeam ? (TEAM_META[primaryTeam] ?? null) : null;
  const accentColor = teamMeta?.color ?? "#A855F7";

  const avatarUrl = active
    ? buildAvatarUrl(active.username, active.avatarOptions ?? DEFAULT_AVATAR)
    : "";

  function goTo(idx: number) {
    setActiveIdx(idx);
  }

  function goPrev() {
    setActiveIdx((i) => (i - 1 + coordinators.length) % coordinators.length);
  }

  function goNext() {
    setActiveIdx((i) => (i + 1) % coordinators.length);
  }

  if (!active) return null;

  if (!isMultiple) {
    return (
      <div
        className="rounded-2xl bg-surface border border-border p-5 flex items-center gap-4 animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={active.username}
          width={52}
          height={52}
          className="rounded-xl border-2 border-accent-primary/40 shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-sans uppercase tracking-[0.16em] text-accent-highlight mb-1">
            Chapter Coordinator
          </div>
          <div className="font-heading text-base text-text-primary truncate">
            {active.username}
          </div>
          <div className="text-xs text-text-muted mt-0.5">DEVCON Kids</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl bg-surface border border-border overflow-hidden animate-fade-up relative"
      style={{ animationDelay: "120ms" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-500"
        style={{ backgroundColor: accentColor }}
      />

      <div
        className="absolute -top-6 -right-6 w-40 h-40 rounded-full blur-3xl opacity-[0.06] pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative p-5 flex flex-col gap-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-highlight shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-accent-highlight">
              {isMultiple ? "Chapter Coordinators" : "Chapter Coordinator"}
            </span>
          </div>
          {isMultiple && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-highlight font-sans border border-accent-primary/20 tabular-nums">
              {safeIdx + 1} / {coordinators.length}
            </span>
          )}
        </div>

        <div
          key={safeIdx}
          className="flex items-center gap-4 animate-fade-up"
          style={{ animationDuration: "220ms" }}
        >
          <div className="relative shrink-0">
            <div
              className="absolute inset-0 rounded-xl blur-md opacity-30 transition-colors duration-500"
              style={{ backgroundColor: accentColor }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={active.username}
              width={56}
              height={56}
              className="relative rounded-xl border-2 object-cover transition-colors duration-500"
              style={{ borderColor: accentColor + "70" }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${active.username}`}
              className="font-heading text-base text-text-primary hover:text-accent-highlight transition-colors truncate block"
            >
              {active.username}
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-text-muted">DEVCON Kids</span>
              {teamMeta && (
                <>
                  <span className="text-text-muted text-xs">·</span>
                  <span
                    className="text-[10px] font-heading font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{
                      color: accentColor,
                      backgroundColor: accentColor + "18",
                    }}
                  >
                    {teamMeta.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {isMultiple && (
          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              {coordinators.map((c, i) => {
                const url = buildAvatarUrl(c.username, c.avatarOptions ?? DEFAULT_AVATAR);
                const isMeta = c.teams?.[0] ? (TEAM_META[c.teams[0]] ?? null) : null;
                const isActive = i === safeIdx;
                return (
                  <button
                    key={c.uid}
                    type="button"
                    onClick={() => goTo(i)}
                    title={c.username}
                    className="relative group transition-all duration-200 active:scale-90"
                    style={{ transform: isActive ? "scale(1.1)" : "scale(1)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={c.username}
                      width={28}
                      height={28}
                      className="rounded-lg object-cover transition-all duration-200"
                      style={{
                        border: `2px solid ${isActive ? (isMeta?.color ?? "#A855F7") : "transparent"}`,
                        opacity: isActive ? 1 : 0.35,
                        filter: isActive ? "none" : "grayscale(40%)",
                      }}
                    />
                    {isActive && (
                      <span
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isMeta?.color ?? "#A855F7" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors active:scale-90"
                aria-label="Previous coordinator"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors active:scale-90"
                aria-label="Next coordinator"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
