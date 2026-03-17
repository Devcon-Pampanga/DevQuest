"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/layout/Sidebar";

const TEAMS = [
  { id: "lead_learners",        color: "#F5C518" },
  { id: "people_culture",       color: "#F97316" },
  { id: "community_engagement", color: "#22C55E" },
  { id: "creatives",            color: "#9333EA" },
  { id: "sustainability",       color: "#06B6D4" },
];

export default function NotFound() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-56 min-w-0">
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

        {/* Content */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-6 py-14"
          style={{
            background:
              "radial-gradient(ellipse 100% 60% at 30% 20%, rgba(124,58,237,0.22) 0%, transparent 60%)",
          }}
        >
          <div className="w-full max-w-sm flex flex-col items-center text-center">

            {/* Illustration */}
            <div className="mb-8 rounded-2xl overflow-hidden">
              <Image
                src="/404-robot.png"
                alt="404 — broken robot"
                width={300}
                height={300}
                priority
              />
            </div>

            {/* Heading */}
            <h1 className="font-heading text-3xl text-text-primary mb-2">
              Page Not Found
            </h1>
            <p className="text-text-secondary text-sm mb-8">
              Looks like this page went on an unplanned adventure.
              <br />
              Let&apos;s get you back on track.
            </p>

            {/* CTA */}
            <Link
              href="/"
              className="w-full bg-accent-highlight hover:bg-accent-primary text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors block"
            >
              Back to Home
            </Link>

            {/* Team Color Dots */}
            <div className="flex justify-center gap-2 mt-10">
              {TEAMS.map((team) => (
                <div
                  key={team.id}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
