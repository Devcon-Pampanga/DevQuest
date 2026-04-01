import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin for server-only routes (verify ID tokens, read Firestore).
 * Set FIREBASE_SERVICE_ACCOUNT_JSON to the full service account JSON string (e.g. Vercel secret).
 * For local dev with gcloud ADC, omit JSON and use applicationDefault() + NEXT_PUBLIC_FIREBASE_PROJECT_ID.
 */
export function getFirebaseAdminOrThrow(): { auth: ReturnType<typeof getAuth>; db: ReturnType<typeof getFirestore> } {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    if (json) {
      const raw = JSON.parse(json) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      initializeApp({
        credential: cert({
          projectId: raw.project_id,
          clientEmail: raw.client_email,
          privateKey: raw.private_key?.replace(/\\n/g, "\n"),
        }),
        projectId: raw.project_id ?? projectId,
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId: projectId,
      });
    }
  }
  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

export async function verifyBearerUid(authorization: string | null): Promise<string> {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("missing_token");
  }
  const token = authorization.slice(7).trim();
  if (!token) throw new Error("missing_token");
  const { auth } = getFirebaseAdminOrThrow();
  const decoded = await auth.verifyIdToken(token);
  return decoded.uid;
}
