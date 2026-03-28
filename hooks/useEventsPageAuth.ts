"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export function useEventsPageAuth() {
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
    }
  }, [status, firebaseUser, user, router]);

  const authChecked =
    status === "ready" &&
    !!firebaseUser &&
    !!user &&
    user.onboardingComplete === true;

  const userData = useMemo(() => {
    if (!authChecked || !user) return null;
    return toChapterSessionUser(user);
  }, [authChecked, user]);

  return { userData, authChecked };
}
