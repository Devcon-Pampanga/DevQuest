"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";

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

function NotificationsSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto pb-10">
      <div className="rounded-2xl border border-[#27272A] bg-[#1a1a2e] animate-pulse overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="px-5 py-4 border-b border-[#27272A] flex items-start gap-3"
          >
            <SkeletonBlock className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-40" />
            </div>
            <SkeletonLine className="w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();

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

  const avatarUrl = userData
    ? buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  return (
    <PageShell
      title="Notifications"
      avatarUrl={avatarUrl}
      loading={!authChecked}
      skeleton={<NotificationsSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto pb-10">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="font-heading text-lg text-text-primary mb-2">No notifications yet</p>
            <p className="text-sm text-text-secondary font-sans leading-relaxed">
              When you get quest updates, attendance confirmations, or reminders, they will show up here. This inbox is coming soon.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
