"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { SessionUser } from "@/types/session";

type AuthStatus = "loading" | "ready";

interface AuthContextValue {
  status: AuthStatus;
  firebaseUser: FirebaseUser | null;
  user: SessionUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapUserDoc(uid: string, data: Record<string, unknown>): SessionUser {
  return {
    uid,
    email: String(data.email ?? ""),
    role: (data.role as SessionUser["role"]) ?? "volunteer",
    username: String(data.username ?? ""),
    usernameLower: String(data.usernameLower ?? ""),
    contactNumber: String(data.contactNumber ?? ""),
    chapterId: String(data.chapterId ?? ""),
    teams: Array.isArray(data.teams) ? (data.teams as string[]) : [],
    xp: typeof data.xp === "number" ? data.xp : 0,
    onboardingComplete: data.onboardingComplete === true,
    linkedinUrl: data.linkedinUrl as string | undefined,
    githubUrl: data.githubUrl as string | undefined,
    resumeUrl: data.resumeUrl as string | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
    avatarOptions: data.avatarOptions as SessionUser["avatarOptions"],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      unsubDoc?.();
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setUser(null);
        setStatus("ready");
        return;
      }

      setStatus("loading");
      unsubDoc = onSnapshot(
        doc(db, "users", fbUser.uid),
        (snap) => {
          if (!snap.exists()) {
            setUser(null);
          } else {
            setUser(mapUserDoc(fbUser.uid, snap.data() as Record<string, unknown>));
          }
          setStatus("ready");
        },
        () => {
          setUser(null);
          setStatus("ready");
        }
      );
    });

    return () => {
      unsubAuth();
      unsubDoc?.();
    };
  }, []);

  const value = useMemo(
    () => ({ status, firebaseUser, user }),
    [status, firebaseUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
