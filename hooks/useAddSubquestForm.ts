"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubquestAndAssignments, validateSubquestForm } from "@/lib/subquestCreate";
import { useSubquestChapterVolunteers } from "@/hooks/useSubquestChapterVolunteers";
import type { ChapterSessionUser } from "@/types/chapter";
import {
  type SubquestAssignmentType,
  type SubquestDifficulty,
  type SubquestVolunteerPickerRow,
} from "@/types/subquest";

export function useAddSubquestForm({ userData }: { userData: ChapterSessionUser }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<SubquestDifficulty>("medium");
  const [assignmentType, setAssignmentType] = useState<SubquestAssignmentType>("open");
  const [slots, setSlots] = useState(10);
  const [slotsRaw, setSlotsRaw] = useState("10");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<SubquestVolunteerPickerRow[]>([]);
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [submissionGuidance, setSubmissionGuidance] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ count: number; type: SubquestAssignmentType } | null>(null);

  const { chapterVolunteers, loadingVolunteers } = useSubquestChapterVolunteers(
    assignmentType,
    userData.chapterId
  );

  const filteredVolunteers = chapterVolunteers.filter(
    (v) =>
      !selectedVolunteers.find((s) => s.uid === v.uid) &&
      v.username.toLowerCase().includes(volunteerSearch.toLowerCase())
  );

  function toggleVolunteer(v: SubquestVolunteerPickerRow) {
    setSelectedVolunteers((prev) =>
      prev.find((s) => s.uid === v.uid) ? prev.filter((s) => s.uid !== v.uid) : [...prev, v]
    );
  }

  async function handleSubmit() {
    if (
      !validateSubquestForm({
        title,
        description,
        assignmentType,
        selectedVolunteers,
        selectedTeams,
        hasDeadline,
        deadlineDate,
        deadlineTime,
        setErrors,
      })
    ) {
      return;
    }
    const handleSetSuccessInfo = (v: { count: number; type: SubquestAssignmentType } | null) => {
      if (!v) return;
      if (window.innerWidth < 768) {
        setSuccessInfo(v);
      } else {
        router.push("/quests");
      }
    };

    await createSubquestAndAssignments({
      router,
      userData,
      title,
      description,
      difficulty,
      assignmentType,
      slots,
      selectedTeams,
      selectedVolunteers,
      hasDeadline,
      deadlineDate,
      deadlineTime,
      submissionGuidance,
      setErrors,
      setSubmitting,
      setSuccessInfo: handleSetSuccessInfo,
    });
  }

  return {
    title, setTitle,
    description, setDescription,
    difficulty, setDifficulty,
    assignmentType, setAssignmentType,
    slots, setSlots,
    slotsRaw, setSlotsRaw,
    selectedTeams, setSelectedTeams,
    selectedVolunteers,
    volunteerSearch, setVolunteerSearch,
    hasDeadline, setHasDeadline,
    deadlineDate, setDeadlineDate,
    deadlineTime, setDeadlineTime,
    submissionGuidance, setSubmissionGuidance,
    errors, setErrors,
    submitting,
    successInfo,
    toggleVolunteer,
    loadingVolunteers,
    filteredVolunteers,
    chapterVolunteers,
    handleSubmit,
  };
}
