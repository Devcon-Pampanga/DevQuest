import { auth } from "@/lib/firebase";
import { generateVolunteerResumePdf } from "@/lib/generateVolunteerResumePdf";
import { formatDate, getEarnedTier } from "@/lib/quest-utils";
import { profileDisplayName } from "@/lib/profileDisplayName";
import { TEAM_META, TIER_LABELS } from "@/lib/seed/quests";
import { VolunteerBadgeDef } from "@/lib/volunteerBadges";
import { Quest, QuestCompletion } from "@/types/quest";
import { XPLogEntry } from "@/types/xp";

export interface ProfileResumeUser {
  username: string;
  chapterId: string;
  xp: number;
  role: "volunteer" | "coordinator";
  linkedinUrl?: string;
  githubUrl?: string;
  teams: string[];
}

export async function generateVolunteerProfileResume(params: {
  userData: ProfileResumeUser;
  completions: Record<string, QuestCompletion>;
  allQuests: Quest[];
  badges: VolunteerBadgeDef[];
  xpLogRaw: XPLogEntry[];
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
    xpLogRaw,
    eventCount,
    reflectionCount,
    completedQuestCount,
    badgesEarned,
  } = params;

  let aiProfessionalSummary: string | null | undefined;
  let aiSkills: string[] | undefined;
  let aiInvolvementBullets: string[] | undefined;
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

  const earnedBadgeNames = badges.filter((b) => b.earned).map((b) => b.name);

  const recentActivity = xpLogRaw.slice(0, 10).map((e) => ({
    description: e.description,
    dateLabel: e.createdAt ? formatDate(e.createdAt) : "—",
  }));

  await generateVolunteerResumePdf({
    displayName: profileDisplayName(userData.username),
    chapterId: userData.chapterId,
    totalXp: userData.xp ?? 0,
    role: userData.role,
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
    earnedBadgeNames,
    recentActivity,
    fileBaseName: userData.username,
    aiProfessionalSummary,
    aiSkills,
    aiInvolvementBullets,
  });
}
