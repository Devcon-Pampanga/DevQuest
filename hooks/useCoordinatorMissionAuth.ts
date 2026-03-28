"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ChapterSessionUser } from "@/types/chapter";

export function useCoordinatorMissionAuth() {
  const router = useRouter();
  const [userData, setUserData] = useState<ChapterSessionUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/");
        return;
      }
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!snap.exists()) {
        router.replace("/");
        return;
      }
      const data = snap.data() as Omit<ChapterSessionUser, "uid"> & { onboardingComplete?: boolean };
      if (!data.onboardingComplete) {
        router.replace("/onboarding");
        return;
      }
      if (data.role !== "coordinator") {
        router.replace("/quests");
        return;
      }
      setUserData({ ...data, uid: firebaseUser.uid } as ChapterSessionUser);
      setLoadingAuth(false);
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { userData, loadingAuth };
}
