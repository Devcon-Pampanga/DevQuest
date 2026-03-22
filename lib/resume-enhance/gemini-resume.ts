import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { ResumeEnhancePromptContext } from "./load-context";

export interface GeminiResumeSections {
  professionalSummary: string | null;
  skills: string[];
  involvementBullets: string[];
}

const SYSTEM_INSTRUCTION = `You are a professional resume writer helping a youth nonprofit volunteer.
Write concise, honest content suitable for an employer-facing resume.
Use only facts from the JSON context. Do not invent employers, dates, or credentials not implied by the data.
Use first-person implied phrasing or strong verb-led bullets (no "I" overload).
Keep professionalSummary to 2–3 short sentences if present.
skills: 6–12 short phrases (e.g. "Event facilitation", "Peer mentoring").
involvementBullets: 4–8 bullets highlighting volunteer impact, drawn from quests, reflections, and activity.`;

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/m);
  if (fence) return fence[1].trim();
  return trimmed;
}

function parseResumeJson(text: string): GeminiResumeSections | null {
  let parsed: {
    professionalSummary?: string | null;
    skills?: string[];
    involvementBullets?: string[];
  };
  try {
    parsed = JSON.parse(extractJsonPayload(text)) as typeof parsed;
  } catch {
    return null;
  }

  const skills = Array.isArray(parsed.skills)
    ? parsed.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 14)
    : [];
  const involvementBullets = Array.isArray(parsed.involvementBullets)
    ? parsed.involvementBullets.map((s) => String(s).trim()).filter(Boolean).slice(0, 10)
    : [];
  const professionalSummary =
    typeof parsed.professionalSummary === "string" && parsed.professionalSummary.trim()
      ? parsed.professionalSummary.trim().slice(0, 800)
      : null;

  return { professionalSummary, skills, involvementBullets };
}

const JSON_ONLY_SUFFIX = `

Respond with valid JSON only (no markdown), exact shape:
{"professionalSummary":"string or empty string","skills":["..."],"involvementBullets":["..."]}`;

function isGeminiQuotaError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return (
    m.includes("429") ||
    m.includes("Quota exceeded") ||
    m.includes("Too Many Requests") ||
    m.includes("RESOURCE_EXHAUSTED")
  );
}

/** Unversioned names like gemini-1.5-flash often 404 on v1beta; use e.g. gemini-1.5-flash-002. */
function isModelNotFoundError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return m.includes("404") && (m.includes("not found") || m.includes("Not Found"));
}

function sectionsEmpty(s: GeminiResumeSections): boolean {
  return !s.professionalSummary && s.skills.length === 0 && s.involvementBullets.length === 0;
}

/** Order: primary, optional comma-separated GEMINI_FALLBACK_MODEL, then built-in versioned IDs (deduped). */
export function buildGeminiModelChain(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const raw = process.env.GEMINI_FALLBACK_MODEL?.trim();
  const fromEnv = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const builtIn = ["gemini-1.5-flash-002", "gemini-2.5-flash"];
  const chain: string[] = [];
  for (const m of [primary, ...fromEnv, ...builtIn]) {
    if (m && !chain.includes(m)) chain.push(m);
  }
  return chain;
}

export async function generateResumeSectionsWithGemini(
  context: ResumeEnhancePromptContext
): Promise<GeminiResumeSections> {
  const empty: GeminiResumeSections = { professionalSummary: null, skills: [], involvementBullets: [] };
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const debug = process.env.NODE_ENV !== "production";

  if (!apiKey) {
    if (debug) console.warn("[resume-enhance/gemini] GEMINI_API_KEY is not set");
    return empty;
  }

  const modelChain = buildGeminiModelChain();
  if (debug) {
    console.log("[resume-enhance/gemini] model chain:", modelChain.join(" -> "));
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const responseSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      professionalSummary: { type: SchemaType.STRING },
      skills: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      involvementBullets: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
    },
    required: ["skills", "involvementBullets"],
  };

  const userPayload = JSON.stringify(context, null, 0);
  const userTurn = `Produce resume sections from this volunteer activity JSON:\n${userPayload}`;

  async function runOnce(
    modelName: string,
    useResponseSchema: boolean
  ): Promise<{ text: string | null; quotaExceeded: boolean; modelNotFound: boolean }> {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
        ...(useResponseSchema ? { responseSchema } : {}),
        temperature: 0.4,
      },
    });
    try {
      const prompt = useResponseSchema ? userTurn : `${userTurn}${JSON_ONLY_SUFFIX}`;
      const result = await model.generateContent(prompt);
      return { text: result.response.text(), quotaExceeded: false, modelNotFound: false };
    } catch (e) {
      const quotaExceeded = isGeminiQuotaError(e);
      const modelNotFound = isModelNotFoundError(e);
      if (debug) {
        console.error(
          `[resume-enhance/gemini] generateContent failed (schema=${useResponseSchema}, model=${modelName}, quota=${quotaExceeded}, notFound=${modelNotFound}):`,
          e instanceof Error ? e.message : e
        );
      }
      return { text: null, quotaExceeded, modelNotFound };
    }
  }

  for (const modelName of modelChain) {
    let { text, quotaExceeded, modelNotFound } = await runOnce(modelName, true);
    if (quotaExceeded) {
      if (debug) console.warn(`[resume-enhance/gemini] Skipping remainder of ${modelName} (quota); trying next model if any`);
      continue;
    }
    if (modelNotFound) {
      if (debug) console.warn(`[resume-enhance/gemini] Skipping ${modelName} (model not available for this API key); trying next`);
      continue;
    }

    let parsed = text ? parseResumeJson(text) : null;

    if (!parsed || sectionsEmpty(parsed)) {
      if (debug && text) {
        console.warn(
          "[resume-enhance/gemini] Empty or unparseable structured output; retrying without responseSchema. Snippet:",
          text.slice(0, 400)
        );
      }
      const second = await runOnce(modelName, false);
      if (second.quotaExceeded) continue;
      if (second.modelNotFound) continue;
      text = second.text;
      parsed = text ? parseResumeJson(text) : null;
    }

    if (!parsed || sectionsEmpty(parsed)) {
      if (debug && text) {
        console.warn("[resume-enhance/gemini] JSON parse failed. Raw snippet:", text.slice(0, 500));
      }
      continue;
    }

    if (debug) {
      console.log("[resume-enhance/gemini] Parsed sections:", {
        model: modelName,
        summaryLen: parsed.professionalSummary?.length ?? 0,
        skills: parsed.skills.length,
        bullets: parsed.involvementBullets.length,
      });
    }

    return parsed;
  }

  return empty;
}
