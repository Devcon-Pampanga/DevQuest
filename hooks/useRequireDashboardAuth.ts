"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Redirects to `/` or `/onboarding` when session is not ready for dashboard routes.
 * Returns when the user is signed in with onboarding complete.
 */
export function useRequireDashboardAuth(): {
  ready: boolean;
  loading: boolean;
} {
  const router = useRouter();
  const { status, firebaseUser, user } = useAuth();

  const loading = status === "loading";
  const ready =
    !loading &&
    !!firebaseUser &&
    !!user &&
    user.onboardingComplete === true;

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/");
      return;
    }
    if (!user || user.onboardingComplete !== true) {
      router.replace("/onboarding");
    }
  }, [loading, firebaseUser, user, router]);

  return { ready, loading };
}
