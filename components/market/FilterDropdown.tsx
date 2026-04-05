"use client";

import { useEffect, useRef, useState } from "react";
import { FILTER_OPTIONS } from "@/components/market/data";
import type { MarketCategory } from "@/components/market/types";

interface FilterDropdownProps {
  active: MarketCategory;
  onChange: (value: MarketCategory) => void;
}

export function FilterDropdown({ active, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const activeLabel = FILTER_OPTIONS.find((option) => option.value === active)?.label ?? "All";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-heading font-medium text-text-primary transition-all duration-100 hover:border-accent-highlight hover:text-white active:scale-[0.97]"
      >
        <svg className="h-4 w-4 text-accent-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
        </svg>
        Filter
        <span className="rounded-full border border-accent-primary/40 bg-accent-primary/15 px-2 py-0.5 text-[10px] font-heading font-medium text-accent-highlight">
          {activeLabel}
        </span>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-elevated shadow-2xl shadow-black/30 animate-fade-up" style={{ animationDuration: "180ms" }}>
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                active === option.value
                  ? "bg-accent-primary/20 font-heading font-medium text-accent-highlight"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              }`}
            >
              {option.label}
              {active === option.value ? (
                <svg className="h-4 w-4 text-accent-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
