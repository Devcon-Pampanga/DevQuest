"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChapterData } from "@/lib/chapter/queries";
import { queryKeys } from "@/lib/queryKeys";
import type { ChapterVolunteer, ChapterEventDoc } from "@/types/chapter";

export function useChapterData(viewingChapterId: string) {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.chapter(viewingChapterId),
    queryFn: () => fetchChapterData(viewingChapterId),
    enabled: !!viewingChapterId,
    staleTime: 60 * 1000,
  });

  // Volunteers are mutable — the chapter page optimistically removes entries
  // via setVolunteers. Seed from cache on mount; ref gate prevents background
  // refetches from overwriting in-session mutations.
  const [volunteers, setVolunteers] = useState<ChapterVolunteer[]>([]);
  const seeded = useRef(false);
  useEffect(() => {
    if (data && !seeded.current) {
      seeded.current = true;
      setVolunteers(data.volunteers);
    }
  }, [data]);

  return {
    loadingChapter: isPending,
    volunteers,
    setVolunteers,
    events: (data?.events ?? []) as ChapterEventDoc[],
    regCounts: data?.regCounts ?? {},
  };
}
