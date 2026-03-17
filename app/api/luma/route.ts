import { NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LumaApiEvent {
  name?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
  geo_address_json?: {
    full_address?: string;
    city?: string;
    country?: string;
    address?: string;
  };
}

interface MicrolinkResponse {
  status: "success" | "fail";
  message?: string;
  data?: {
    title?: string | null;
    description?: string | null;
    date?: string | null;
    url?: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip the " · Luma" / " | Luma" suffix that Luma appends to page titles. */
function cleanTitle(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\s*[·|]\s*luma\s*$/i, "").trim();
}

/** Resolve the best location string from Luma's geo_address_json field. */
function resolveGeo(event: LumaApiEvent): string {
  const g = event.geo_address_json;
  if (!g) return event.location?.trim() ?? "";
  return (g.full_address || g.address || g.city || "").trim();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lumaUrl = searchParams.get("url") ?? "";

  if (!lumaUrl) {
    return NextResponse.json({ error: "url param is required" }, { status: 400 });
  }

  if (!lumaUrl.match(/^https?:\/\/(www\.)?(lu\.ma|luma\.com)\//i)) {
    return NextResponse.json(
      { error: "Must be a Luma URL (e.g. https://lu.ma/my-event or https://luma.com/my-event)" },
      { status: 400 }
    );
  }

  // Normalize luma.com → lu.ma (canonical domain)
  const canonicalUrl = lumaUrl.replace(
    /^https?:\/\/(www\.)?luma\.com\//i,
    "https://lu.ma/"
  );

  const slug = canonicalUrl.replace(/^https:\/\/lu\.ma\//, "");

  // ── Step 1: Luma's own public JSON API ────────────────────────────────────
  // api.lu.ma is a plain JSON API server — no TLS fingerprinting / bot detection.
  // Public events are readable without an API key.
  try {
    const lumaApiRes = await fetch(
      `https://api.lu.ma/public/v1/event/get?url=lu.ma/${slug}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );

    if (lumaApiRes.ok) {
      const body = await lumaApiRes.json();
      const event: LumaApiEvent = body.event ?? body;

      const name = event.name?.trim() ?? "";
      const description = event.description?.trim() ?? "";
      const location = resolveGeo(event);

      if (name || description) {
        return NextResponse.json({
          name,
          description,
          startDate: event.start_at ?? "",
          endDate:   event.end_at   ?? "",
          location,
        });
      }
    }
    // 401 / 403 / no data → fall through to Microlink
  } catch (err) {
    console.warn("[luma route] Luma API unavailable, falling back to Microlink:", err);
  }

  // ── Step 2: Microlink fallback (title + description only) ─────────────────
  // Microlink uses real Chromium so it bypasses Luma's TLS bot-detection on the
  // web frontend. It reliably returns title and description but not event dates.
  try {
    const mlRes = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(canonicalUrl)}&prerender=auto`,
      { cache: "no-store" }
    );

    const json: MicrolinkResponse = await mlRes.json();

    if (json.status === "success" && json.data) {
      const { title, description } = json.data;
      const name = cleanTitle(title);

      if (!name && !description) {
        return NextResponse.json(
          { error: "Could not extract event details. The event may be private." },
          { status: 422 }
        );
      }

      return NextResponse.json({
        name,
        description: description?.trim() ?? "",
        // Microlink's date field reflects page metadata, not the event date —
        // omit it so the coordinator fills it in accurately.
        startDate: "",
        endDate:   "",
        location:  "",
      });
    }

    return NextResponse.json(
      { error: json.message ?? "Could not extract event details from this URL." },
      { status: 422 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[luma route] Microlink error:", msg);
    return NextResponse.json(
      { error: `Extraction failed: ${msg}` },
      { status: 502 }
    );
  }
}
