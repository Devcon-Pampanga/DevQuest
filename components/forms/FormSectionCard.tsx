"use client";

import type { ReactNode } from "react";

export function FormSectionCard({
  stripe = "linear-gradient(90deg, #7C3AED, #A855F7)",
  animDelay = 0,
  padding = "p-5",
  className = "",
  children,
}: {
  stripe?: string;
  animDelay?: number;
  padding?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border overflow-hidden animate-fade-up ${className}`.trim()}
      style={{ backgroundColor: "#1e1a2e", animationDelay: `${animDelay}ms` }}
    >
      <div
        className="h-[3px] w-full"
        style={{ background: stripe, transition: "background 200ms ease-out" }}
      />
      <div className={padding}>{children}</div>
    </div>
  );
}
