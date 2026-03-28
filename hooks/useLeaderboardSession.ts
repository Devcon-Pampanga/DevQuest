"use client";

import { useState, useEffect } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ChapterSessionUser } from "@/types/chapter";

/** Minimal router API used by this hook (matches `useRouter()`). */
interface LeaderboardRouter {
  replace: (href: string) => void;
}

export function useLeaderboardSession(
  router: LeaderboardRouter,
  searchParams: ReadonlyURLSearchParams
) {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<ChapterSessionUser | null>(null);
  const [viewingChapterId, setViewingChapterId] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) {
        router.replace("/onboarding");
        return;
      }
      const data = snap.data() as ChapterSessionUser;
      const fromParam = searchParams.get("chapter");
      setCurrentUser({ ...data, uid: user.uid });
      setViewingChapterId(fromParam ?? data.chapterId);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router, searchParams]);

  return {
    authChecked,
    currentUser,
    viewingChapterId,
    setViewingChapterId,
  };
}
