import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { XPLogEntry } from "@/types/xp";

export interface XpLogData {
  rawEntries: XPLogEntry[];
  hasMore: boolean;
}

export async function fetchXpLog(uid: string): Promise<XpLogData> {
  const xpCol = collection(db, "users", uid, "xpLog");
  const snap = await getDocs(
    query(xpCol, orderBy("createdAt", "desc"), limit(21))
  );
  const rawEntries = snap.docs.map(
    (d) => ({ ...d.data(), logId: d.id } as XPLogEntry)
  );
  return { rawEntries, hasMore: rawEntries.length === 21 };
}
