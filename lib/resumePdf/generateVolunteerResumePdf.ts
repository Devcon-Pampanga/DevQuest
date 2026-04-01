import type { VolunteerResumeInput } from "./types";
import {
  MARGIN_MM,
  PAGE_W,
  PAGE_H,
  ACCENT_BAR_W,
  ACCENT_BAR_GAP,
  HEADER_H,
  HEADER_LEFT_ZONE_MM,
  HEADER_INNER_PAD_MM,
  PURPLE,
  PURPLE_TINT,
  PURPLE_PILL,
  LAVENDER,
  GRAY_900,
  GRAY_600,
  GRAY_300,
  GREEN,
  WHITE,
  getTeamColor,
  sanitizeFileBaseName,
  truncate,
} from "./constants";

async function fetchPngDataUrlForPdf(imagePath: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(imagePath, window.location.origin).href;
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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
  const headerRightZoneW = maxW - HEADER_LEFT_ZONE_MM;
  const nameInnerW = HEADER_LEFT_ZONE_MM - HEADER_INNER_PAD_MM * 2;
  const headerTextX = MARGIN_MM + HEADER_INNER_PAD_MM;

  // Left zone background
  doc.setFillColor(...PURPLE);
  doc.rect(MARGIN_MM, headerY, HEADER_LEFT_ZONE_MM, HEADER_H, "F");

  // Right zone background
  doc.setFillColor(...PURPLE_TINT);
  doc.rect(MARGIN_MM + HEADER_LEFT_ZONE_MM, headerY, headerRightZoneW, HEADER_H, "F");

  // Name (white, bold) — split if too long (width matches purple column padding)
  const nameParts = doc.splitTextToSize(input.displayName, nameInnerW);
  const nameLines = nameParts.slice(0, 2) as string[];
  doc.setFontSize(nameLines.length > 1 ? 16 : 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  const nameStartY = headerY + (nameLines.length > 1 ? 9 : 11);
  doc.text(nameLines, headerTextX, nameStartY);

  const afterNameY = nameStartY + nameLines.length * (nameLines.length > 1 ? 6 : 7);

  // Subtitle
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...LAVENDER);
  doc.text("DEVCON Kids Volunteer", headerTextX, afterNameY + 1);

  // Chapter
  doc.setFontSize(7);
  const chapterLines = doc.splitTextToSize(`\u25B8 ${input.chapterId}`, nameInnerW) as string[];
  let chapterY = afterNameY + 6;
  for (const cl of chapterLines.slice(0, 2)) {
    doc.text(cl, headerTextX, chapterY);
    chapterY += 4;
  }

  let metaY = chapterY + 1;
  if (input.role === "coordinator") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...WHITE);
    doc.text("(Coordinator)", headerTextX, metaY);
    metaY += 5;
  }
  if (input.joinedAtLabel?.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...LAVENDER);
    doc.text(`Joined at ${input.joinedAtLabel.trim()}`, headerTextX, metaY);
  }

  // XP — large number in purple on tint background
  const xpX = MARGIN_MM + HEADER_LEFT_ZONE_MM + HEADER_INNER_PAD_MM;
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
    doc.text("in  " + truncate(input.linkedinUrl.trim(), 26), xpX, linkY);
    linkY += 5;
  }
  if (input.githubUrl?.trim()) {
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_600);
    doc.text("gh  " + truncate(input.githubUrl.trim(), 26), xpX, linkY);
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

  if (input.earnedBadges.length === 0) {
    bodyLines(["None yet."]);
  } else {
    const COLS = 5;
    const CELL_GAP = 3;
    const IMG_MM = 12;
    const cellW = (BODY_W - (COLS - 1) * CELL_GAP) / COLS;
    const labelLineH = 3.2;
    const maxLabelLines = 2;
    const rowH = IMG_MM + 2 + maxLabelLines * labelLineH + 4;

    const PILL_H = 6;
    const PILL_PAD_X = 3;

    const drawPillFallback = (name: string, bx: number, rowTop: number) => {
      const short = truncate(name, 14);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      const tw = doc.getTextWidth(short);
      const pillW = Math.min(cellW - 1, tw + PILL_PAD_X * 2);
      const px = bx + (cellW - pillW) / 2;
      const py = rowTop + 2;
      doc.setFillColor(...PURPLE_PILL);
      doc.rect(px, py, pillW, PILL_H, "F");
      doc.setTextColor(...PURPLE);
      doc.text(short, px + PILL_PAD_X, py + PILL_H - 1.5);
    };

    let col = 0;
    let rowStartY = y;

    for (const badge of input.earnedBadges) {
      if (col === 0) {
        ensureSpace(rowH);
        rowStartY = y;
      }

      const bx = BODY_X + col * (cellW + CELL_GAP);
      const dataUrl = await fetchPngDataUrlForPdf(badge.image);

      if (dataUrl) {
        try {
          const imgX = bx + (cellW - IMG_MM) / 2;
          doc.addImage(dataUrl, "PNG", imgX, rowStartY, IMG_MM, IMG_MM);
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...GRAY_900);
          const labelLines = doc.splitTextToSize(badge.name, cellW - 1) as string[];
          let ly = rowStartY + IMG_MM + 2;
          for (const line of labelLines.slice(0, maxLabelLines)) {
            doc.text(line, bx + cellW / 2, ly, { align: "center" });
            ly += labelLineH;
          }
        } catch {
          drawPillFallback(badge.name, bx, rowStartY);
        }
      } else {
        drawPillFallback(badge.name, bx, rowStartY);
      }

      col += 1;
      if (col >= COLS) {
        col = 0;
        y = rowStartY + rowH;
      }
    }

    if (col !== 0) {
      y = rowStartY + rowH;
    }
    y += 3;
  }

  footer();
  const base = sanitizeFileBaseName(input.fileBaseName);
  doc.save(`devquest-resume-${base}.pdf`);
}
