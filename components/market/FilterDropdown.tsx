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
        className="flex items-center gap-2 rounded-xl border border-[#ffffff10] bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-red-700/40"
      >
        <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
        </svg>
        Filter
        <span className="rounded-full bg-red-600/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
          {activeLabel}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-[#ffffff10] bg-[#13131f] shadow-xl shadow-black/40">
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
                  ? "bg-red-600/20 font-semibold text-red-400"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {option.label}
              {active === option.value ? (
                <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
