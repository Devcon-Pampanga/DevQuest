"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { CoordinatorHubPage } from "@/components/quests/coordinator/CoordinatorHubPage";
import type { AvatarOptions } from "@/lib/avatar";

export default function VolunteersPage() {
  const { user: sessionUser } = useAuth();
  const { ready } = useRequireDashboardAuth();

  const user = useMemo(() => {
    if (!sessionUser) return null;
    return {
      uid: sessionUser.uid,
      username: sessionUser.username,
      chapterId: sessionUser.chapterId,
      avatarOptions: sessionUser.avatarOptions as AvatarOptions | undefined,
    };
  }, [sessionUser]);

  if (!ready || !user) return null;

  return <CoordinatorHubPage user={user} />;
}
