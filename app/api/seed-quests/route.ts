/**
 * Quest Seeder — development-only API route.
 *
 * Writes all quest definitions from lib/seed/quests.ts into Firestore
 * at quests/{questId}. Run once (or whenever quests change) by visiting:
 *   GET http://localhost:3000/api/seed-quests
 *
 * Safe to re-run: uses setDoc (upsert), existing completions are unaffected.
 * Blocked in production.
 */

import { NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QUESTS } from "@/lib/seed/quests";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Seeding is only available in development." },
      { status: 403 }
    );
  }

  try {
    for (const quest of QUESTS) {
      await setDoc(doc(db, "quests", quest.questId), quest);
    }
    return NextResponse.json({
      ok: true,
      seeded: QUESTS.length,
      message: `Successfully seeded ${QUESTS.length} quests to Firestore.`,
    });
  } catch (err) {
    console.error("Quest seeding failed:", err);
    return NextResponse.json(
      { error: "Seeding failed. Check server logs." },
      { status: 500 }
    );
  }
}
