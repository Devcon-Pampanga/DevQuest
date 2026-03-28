/**
 * POST /api/resume-enhance
 * Authorization: Bearer <Firebase ID token>
 *
 * Returns AI-written resume snippets (Gemini) from server-loaded Firestore context.
 * Env: GEMINI_API_KEY, GEMINI_MODEL / GEMINI_FALLBACK_MODEL (optional), FIREBASE_SERVICE_ACCOUNT_JSON (or ADC locally).
 * Rate limit: one successful path per ~45s per user (in-memory; resets on cold start).
 */

import { NextResponse } from "next/server";
import { verifyBearerUid, getFirebaseAdminOrThrow } from "@/lib/firebase-admin";
import { buildGeminiModelChain, generateResumeSectionsWithGemini } from "@/lib/resume-enhance/gemini-resume";
import { loadResumeEnhanceContext } from "@/lib/resume-enhance/load-context";
import { mergeEventContributions } from "@/lib/resume-enhance/merge-event-contributions";
import { markResumeEnhanceRateLimit, peekResumeEnhanceRateLimit } from "@/lib/resume-enhance/rate-limit";

export const maxDuration = 60;

const RATE_MS = () =>
  Number(process.env.RESUME_ENHANCE_RATE_LIMIT_MS ?? "") ||
  (process.env.NODE_ENV === "development" ? 8_000 : 45_000);

export async function POST(req: Request) {
  const debug = process.env.NODE_ENV !== "production";
  let uid: string;
  try {
    uid = await verifyBearerUid(req.headers.get("authorization"));
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const minMs = RATE_MS();
  if (!peekResumeEnhanceRateLimit(uid, minMs)) {
    if (debug) console.warn("[resume-enhance] rate_limited uid=", uid.slice(0, 8), "minMs=", minMs);
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const { db } = getFirebaseAdminOrThrow();
    const context = await loadResumeEnhanceContext(db, uid);
    if (!context) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    if (debug) {
      console.log("[resume-enhance] context loaded:", {
        uid: uid.slice(0, 8),
        questsCompleted: context.stats.questsCompleted,
        reflectionsInPrompt: context.reflections.length,
        attendedEvents: context.attendedEvents.length,
        teams: context.teamSummaries.length,
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
        modelChain: buildGeminiModelChain(),
      });
    }

    const sections = await generateResumeSectionsWithGemini(context);
    const eventContributions = mergeEventContributions(
      context.attendedEvents,
      sections.eventContributions
    );
    const hasContent =
      Boolean(sections.professionalSummary) ||
      sections.skills.length > 0 ||
      sections.involvementBullets.length > 0;

    if (debug) {
      console.log("[resume-enhance] gemini result:", {
        enhanced: hasContent,
        skills: sections.skills.length,
        bullets: sections.involvementBullets.length,
        hasSummary: Boolean(sections.professionalSummary),
        eventContributions: eventContributions.length,
      });
    }

    markResumeEnhanceRateLimit(uid);
    return NextResponse.json({
      enhanced: hasContent,
      professionalSummary: sections.professionalSummary,
      skills: sections.skills,
      involvementBullets: sections.involvementBullets,
      eventContributions,
    });
  } catch (e) {
    console.error("resume-enhance:", e);
    return NextResponse.json({ error: "resume_enhance_failed" }, { status: 500 });
  }
}
