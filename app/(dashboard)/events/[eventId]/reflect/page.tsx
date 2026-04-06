"use client";

import { useParams } from "next/navigation";
import { ReflectionView } from "@/components/events/reflect/ReflectionView";

export default function ReflectPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  return <ReflectionView eventId={eventId} />;
}
