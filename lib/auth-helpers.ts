import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export function getFriendlyAuthError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ onboardingComplete: boolean }> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, "users", credential.user.uid));
  const data = userDoc.data();
  return { onboardingComplete: data?.onboardingComplete ?? false };
}

export async function signUp(email: string, password: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const uid = credential.user.uid;

  const whitelistQuery = query(
    collection(db, "coordinator_whitelist"),
    where("email", "==", email.toLowerCase().trim())
  );
  const whitelistSnapshot = await getDocs(whitelistQuery);
  const role: "coordinator" | "volunteer" = whitelistSnapshot.empty
    ? "volunteer"
    : "coordinator";

  await setDoc(doc(db, "users", uid), {
    uid,
    email: email.toLowerCase().trim(),
    role,
    username: "",
    contactNumber: "",
    chapterId: "",
    teams: [],
    xp: 0,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
  });
}
