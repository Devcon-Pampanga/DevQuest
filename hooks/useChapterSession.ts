"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ChapterSessionUser } from "@/types/chapter";

export function useChapterSession() {
  const router = useRouter();
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
      setCurrentUser({ ...data, uid: user.uid });
      setViewingChapterId(data.chapterId);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  return {
    authChecked,
    currentUser,
    viewingChapterId,
    setViewingChapterId,
  };
}
