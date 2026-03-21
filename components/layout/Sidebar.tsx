"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Quests",
    href: "/quests",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: "Events",
    href: "/events",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Chapter",
    href: "/chapter",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Market",
    href: "/market",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

// ─── Panel toggle icon ────────────────────────────────────────────────────────

function IconChevronsLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  );
}

function IconChevronsRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function NavContent({
  collapsed,
  onClose,
  onToggleCollapsed,
  showToggle,
}: {
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
  showToggle: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo row */}
      <div className="flex items-center h-[60px] px-2">
        {/* Icon pinned at same x as nav icons via explicit padding */}
        <span className="flex items-center shrink-0 pl-[10px] pr-[10px]">
          <Image
            src="/icon.png"
            alt="DevQuest logo"
            width={28}
            height={28}
          />
        </span>
        <span className={`font-heading text-lg text-text-primary tracking-wide whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out ${
          collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
        }`}>
          DevQuest
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-3 mb-3" />

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 flex-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-xl font-heading font-medium text-sm transition-colors duration-150 ${
                isActive
                  ? "bg-accent-primary/20 text-accent-highlight"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {/*
                Icon is pinned at a fixed x position via explicit pl/pr.
                pl-[22px] + pr-[8px] = 48px span (fills nav width when collapsed).
                Icon center = nav-padding(8) + pl(22) + half-icon(9) = 39px from sidebar edge.
                This never changes regardless of sidebar width — no centering, no snap.
              */}
              <span className={`flex items-center shrink-0 py-2.5 pl-[15px] pr-[15px] ${isActive ? "text-accent-highlight" : ""}`}>
                {item.icon}
              </span>
              {/*
                Label animates independently with max-width + opacity.
                Decoupled from sidebar width animation — no reliance on overflow-hidden clipping.
              */}
              <span className={`whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out pr-3 ${
                collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom toggle */}
      {showToggle ? (
        <div className="px-2 pb-3">
          <button
            onClick={onToggleCollapsed}
            className="h-9 flex items-center rounded-lg pl-[15px] pr-[15px] text-text-muted hover:text-text-primary hover:bg-white/8 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <IconChevronsRight /> : <IconChevronsLeft />}
          </button>
        </div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar — collapsible ──────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[#0d0d14] border-r border-border z-40 overflow-hidden transition-[width] duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-56"}`}
      >
        <NavContent
          collapsed={collapsed}
          onClose={onClose}
          onToggleCollapsed={onToggleCollapsed}
          showToggle
        />
      </aside>

      {/* ── Mobile overlay ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ── Mobile slide-in sidebar — always expanded ─────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 h-screen w-56 bg-[#0d0d14] border-r border-border z-50 flex flex-col lg:hidden transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <NavContent
          collapsed={false}
          onClose={onClose}
          onToggleCollapsed={onToggleCollapsed}
          showToggle={false}
        />
      </aside>
    </>
  );
}
