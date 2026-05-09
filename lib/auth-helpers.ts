import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { randomAvatar } from "@/lib/avatar";
import { addXpRewardToBatch } from "@/lib/devCoins";

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
    case "auth/popup-closed-by-user":
      return "Sign-in cancelled.";
    case "auth/popup-blocked":
      return "Pop-up blocked. Please allow pop-ups for this site.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email. Try signing in with email and password.";
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
    usernameLower: "",
    contactNumber: "",
    chapterId: "",
    teams: [],
    xp: 0,
    devCoins: 0,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
  });
}

export interface CompleteOnboardingParams {
  uid: string;
  username: string;
  contactNumber: string;
  linkedinUrl: string;
  githubUrl: string;
  chapterId: string;
  teams: string[];
}

export async function completeOnboarding(
  params: CompleteOnboardingParams
): Promise<void> {
  const {
    uid,
    username,
    contactNumber,
    linkedinUrl,
    githubUrl,
    chapterId,
    teams,
  } = params;
  const lowerUsername = username.toLowerCase().trim();

  // Uniqueness check must happen outside the batch — getDocs can't run inside one
  const usernameSnap = await getDocs(
    query(collection(db, "users"), where("usernameLower", "==", lowerUsername))
  );
  if (!usernameSnap.empty) throw new Error("USERNAME_TAKEN");

  const avatarOptions = randomAvatar();
  const batch = writeBatch(db);

  // a. Update user doc — use update (not set) to preserve role/email/createdAt from signUp
  batch.update(doc(db, "users", uid), {
    username: username.trim(),
    usernameLower: lowerUsername,
    contactNumber: contactNumber.trim(),
    linkedinUrl: linkedinUrl.trim(),
    githubUrl: githubUrl.trim(),
    chapterId,
    teams,
    onboardingComplete: true,
    avatarOptions,
  });

  // b. XP reward (+10 for profile setup) plus matching DevCoins
  addXpRewardToBatch({
    firestore: db,
    uid,
    xp: 10,
    source: "profile_setup",
    sourceId: uid,
    description: "Completed profile setup",
    batch,
  });

  // c. Initialize teamProgress for each selected team
  for (const teamId of teams) {
    batch.set(doc(db, "users", uid, "teamProgress", teamId), {
      teamId,
      currentTier: "team_member",
    });
  }

  await batch.commit();

  // Sync username to Firebase Auth display name so email templates can use %DISPLAY_NAME%
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: username.trim() });
  }
}

export async function signInWithGoogle(): Promise<{
  onboardingComplete: boolean;
}> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const { uid, email } = credential.user;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const normalizedEmail = (email ?? "").toLowerCase().trim();
    const whitelistSnap = await getDocs(
      query(
        collection(db, "coordinator_whitelist"),
        where("email", "==", normalizedEmail)
      )
    );
    const role: "coordinator" | "volunteer" = whitelistSnap.empty
      ? "volunteer"
      : "coordinator";

    await setDoc(userRef, {
      uid,
      email: normalizedEmail,
      role,
      username: "",
      usernameLower: "",
      contactNumber: "",
      chapterId: "",
      teams: [],
      xp: 0,
      devCoins: 0,
      onboardingComplete: false,
      createdAt: serverTimestamp(),
    });

    return { onboardingComplete: false };
  }

  return { onboardingComplete: userSnap.data().onboardingComplete ?? false };
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
