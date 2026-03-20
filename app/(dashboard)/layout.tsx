"use client";

import { useState, useLayoutEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el) el.setAttribute("data-no-transition", "");

    if (localStorage.getItem("sidebar-collapsed") === "true") {
      setCollapsed(true);
    }

    requestAnimationFrame(() => {
      if (el) el.removeAttribute("data-no-transition");
    });
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-base flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[margin-left] duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-56"}`}
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 10%, rgba(124,58,237,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168,85,247,0.10) 0%, transparent 50%)",
        }}
      >
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors"
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

        {children}
      </div>
    </div>
  );
}
