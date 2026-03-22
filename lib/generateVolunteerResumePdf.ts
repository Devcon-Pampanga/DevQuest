export interface VolunteerResumeTeamRow {
  teamLabel: string;
  earnedTierLabel: string;
}

export interface VolunteerResumeQuestLine {
  name: string;
  coordinatorVerified: boolean;
}

export interface VolunteerResumeActivityLine {
  description: string;
  dateLabel: string;
}

export interface VolunteerResumeInput {
  displayName: string;
  chapterId: string;
  totalXp: number;
  role: "volunteer" | "coordinator";
  linkedinUrl?: string;
  githubUrl?: string;
  teams: VolunteerResumeTeamRow[];
  completedQuests: VolunteerResumeQuestLine[];
  impact: {
    eventsAttended: number;
    reflections: number;
    questsCompleted: number;
    badgesEarned: number;
  };
  earnedBadgeNames: string[];
  recentActivity: VolunteerResumeActivityLine[];
  fileBaseName: string;
  /** Optional Gemini-assisted blocks (from POST /api/resume-enhance). */
  aiProfessionalSummary?: string | null;
  aiSkills?: string[];
  aiInvolvementBullets?: string[];
}

const MARGIN_MM = 18;
const PAGE_W = 210;
const PAGE_H = 297;

function sanitizeFileBaseName(raw: string): string {
  const s = raw.trim().replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "resume";
}

export async function generateVolunteerResumePdf(input: VolunteerResumeInput): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const maxW = PAGE_W - MARGIN_MM * 2;

  const hasAiSections = Boolean(
    input.aiProfessionalSummary?.trim() ||
      (input.aiSkills && input.aiSkills.length > 0) ||
      (input.aiInvolvementBullets && input.aiInvolvementBullets.length > 0)
  );
  const bottomReserveMm = hasAiSections ? 22 : 12;

  let y = MARGIN_MM;

  const footer = () => {
    const generated = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const mainY = PAGE_H - 9;
    doc.setFontSize(7);
    doc.text(`DevQuest volunteer summary · ${generated}`, MARGIN_MM, mainY);
    if (hasAiSections) {
      doc.setFontSize(6.5);
      const warnLines = doc.splitTextToSize(
        "AI-assisted sections were generated from your DevQuest activity; verify accuracy before sharing.",
        maxW
      );
      let wy = mainY - 5;
      for (let i = warnLines.length - 1; i >= 0; i--) {
        doc.text(warnLines[i], MARGIN_MM, wy);
        wy -= 3.2;
      }
    }
    doc.setTextColor(0, 0, 0);
  };

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > PAGE_H - MARGIN_MM - bottomReserveMm) {
      footer();
      doc.addPage();
      y = MARGIN_MM;
    }
  };

  const sectionTitle = (text: string) => {
    ensureSpace(10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(text.toUpperCase(), MARGIN_MM, y);
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN_MM, y, PAGE_W - MARGIN_MM, y);
    y += 5;
  };

  const bodyLines = (lines: string[], size = 9) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    for (const line of lines) {
      const parts = doc.splitTextToSize(line, maxW);
      for (const p of parts) {
        ensureSpace(6);
        doc.text(p, MARGIN_MM, y);
        y += size * 0.45;
      }
    }
    y += 2;
  };

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(input.displayName, MARGIN_MM, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("DEVCON Kids volunteer — DevQuest summary", MARGIN_MM, y);
  doc.setTextColor(0, 0, 0);
  y += 10;

  sectionTitle("Snapshot");
  bodyLines([
    `Chapter: ${input.chapterId}`,
    `Total XP: ${input.totalXp.toLocaleString()}`,
    `Platform role: ${input.role}`,
  ]);

  const links: string[] = [];
  if (input.linkedinUrl?.trim()) links.push(`LinkedIn: ${input.linkedinUrl.trim()}`);
  if (input.githubUrl?.trim()) links.push(`GitHub: ${input.githubUrl.trim()}`);
  if (links.length > 0) {
    sectionTitle("Professional links");
    bodyLines(links);
  }

  if (input.aiProfessionalSummary?.trim()) {
    sectionTitle("Professional summary (AI-assisted)");
    bodyLines([input.aiProfessionalSummary.trim()]);
  }
  if (input.aiSkills && input.aiSkills.length > 0) {
    sectionTitle("Skills (AI-assisted)");
    bodyLines(input.aiSkills.map((s) => `\u2022 ${s}`));
  }
  if (input.aiInvolvementBullets && input.aiInvolvementBullets.length > 0) {
    sectionTitle("Involvement highlights (AI-assisted)");
    bodyLines(input.aiInvolvementBullets.map((s) => `\u2022 ${s}`));
  }

  sectionTitle("Teams & progression");
  if (input.teams.length === 0) {
    bodyLines(["No teams listed yet."]);
  } else {
    for (const t of input.teams) {
      bodyLines([`${t.teamLabel} — ${t.earnedTierLabel}`]);
    }
  }

  sectionTitle("Volunteer milestones & involvement");
  if (input.completedQuests.length === 0) {
    bodyLines(["No completed quests yet."]);
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    for (const q of input.completedQuests) {
      const prefix = q.coordinatorVerified ? "Verified: " : "";
      const bullet = `\u2022 ${prefix}${q.name}`;
      const parts = doc.splitTextToSize(bullet, maxW - 4);
      for (let i = 0; i < parts.length; i++) {
        ensureSpace(6);
        doc.text(parts[i], MARGIN_MM + (i === 0 ? 0 : 3), y);
        y += 4.2;
      }
    }
    y += 2;
  }

  sectionTitle("Impact");
  bodyLines([
    `Events attended: ${input.impact.eventsAttended}`,
    `Reflections submitted: ${input.impact.reflections}`,
    `Quests completed: ${input.impact.questsCompleted}`,
    `Badges earned: ${input.impact.badgesEarned}`,
  ]);

  sectionTitle("Badges earned");
  if (input.earnedBadgeNames.length === 0) {
    bodyLines(["None yet."]);
  } else {
    for (const name of input.earnedBadgeNames) {
      const parts = doc.splitTextToSize(`\u2022 ${name}`, maxW);
      for (const p of parts) {
        ensureSpace(6);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(p, MARGIN_MM, y);
        y += 4.2;
      }
    }
    y += 2;
  }

  sectionTitle("Recent activity");
  if (input.recentActivity.length === 0) {
    bodyLines(["No recent activity."]);
  } else {
    for (const row of input.recentActivity) {
      const line = `${row.description}  (${row.dateLabel})`;
      const parts = doc.splitTextToSize(line, maxW);
      for (const p of parts) {
        ensureSpace(6);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.text(p, MARGIN_MM, y);
        y += 4;
      }
      y += 1;
    }
  }

  footer();
  const base = sanitizeFileBaseName(input.fileBaseName);
  doc.save(`devquest-resume-${base}.pdf`);
}
