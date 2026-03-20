"use client";

import { useState, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/layout/Sidebar";

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function NotFound() {
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

      <div className={`flex-1 flex flex-col min-w-0 transition-[margin-left] duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-56"}`}>
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Open sidebar"
        >
          <IconMenu />
        </button>

        {/* Top bar */}
        <div className="flex items-center px-6 py-4 border-b border-border">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <IconBack />
          </Link>
          <h1 className="font-heading text-2xl text-text-primary tracking-wide ml-3">Not Found</h1>
        </div>

        {/* Content */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-6 py-14"
          style={{
            background:
              "radial-gradient(ellipse 100% 60% at 30% 20%, rgba(124,58,237,0.22) 0%, transparent 60%)",
          }}
        >
          <div className="w-full max-w-sm md:max-w-md lg:max-w-lg flex flex-col items-center text-center">

            {/* Illustration */}
            <div className="mb-8 rounded-2xl overflow-hidden w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] relative">
              <Image
                src="/404-robot.png"
                alt="404 — broken robot"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Heading */}
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-text-primary mb-3">
              Page Not Found
            </h1>
            <p className="text-sm md:text-base" style={{ color: "#A1A1AA" }}>
              Looks like this page went on an unplanned adventure.
              <br />
              Let&apos;s get you back on track.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
