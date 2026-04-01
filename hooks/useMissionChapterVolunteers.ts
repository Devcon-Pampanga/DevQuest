"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MissionAssignmentType, MissionVolunteerPickerRow } from "@/types/mission";

export function useMissionChapterVolunteers(
  assignmentType: MissionAssignmentType,
  chapterId: string | undefined
) {
  const [chapterVolunteers, setChapterVolunteers] = useState<MissionVolunteerPickerRow[]>([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);

  useEffect(() => {
    if (assignmentType !== "specific" || !chapterId) return;
    setLoadingVolunteers(true);
    getDocs(
      query(
        collection(db, "users"),
        where("chapterId", "==", chapterId),
        where("role", "==", "volunteer")
      )
    ).then((snap) => {
      setChapterVolunteers(
        snap.docs.map((d) => ({
          uid: d.id,
          username: d.data().username as string,
          teams: (d.data().teams as string[]) ?? [],
          avatarOptions: d.data().avatarOptions as MissionVolunteerPickerRow["avatarOptions"],
        }))
      );
      setLoadingVolunteers(false);
    });
  }, [assignmentType, chapterId]);

  return { chapterVolunteers, loadingVolunteers };
}
