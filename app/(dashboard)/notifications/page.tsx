"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useSidebar } from "@/context/SidebarContext";

interface AvatarOptions {
  backgroundColor: string;
  backgroundType: "solid" | "gradientLinear";
  eyes: string;
  mouth: string;
}

interface UserData {
  username: string;
  avatarOptions?: AvatarOptions;
}

const DEFAULT_AVATAR: AvatarOptions = {
  backgroundColor: "5e35b1",
  backgroundType: "solid",
  eyes: "round",
  mouth: "smile01",
};

function buildAvatarUrl(seed: string, opts: AvatarOptions): string {
  const p: Record<string, string> = {
    seed,
    backgroundColor: opts.backgroundColor,
    backgroundType: opts.backgroundType,
    eyes: opts.eyes,
    mouth: opts.mouth,
  };
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?${new URLSearchParams(p)}`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { openSidebar } = useSidebar();

  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) {
        router.replace("/onboarding");
        return;
      }
      setUserData(snap.data() as UserData);
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  if (!authChecked || !userData) return null;

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border shrink-0 bg-base">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={openSidebar}
            className="lg:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors shrink-0"
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Image src="/icon.png" alt="" width={28} height={28} className="shrink-0 rounded-lg" aria-hidden />
          <h1 className="font-heading text-2xl text-text-primary tracking-wide truncate">Notifications</h1>
        </div>
        <Link href="/profile" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Profile"
            width={36}
            height={36}
            className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors"
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="font-heading text-lg text-text-primary mb-2">No notifications yet</p>
          <p className="text-sm text-text-secondary font-sans leading-relaxed">
            When you get quest updates, attendance confirmations, or reminders, they will show up here. This inbox is coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
