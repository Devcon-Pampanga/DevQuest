import {
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
  type FieldValue,
  type Firestore,
  type WriteBatch,
} from "firebase/firestore";
import type { XPLogSource } from "@/types/xp";

export function getDevCoinsForXp(xp: number): number {
  return Math.floor(xp / 10);
}

interface AwardXpWithDevCoinsParams {
  firestore: Firestore;
  uid: string;
  xp: number;
  source: XPLogSource | string;
  sourceId: string;
  description: string;
  batch?: WriteBatch;
  createdAt?: FieldValue;
}

export function addXpRewardToBatch({
  firestore,
  uid,
  xp,
  source,
  sourceId,
  description,
  batch,
  createdAt = serverTimestamp(),
}: AwardXpWithDevCoinsParams): WriteBatch {
  const targetBatch = batch ?? writeBatch(firestore);
  const userRef = doc(firestore, "users", uid);
  const xpLogRef = doc(collection(firestore, "users", uid, "xpLog"));

  targetBatch.update(userRef, {
    xp: increment(xp),
    devCoins: increment(getDevCoinsForXp(xp)),
  });
  targetBatch.set(xpLogRef, {
    logId: xpLogRef.id,
    source,
    sourceId,
    description,
    xp,
    createdAt,
  });

  return targetBatch;
}

export async function awardXpWithDevCoins(
  params: AwardXpWithDevCoinsParams
): Promise<void> {
  const batch = addXpRewardToBatch(params);
  await batch.commit();
}
