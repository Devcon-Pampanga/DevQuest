import {
  doc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChapterSessionUser } from "@/types/chapter";
import type {
  MissionAssignmentType,
  MissionDifficulty,
  MissionVolunteerPickerRow,
} from "@/types/mission";
import { DIFFICULTY_META } from "@/types/mission";

type MissionRouter = { push: (href: string) => void };

export function validateMissionForm(params: {
  title: string;
  description: string;
  assignmentType: MissionAssignmentType;
  selectedVolunteers: MissionVolunteerPickerRow[];
  selectedTeams: string[];
  hasDeadline: boolean;
  deadlineDate: string;
  deadlineTime: string;
  setErrors: (e: Record<string, string> | ((p: Record<string, string>) => Record<string, string>)) => void;
}): boolean {
  const {
    title,
    description,
    assignmentType,
    selectedVolunteers,
    selectedTeams,
    hasDeadline,
    deadlineDate,
    deadlineTime,
    setErrors,
  } = params;
  const errs: Record<string, string> = {};
  if (!title.trim()) errs.title = "Give this mission a name.";
  if (!description.trim()) errs.description = "Describe what needs to be done.";
  if (assignmentType === "specific" && selectedVolunteers.length === 0)
    errs.assignees = "Pick at least one volunteer.";
  if (assignmentType === "team" && selectedTeams.length === 0)
    errs.team = "Pick at least one team.";
  if (hasDeadline && (!deadlineDate || !deadlineTime)) {
    errs.deadline = "Set both a date and time for the deadline.";
  } else if (hasDeadline && deadlineDate && deadlineTime) {
    const deadlineTs = new Date(`${deadlineDate}T${deadlineTime}:00`).getTime();
    if (deadlineTs <= Date.now()) {
      errs.deadline = "The deadline has already passed — pick a future date and time.";
    }
  }
  setErrors(errs);
  return Object.keys(errs).length === 0;
}

export async function createMissionAndAssignments(params: {
  router: MissionRouter;
  userData: ChapterSessionUser;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  assignmentType: MissionAssignmentType;
  slots: number;
  selectedTeams: string[];
  selectedVolunteers: MissionVolunteerPickerRow[];
  hasDeadline: boolean;
  deadlineDate: string;
  deadlineTime: string;
  submissionGuidance: string;
  setErrors: (e: Record<string, string> | ((p: Record<string, string>) => Record<string, string>)) => void;
  setSubmitting: (v: boolean) => void;
  setSuccessInfo: (v: { count: number; type: MissionAssignmentType } | null) => void;
}): Promise<void> {
  const {
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
    setSuccessInfo,
  } = params;

  setSubmitting(true);

  try {
    const xpReward = DIFFICULTY_META[difficulty].xp;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const missionData: Record<string, any> = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      xpReward,
      assignmentType,
      chapterId: userData.chapterId,
      createdBy: userData.uid,
      createdByUsername: userData.username,
      status: "active",
      createdAt: serverTimestamp(),
    };

    if (assignmentType === "specific") {
      missionData.assignedTo = selectedVolunteers.map((v) => v.uid);
    } else if (assignmentType === "team") {
      missionData.assignedTeams = selectedTeams;
    } else {
      missionData.slots = slots;
    }

    if (hasDeadline && deadlineDate && deadlineTime) {
      missionData.deadline = new Date(`${deadlineDate}T${deadlineTime}:00`);
    }

    if (submissionGuidance.trim()) {
      missionData.submissionGuidance = submissionGuidance.trim();
    }

    const missionRef = await addDoc(collection(db, "missions"), missionData);
    const missionId = missionRef.id;

    let notifiedCount = 0;
    try {
      if (assignmentType === "specific") {
        notifiedCount = selectedVolunteers.length;
        const batch = writeBatch(db);
        for (const v of selectedVolunteers) {
          batch.set(doc(db, "users", v.uid, "missionCompletions", missionId), {
            missionId,
            status: "assigned",
            xpGranted: xpReward,
          });
        }
        await batch.commit();
      } else if (assignmentType === "team" && selectedTeams.length > 0) {
        const allUsersSnap = await getDocs(
          query(
            collection(db, "users"),
            where("chapterId", "==", userData.chapterId),
            where("role", "==", "volunteer")
          )
        );
        const targetUids = new Set<string>();
        allUsersSnap.docs.forEach((d) => {
          const userTeams = (d.data().teams as string[]) ?? [];
          if (userTeams.some((t) => selectedTeams.includes(t))) {
            targetUids.add(d.id);
          }
        });
        notifiedCount = targetUids.size;
        if (targetUids.size > 0) {
          const batch = writeBatch(db);
          targetUids.forEach((uid) => {
            batch.set(doc(db, "users", uid, "missionCompletions", missionId), {
              missionId,
              status: "assigned",
              xpGranted: xpReward,
            });
          });
          await batch.commit();
        }
      }
    } catch (batchErr) {
      console.error("Assignment batch failed after mission write:", batchErr);
      setErrors({
        submit:
          "Mission was saved, but volunteer assignments couldn't be written. Find it in the missions list to assign manually.",
      });
      setSubmitting(false);
      return;
    }

    setSuccessInfo({ count: notifiedCount, type: assignmentType });
    setTimeout(() => router.push("/quests"), 2400);
  } catch (err) {
    console.error("Failed to create mission:", err);
    setErrors({ submit: "Something went wrong — give it another try." });
    setSubmitting(false);
  }
}
