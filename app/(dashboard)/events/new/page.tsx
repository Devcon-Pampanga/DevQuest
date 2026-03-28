"use client";

import PageShell from "@/components/layout/PageShell";
import { NewEventSkeleton } from "@/components/events/new/NewEventSkeleton";
import { NewEventView } from "@/components/events/new/NewEventView";
import { useCoordinatorEventAuth } from "@/hooks/useCoordinatorEventAuth";

export default function NewEventPage() {
  const { userData, firebaseUser, loadingAuth } = useCoordinatorEventAuth();

  if (loadingAuth) {
    return (
      <PageShell title="Add Event" loading={true} skeleton={<NewEventSkeleton />}>
        {null}
      </PageShell>
    );
  }

  if (!userData || !firebaseUser) return null;

  return <NewEventView userData={userData} firebaseUser={firebaseUser} />;
}
