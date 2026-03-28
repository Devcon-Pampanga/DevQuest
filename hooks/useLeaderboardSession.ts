"use client";

import { useState, useEffect } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { ChapterSessionUser } from "@/types/chapter";

/** Minimal router API used by this hook (matches `useRouter()`). */
interface LeaderboardRouter {
  replace: (href: string) => void;
}

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

export function useLeaderboardSession(
  router: LeaderboardRouter,
  searchParams: ReadonlyURLSearchParams
) {
  const { user, firebaseUser, status } = useAuth();
  const [viewingChapterId, setViewingChapterId] = useState("");

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
  }, [status, firebaseUser, user, router]);

  useEffect(() => {
    if (!user || user.onboardingComplete !== true) return;
    const fromParam = searchParams.get("chapter");
    setViewingChapterId(fromParam ?? user.chapterId);
  }, [searchParams, user]);

  const authChecked =
    status === "ready" &&
    !!firebaseUser &&
    !!user &&
    user.onboardingComplete === true;

  const currentUser =
    authChecked && user ? toChapterSessionUser(user) : null;

  return {
    authChecked,
    currentUser,
    viewingChapterId,
    setViewingChapterId,
  };
}
