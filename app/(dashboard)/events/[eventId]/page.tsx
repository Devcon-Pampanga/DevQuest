"use client";

import { useParams } from "next/navigation";
import { EventDetailScreen } from "@/components/events/eventDetail/EventDetailScreen";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  return <EventDetailScreen eventId={eventId} />;
}
