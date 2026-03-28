import { auth } from "@/lib/firebase";
import { generateVolunteerResumePdf } from "@/lib/generateVolunteerResumePdf";
import { formatDate, getEarnedTier } from "@/lib/quest-utils";
import { profileDisplayName } from "@/lib/profileDisplayName";
import { TEAM_META, TIER_LABELS } from "@/lib/seed/quests";
import { VolunteerBadgeDef } from "@/lib/volunteerBadges";
import type { Timestamp } from "firebase/firestore";
import { Quest, QuestCompletion } from "@/types/quest";

export interface ProfileResumeUser {
  username: string;
  chapterId: string;
  xp: number;
  role: "volunteer" | "coordinator";
  linkedinUrl?: string;
  githubUrl?: string;
  teams: string[];
  createdAt?: Timestamp;
}

export async function generateVolunteerProfileResume(params: {
  userData: ProfileResumeUser;
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
  badges: VolunteerBadgeDef[];
  eventCount: number;
  reflectionCount: number;
  completedQuestCount: number;
  badgesEarned: number;
}): Promise<void> {
  const {
    userData,
    completions,
    allQuests,
    badges,
    eventCount,
    reflectionCount,
    completedQuestCount,
    badgesEarned,
  } = params;

  let aiProfessionalSummary: string | null | undefined;
  let aiSkills: string[] | undefined;
  let aiInvolvementBullets: string[] | undefined;
  let eventContributions: {
    name: string;
    dateLabel: string;
    paragraph: string;
  }[] = [];

  try {
    const cu = auth.currentUser;
    if (cu) {
      const token = await cu.getIdToken();
      const res = await fetch("/api/resume-enhance", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          enhanced?: boolean;
          professionalSummary?: string | null;
          skills?: unknown;
          involvementBullets?: unknown;
          eventContributions?: unknown;
        };
        const skills = Array.isArray(data.skills)
          ? data.skills.map((s) => String(s).trim()).filter(Boolean)
          : [];
        const involvementBullets = Array.isArray(data.involvementBullets)
          ? data.involvementBullets.map((s) => String(s).trim()).filter(Boolean)
          : [];
        const summary =
          typeof data.professionalSummary === "string" && data.professionalSummary.trim()
            ? data.professionalSummary.trim()
            : null;
        if (process.env.NODE_ENV === "development") {
          console.log("[profile] resume-enhance response:", {
            status: res.status,
            enhanced: data.enhanced,
            skillsCount: skills.length,
            bulletsCount: involvementBullets.length,
            hasSummary: Boolean(summary),
          });
        }
        if (summary || skills.length > 0 || involvementBullets.length > 0) {
          aiProfessionalSummary = summary ?? undefined;
          aiSkills = skills.length > 0 ? skills : undefined;
          aiInvolvementBullets = involvementBullets.length > 0 ? involvementBullets : undefined;
        }

        if (Array.isArray(data.eventContributions)) {
          eventContributions = data.eventContributions
            .map((row: unknown) => {
              const r = row as { name?: unknown; dateLabel?: unknown; paragraph?: unknown };
              const name = typeof r.name === "string" ? r.name.trim() : "";
              const dateLabel = typeof r.dateLabel === "string" ? r.dateLabel.trim() : "";
              const paragraph = typeof r.paragraph === "string" ? r.paragraph.trim() : "";
              if (!name || !paragraph) return null;
              return { name, dateLabel: dateLabel || "—", paragraph };
            })
            .filter((x): x is NonNullable<typeof x> => x !== null);
        }
      } else if (process.env.NODE_ENV === "development") {
        console.warn("[profile] resume-enhance HTTP", res.status, await res.clone().text());
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[profile] resume-enhance fetch failed:", e);
    }
  }

  const teamsPayload = (userData.teams ?? [])
    .filter((tid) => TEAM_META[tid])
    .map((tid) => {
      const meta = TEAM_META[tid];
      const earned = getEarnedTier(tid, completions, allQuests);
      const earnedTierLabel =
        earned === "lead" ? meta.leadTitle : (TIER_LABELS[earned] ?? earned);
      return { teamLabel: meta.label, earnedTierLabel };
    });

  const completedQuests = allQuests
    .filter((q) => completions[q.questId]?.status === "completed")
    .map((q) => ({
      name: q.name,
      coordinatorVerified: Boolean(completions[q.questId]?.approvedBy),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const earnedBadges = badges
    .filter((b) => b.earned)
    .map((b) => ({ name: b.name, image: b.image }));

  const joinedAtLabel =
    userData.createdAt !== undefined ? formatDate(userData.createdAt) : undefined;

  await generateVolunteerResumePdf({
    displayName: profileDisplayName(userData.username),
    chapterId: userData.chapterId,
    totalXp: userData.xp ?? 0,
    role: userData.role,
    joinedAtLabel,
    linkedinUrl: userData.linkedinUrl,
    githubUrl: userData.githubUrl,
    teams: teamsPayload,
    completedQuests,
    impact: {
      eventsAttended: eventCount,
      reflections: reflectionCount,
      questsCompleted: completedQuestCount,
      badgesEarned,
    },
    earnedBadges,
    eventContributions,
    fileBaseName: userData.username,
    aiProfessionalSummary,
    aiSkills,
    aiInvolvementBullets,
  });
}
