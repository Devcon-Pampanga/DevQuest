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
import {
  SUBQUESTS_COLLECTION,
  SUBQUEST_COMPLETIONS_COLLECTION,
  type
  SubquestAssignmentType,
  SubquestDifficulty,
  SubquestVolunteerPickerRow,
} from "@/types/subquest";
import { DIFFICULTY_META } from "@/types/subquest";

type SubquestRouter = { push: (href: string) => void };

export function validateSubquestForm(params: {
  title: string;
  description: string;
  assignmentType: SubquestAssignmentType;
  selectedVolunteers: SubquestVolunteerPickerRow[];
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
  if (!title.trim()) errs.title = "Give this subquest a name.";
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

export async function createSubquestAndAssignments(params: {
  router: SubquestRouter;
  userData: ChapterSessionUser;
  title: string;
  description: string;
  difficulty: SubquestDifficulty;
  assignmentType: SubquestAssignmentType;
  slots: number;
  selectedTeams: string[];
  selectedVolunteers: SubquestVolunteerPickerRow[];
  hasDeadline: boolean;
  deadlineDate: string;
  deadlineTime: string;
  submissionGuidance: string;
  setErrors: (e: Record<string, string> | ((p: Record<string, string>) => Record<string, string>)) => void;
  setSubmitting: (v: boolean) => void;
  setSuccessInfo: (v: { count: number; type: SubquestAssignmentType } | null) => void;
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
    const subquestData: Record<string, any> = {
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
      subquestData.assignedTo = selectedVolunteers.map((v) => v.uid);
    } else if (assignmentType === "team") {
      subquestData.assignedTeams = selectedTeams;
    } else {
      subquestData.slots = slots;
    }

    if (hasDeadline && deadlineDate && deadlineTime) {
      subquestData.deadline = new Date(`${deadlineDate}T${deadlineTime}:00`);
    }

    if (submissionGuidance.trim()) {
      subquestData.submissionGuidance = submissionGuidance.trim();
    }

    const subquestRef = await addDoc(collection(db, SUBQUESTS_COLLECTION), subquestData);
    const subquestId = subquestRef.id;

    let notifiedCount = 0;
    try {
      if (assignmentType === "specific") {
        notifiedCount = selectedVolunteers.length;
        const batch = writeBatch(db);
        for (const v of selectedVolunteers) {
          batch.set(doc(db, "users", v.uid, SUBQUEST_COMPLETIONS_COLLECTION, subquestId), {
            subquestId: subquestId,
            subquestTitle: title.trim(),
            status: "assigned",
            xpGranted: xpReward,
            difficulty,
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
            batch.set(doc(db, "users", uid, SUBQUEST_COMPLETIONS_COLLECTION, subquestId), {
              subquestId: subquestId,
              subquestTitle: title.trim(),
              status: "assigned",
              xpGranted: xpReward,
              difficulty,
            });
          });
          await batch.commit();
        }
      }
    } catch (batchErr) {
      console.error("Assignment batch failed after subquest write:", batchErr);
      setErrors({
        submit:
          "Subquest was saved, but volunteer assignments couldn't be written. Find it in the subquests list to assign manually.",
      });
      setSubmitting(false);
      return;
    }

    setSuccessInfo({ count: notifiedCount, type: assignmentType });
    setTimeout(() => router.push("/quests"), 2400);
  } catch (err) {
    console.error("Failed to create subquest:", err);
    setErrors({ submit: "Something went wrong — give it another try." });
    setSubmitting(false);
  }
}
