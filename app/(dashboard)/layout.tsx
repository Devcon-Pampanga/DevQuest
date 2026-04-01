"use client";

import { useState, useLayoutEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarContext } from "@/context/SidebarContext";

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
    <SidebarContext.Provider value={{ openSidebar: () => setSidebarOpen(true) }}>
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
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
