"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ChapterSessionUser } from "@/types/chapter";

export function useCoordinatorEventAuth() {
  const router = useRouter();
  const [userData, setUserData] = useState<ChapterSessionUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

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
      if (data.role !== "coordinator") {
        router.replace("/events");
        return;
      }

      setFirebaseUser(user);
      setUserData({ ...data, uid: user.uid } as ChapterSessionUser);
      setLoadingAuth(false);
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { userData, firebaseUser, loadingAuth };
}
