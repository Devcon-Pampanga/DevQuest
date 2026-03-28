"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { XPLogEntry } from "@/types/xp";

export interface UseXpActivityLogResult {
  rawEntries: XPLogEntry[];
  loading: boolean;
  hasMore: boolean;
}

/**
 * Loads the user's xpLog (newest first, limit 21) for activity feed and resume.
 */
export function useXpActivityLog(uid: string): UseXpActivityLogResult {
  const [rawEntries, setRawEntries] = useState<XPLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!uid) {
      setRawEntries([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const xpCol = collection(db, "users", uid, "xpLog");
        const xpSnap = await getDocs(query(xpCol, orderBy("createdAt", "desc"), limit(21)));
        if (cancelled) return;
        const logs = xpSnap.docs.map((d) => ({ ...d.data(), logId: d.id } as XPLogEntry));
        setHasMore(logs.length === 21);
        setRawEntries(logs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { rawEntries, loading, hasMore };
}
