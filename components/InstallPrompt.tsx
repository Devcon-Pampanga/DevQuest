"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Typed wrapper for the non-standard beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "devquest_install_dismissed";

export default function InstallPrompt() {
  const [visible, setVisible]           = useState(false);
  const [isIos, setIsIos]               = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {/* silent */});
    }

    // Don't show if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Only show on mobile
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIos(ios);

    // Android: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show dialog after short delay
    const timer = setTimeout(() => setVisible(true), 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 sm:items-center sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[#27272A] shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#1a1a2e" }}
      >
        {/* Accent stripe */}
        <div className="h-1 w-full" style={{ backgroundColor: "#7C3AED" }} />

        <div className="px-6 pt-6 pb-7 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-lg">
            <Image
              src="/icons/icon-512x512.png"
              alt="DevQuest"
              width={64}
              height={64}
              className="object-cover"
            />
          </div>

          {/* Title */}
          <h2 className="font-heading text-xl text-white mb-2">
            Install DevQuest
          </h2>

          {/* Description */}
          <p className="text-[#A1A1AA] text-sm mb-6 leading-relaxed">
            Add DevQuest to your home screen for a faster, app-like experience — no App Store required.
          </p>

          {isIos ? (
            /* ── iOS: manual steps ── */
            <>
              <ol className="w-full text-left space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-heading text-white"
                    style={{ backgroundColor: "#7C3AED" }}
                  >
                    1
                  </span>
                  <span className="text-[#A1A1AA] text-sm pt-0.5">
                    Tap the{" "}
                    <ShareIcon className="inline-block w-4 h-4 align-text-bottom mx-0.5 text-[#A855F7]" />
                    {" "}<strong className="text-white">Share</strong> button at the bottom of Safari
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-heading text-white"
                    style={{ backgroundColor: "#7C3AED" }}
                  >
                    2
                  </span>
                  <span className="text-[#A1A1AA] text-sm pt-0.5">
                    Scroll down and tap{" "}
                    <strong className="text-white">Add to Home Screen</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-heading text-white"
                    style={{ backgroundColor: "#7C3AED" }}
                  >
                    3
                  </span>
                  <span className="text-[#A1A1AA] text-sm pt-0.5">
                    Tap <strong className="text-white">Add</strong> in the top-right corner
                  </span>
                </li>
              </ol>
              <button
                onClick={dismiss}
                className="w-full bg-[#A855F7] hover:bg-[#7C3AED] text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors"
              >
                Got it
              </button>
            </>
          ) : (
            /* ── Android: native prompt ── */
            <button
              onClick={handleInstall}
              className="w-full bg-[#A855F7] hover:bg-[#7C3AED] text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors"
            >
              Install App
            </button>
          )}

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="mt-3 text-[#52525B] hover:text-[#A1A1AA] text-sm font-sans transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
