"use client";

import PageShell from "@/components/layout/PageShell";
import { AddMissionSkeleton } from "@/components/missions/new/AddMissionSkeleton";
import { AddMissionView } from "@/components/missions/new/AddMissionView";
import { useCoordinatorMissionAuth } from "@/hooks/useCoordinatorMissionAuth";

export default function AddSubquestPage() {
  const { userData, loadingAuth } = useCoordinatorMissionAuth();

  if (loadingAuth) {
    return (
      <PageShell title="Create Subquest" loading={true} skeleton={<AddMissionSkeleton />}>
        {null}
      </PageShell>
    );
  }

  if (!userData) return null;

  return <AddMissionView userData={userData} />;
}
