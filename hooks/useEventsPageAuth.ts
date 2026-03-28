"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ChapterSessionUser } from "@/types/chapter";

export function useEventsPageAuth() {
  const router = useRouter();
  const [userData, setUserData] = useState<ChapterSessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

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

      const data = snap.data() as Omit<ChapterSessionUser, "uid"> & { onboardingComplete?: boolean };
      setUserData({ ...data, uid: user.uid } as ChapterSessionUser);
      setAuthChecked(true);
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { userData, authChecked };
}
