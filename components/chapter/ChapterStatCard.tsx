"use client";

import type { ReactNode } from "react";

export function ChapterStatCard({
  label,
  value,
  color,
  icon,
  delay = 0,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl bg-surface border border-border p-4 sm:p-5 flex flex-col gap-3 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-muted font-sans uppercase tracking-widest leading-none">
          {label}
        </span>
        <div
          className="hidden sm:flex w-7 h-7 rounded-xl items-center justify-center shrink-0"
          style={{ backgroundColor: color + "1a" }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div
        className="font-heading text-3xl tabular-nums leading-none"
        style={{ color }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="h-0.5 rounded-full w-10" style={{ backgroundColor: color + "80" }} />
    </div>
  );
}
