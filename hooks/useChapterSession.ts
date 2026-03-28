"use client";

import { useState, useEffect, useMemo } from "react";
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

export function useChapterSession() {
  const router = useRouter();
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
    setViewingChapterId(user.chapterId);
  }, [status, firebaseUser, user, router]);

  const authChecked =
    status === "ready" &&
    !!firebaseUser &&
    !!user &&
    user.onboardingComplete === true;

  const currentUser = useMemo(
    () => (authChecked && user ? toChapterSessionUser(user) : null),
    [authChecked, user]
  );

  return {
    authChecked,
    currentUser,
    viewingChapterId,
    setViewingChapterId,
  };
}
