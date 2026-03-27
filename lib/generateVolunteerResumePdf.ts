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
const ACCENT_BAR_W = 3;
const ACCENT_BAR_GAP = 4;
const HEADER_H = 38;

// Brand colors as RGB tuples
const PURPLE: [number, number, number] = [124, 58, 237];
const PURPLE_LIGHT: [number, number, number] = [168, 85, 247];
const PURPLE_TINT: [number, number, number] = [245, 244, 255];
const PURPLE_PILL: [number, number, number] = [237, 233, 254];
const LAVENDER: [number, number, number] = [220, 200, 255];
const GRAY_900: [number, number, number] = [15, 15, 20];
const GRAY_600: [number, number, number] = [82, 82, 91];
const GRAY_300: [number, number, number] = [212, 212, 216];
const GREEN: [number, number, number] = [34, 197, 94];
const WHITE: [number, number, number] = [255, 255, 255];

const TEAM_COLORS: Record<string, [number, number, number]> = {
  "Lead Learners": [245, 197, 24],
  "People & Culture": [249, 115, 22],
  "Community Engagement": [6, 182, 212],
  Creatives: [147, 51, 234],
  Sustainability: [34, 197, 94],
};

function getTeamColor(label: string): [number, number, number] {
  return TEAM_COLORS[label] ?? PURPLE_LIGHT;
}

function sanitizeFileBaseName(raw: string): string {
  const s = raw.trim().replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "resume";
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "\u2026";
}

export async function generateVolunteerResumePdf(input: VolunteerResumeInput): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const maxW = PAGE_W - MARGIN_MM * 2;
  // Body content starts after the accent bar
  const BODY_X = MARGIN_MM + ACCENT_BAR_W + ACCENT_BAR_GAP;
  const BODY_W = maxW - ACCENT_BAR_W - ACCENT_BAR_GAP;

  const hasAiSections = Boolean(
    input.aiProfessionalSummary?.trim() ||
      (input.aiSkills && input.aiSkills.length > 0) ||
      (input.aiInvolvementBullets && input.aiInvolvementBullets.length > 0)
  );
  const bottomReserveMm = hasAiSections ? 22 : 14;

  let y = MARGIN_MM;

  // ─── Footer ────────────────────────────────────────────────────────────────

  const footer = () => {
    const generated = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Thin purple rule above footer
    doc.setDrawColor(...PURPLE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_MM, PAGE_H - 12, PAGE_W - MARGIN_MM, PAGE_H - 12);

    // DevQuest wordmark
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PURPLE);
    doc.text("DevQuest", MARGIN_MM, PAGE_H - 8);

    // Generated date
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_600);
    doc.text(`Generated ${generated}`, MARGIN_MM + 22, PAGE_H - 8);

    if (hasAiSections) {
      doc.setFontSize(6);
      doc.setTextColor(130, 130, 140);
      const warnLines = doc.splitTextToSize(
        "AI-assisted sections were generated from your DevQuest activity; verify accuracy before sharing.",
        maxW
      );
      doc.text(warnLines, MARGIN_MM, PAGE_H - 4.5);
    }

    doc.setTextColor(0, 0, 0);
  };

  // ─── Page management ───────────────────────────────────────────────────────

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > PAGE_H - MARGIN_MM - bottomReserveMm) {
      footer();
      doc.addPage();
      y = MARGIN_MM;
    }
  };

  // ─── Section title with left accent bar ───────────────────────────────────

  const sectionTitle = (text: string) => {
    ensureSpace(13);
    // Purple accent bar
    doc.setFillColor(...PURPLE);
    doc.rect(MARGIN_MM, y - 4.5, ACCENT_BAR_W, 7, "F");
    // Title text
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY_900);
    doc.text(text.toUpperCase(), BODY_X, y);
    y += 2;
    // Subtle gray rule (starts at BODY_X, not at margin)
    doc.setDrawColor(...GRAY_300);
    doc.setLineWidth(0.25);
    doc.line(BODY_X, y, PAGE_W - MARGIN_MM, y);
    y += 5;
  };

  // ─── Body lines ───────────────────────────────────────────────────────────

  const bodyLines = (lines: string[], size = 8.5) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_900);
    for (const line of lines) {
      const parts = doc.splitTextToSize(line, BODY_W);
      for (const p of parts) {
        ensureSpace(5.5);
        doc.text(p, BODY_X, y);
        y += size * 0.42;
      }
    }
    y += 2.5;
  };

  // ─── Header block ─────────────────────────────────────────────────────────
  // Left zone: purple fill with name, subtitle, chapter
  // Right zone: faint tint with XP and links

  const headerY = y;

  // Left zone background
  doc.setFillColor(...PURPLE);
  doc.rect(MARGIN_MM, headerY, 65, HEADER_H, "F");

  // Right zone background
  doc.setFillColor(...PURPLE_TINT);
  doc.rect(MARGIN_MM + 65, headerY, maxW - 65, HEADER_H, "F");

  // Name (white, bold) — split if too long
  const nameParts = doc.splitTextToSize(input.displayName, 58);
  const nameLines = nameParts.slice(0, 2) as string[];
  doc.setFontSize(nameLines.length > 1 ? 16 : 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  const nameStartY = headerY + (nameLines.length > 1 ? 9 : 11);
  doc.text(nameLines, MARGIN_MM + 4, nameStartY);

  const afterNameY = nameStartY + nameLines.length * (nameLines.length > 1 ? 6 : 7);

  // Subtitle
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...LAVENDER);
  doc.text("DEVCON Kids Volunteer", MARGIN_MM + 4, afterNameY + 1);

  // Chapter
  doc.setFontSize(7);
  doc.text(`\u25B8 ${input.chapterId}`, MARGIN_MM + 4, afterNameY + 6);

  // Coordinator badge
  if (input.role === "coordinator") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...WHITE);
    doc.text("(Coordinator)", MARGIN_MM + 4, afterNameY + 11);
  }

  // XP — large number in purple on tint background
  const xpX = MARGIN_MM + 69;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PURPLE);
  doc.text(input.totalXp.toLocaleString(), xpX, headerY + 14);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_600);
  doc.text("TOTAL XP", xpX, headerY + 19);

  // Links
  let linkY = headerY + 26;
  if (input.linkedinUrl?.trim()) {
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_600);
    doc.text("in  " + truncate(input.linkedinUrl.trim(), 32), xpX, linkY);
    linkY += 5;
  }
  if (input.githubUrl?.trim()) {
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_600);
    doc.text("gh  " + truncate(input.githubUrl.trim(), 32), xpX, linkY);
  }

  y = headerY + HEADER_H + 5;

  // Purple rule under header
  doc.setDrawColor(...PURPLE);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_MM, y, PAGE_W - MARGIN_MM, y);
  y += 6;

  // ─── AI sections ──────────────────────────────────────────────────────────

  if (input.aiProfessionalSummary?.trim()) {
    sectionTitle("Professional Summary");
    bodyLines([input.aiProfessionalSummary.trim()]);
  }
  if (input.aiSkills && input.aiSkills.length > 0) {
    sectionTitle("Skills");
    bodyLines(input.aiSkills.map((s) => `\u2022 ${s}`));
  }
  if (input.aiInvolvementBullets && input.aiInvolvementBullets.length > 0) {
    sectionTitle("Involvement Highlights");
    bodyLines(input.aiInvolvementBullets.map((s) => `\u2022 ${s}`));
  }

  // ─── Teams & Progression ──────────────────────────────────────────────────

  sectionTitle("Teams & Progression");
  if (input.teams.length === 0) {
    bodyLines(["No teams listed yet."]);
  } else {
    for (const t of input.teams) {
      ensureSpace(8);
      const [r, g, b] = getTeamColor(t.teamLabel);

      // Team color swatch
      doc.setFillColor(r, g, b);
      doc.rect(BODY_X, y - 2.5, 3, 3, "F");

      // Team name bold
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...GRAY_900);
      doc.text(t.teamLabel, BODY_X + 5, y);

      // Tier in gray
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_600);
      doc.text(`  \u2014  ${t.earnedTierLabel}`, BODY_X + 5 + doc.getTextWidth(t.teamLabel), y);

      y += 5.5;
    }
    y += 2;
  }

  // ─── Volunteer Milestones ─────────────────────────────────────────────────

  sectionTitle("Volunteer Milestones & Involvement");
  if (input.completedQuests.length === 0) {
    bodyLines(["No completed quests yet."]);
  } else {
    for (const q of input.completedQuests) {
      const nameParts = doc.splitTextToSize(q.name, BODY_W - 6);
      for (let i = 0; i < nameParts.length; i++) {
        ensureSpace(5.5);
        if (i === 0) {
          if (q.coordinatorVerified) {
            // Green checkmark
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...GREEN);
            doc.text("\u2713", BODY_X, y);
          } else {
            // Plain bullet, muted
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...GRAY_600);
            doc.text("\u2022", BODY_X, y);
          }
          // Quest name
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...GRAY_900);
          doc.text(nameParts[i], BODY_X + 5, y);
        } else {
          // Continuation lines indented
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...GRAY_900);
          doc.text(nameParts[i], BODY_X + 5, y);
        }
        y += 4.5;
      }
    }
    y += 2;
  }

  // ─── Impact — 2×2 metric grid ─────────────────────────────────────────────

  sectionTitle("Impact");

  const BOX_W = (BODY_W - 4) / 2;
  const BOX_H = 18;
  const BOX_GAP = 4;

  const impactBoxes = [
    { value: input.impact.eventsAttended, label: "Events Attended" },
    { value: input.impact.reflections, label: "Reflections" },
    { value: input.impact.questsCompleted, label: "Quests Completed" },
    { value: input.impact.badgesEarned, label: "Badges Earned" },
  ];

  ensureSpace(BOX_H * 2 + BOX_GAP + 4);
  const gridStartY = y;

  impactBoxes.forEach((box, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = BODY_X + col * (BOX_W + BOX_GAP);
    const by = gridStartY + row * (BOX_H + BOX_GAP);

    // Box background
    doc.setFillColor(...PURPLE_TINT);
    doc.roundedRect(bx, by, BOX_W, BOX_H, 2, 2, "F");

    // Top accent strip
    doc.setFillColor(...PURPLE);
    doc.rect(bx, by, BOX_W, 1.5, "F");

    // Large number
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PURPLE);
    doc.text(String(box.value), bx + 4, by + 11);

    // Label
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_600);
    doc.text(box.label.toUpperCase(), bx + 4, by + 15.5);
  });

  y = gridStartY + 2 * (BOX_H + BOX_GAP) + 3;

  // ─── Badges Earned — pill flow ────────────────────────────────────────────

  sectionTitle("Badges Earned");

  if (input.earnedBadgeNames.length === 0) {
    bodyLines(["None yet."]);
  } else {
    const PILL_H = 6;
    const PILL_PAD_X = 3;
    const PILL_GAP = 2.5;
    const PILL_ROW_H = PILL_H + PILL_GAP;

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");

    let px = BODY_X;
    let py = y;

    for (const name of input.earnedBadgeNames) {
      const tw = doc.getTextWidth(name);
      const pillW = tw + PILL_PAD_X * 2;

      // Wrap to next row if overflow
      if (px + pillW > PAGE_W - MARGIN_MM && px !== BODY_X) {
        px = BODY_X;
        py += PILL_ROW_H;
      }

      // Page break mid-pill-row: reset coordinates
      const prevY = y;
      ensureSpace(PILL_H + 2);
      if (y !== prevY) {
        px = BODY_X;
        py = y;
      }

      // Pill background
      doc.setFillColor(...PURPLE_PILL);
      doc.rect(px, py - PILL_H + 1.5, pillW, PILL_H, "F");

      // Badge text
      doc.setFontSize(7);
      doc.setTextColor(...PURPLE);
      doc.text(name, px + PILL_PAD_X, py);

      px += pillW + PILL_GAP;
    }

    y = py + PILL_H + 3;
  }

  // ─── Recent Activity — two-column ─────────────────────────────────────────

  sectionTitle("Recent Activity");

  if (input.recentActivity.length === 0) {
    bodyLines(["No recent activity."]);
  } else {
    const DATE_COL_W = 22;
    const DESC_COL_W = BODY_W - DATE_COL_W - 3;

    for (const row of input.recentActivity) {
      const descParts = doc.splitTextToSize(row.description, DESC_COL_W) as string[];
      ensureSpace(descParts.length * 4 + 2);

      // Description (left)
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_900);
      for (let i = 0; i < descParts.length; i++) {
        doc.text(descParts[i], BODY_X, y + i * 4);
      }

      // Date (right-aligned, first line only)
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_600);
      const dateX = PAGE_W - MARGIN_MM - doc.getTextWidth(row.dateLabel);
      doc.text(row.dateLabel, dateX, y);

      y += descParts.length * 4 + 1.5;
    }
  }

  footer();
  const base = sanitizeFileBaseName(input.fileBaseName);
  doc.save(`devquest-resume-${base}.pdf`);
}
