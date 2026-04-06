"use client";

import PageShell from "@/components/layout/PageShell";
import { AddSubquestSkeleton } from "@/components/subquests/new/AddSubquestSkeleton";
import { AddSubquestView } from "@/components/subquests/new/AddSubquestView";
import { useCoordinatorMissionAuth } from "@/hooks/useCoordinatorMissionAuth";

export default function AddSubquestPage() {
  const { userData, loadingAuth } = useCoordinatorMissionAuth();

  if (loadingAuth) {
    return (
      <PageShell title="Create Subquest" loading={true} skeleton={<AddSubquestSkeleton />}>
        {null}
      </PageShell>
    );
  }

  if (!userData) return null;

  return <AddSubquestView userData={userData} />;
}
