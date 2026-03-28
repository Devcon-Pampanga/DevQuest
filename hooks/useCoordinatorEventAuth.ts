"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User as FirebaseUser } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import type { ChapterSessionUser } from "@/types/chapter";

function toChapterSessionUser(u: {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  xp: number;
  teams: string[];
  avatarOptions?: ChapterSessionUser["avatarOptions"];
}): ChapterSessionUser {
  return {
    uid: u.uid,
    username: u.username,
    role: u.role,
    chapterId: u.chapterId,
    xp: u.xp,
    teams: u.teams,
    avatarOptions: u.avatarOptions,
  };
}

export function useCoordinatorEventAuth() {
  const router = useRouter();
  const { user, firebaseUser, status } = useAuth();

  useEffect(() => {
    if (status !== "ready") return;
    if (!firebaseUser) {
      router.replace("/");
      return;
    }
    if (!user || user.onboardingComplete !== true) {
      router.replace("/onboarding");
      return;
    }
    if (user.role !== "coordinator") {
      router.replace("/events");
    }
  }, [status, firebaseUser, user, router]);

  const loadingAuth = status !== "ready";

  const userData = useMemo((): ChapterSessionUser | null => {
    if (!user || user.onboardingComplete !== true || user.role !== "coordinator") {
      return null;
    }
    return toChapterSessionUser(user);
  }, [user]);

  return {
    userData,
    firebaseUser: firebaseUser as FirebaseUser | null,
    loadingAuth,
  };
}
