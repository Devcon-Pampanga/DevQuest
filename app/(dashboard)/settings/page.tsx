"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, deleteUser, User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell from "@/components/layout/PageShell";
import { DEFAULT_AVATAR, type AvatarOptions, buildAvatarUrl } from "@/lib/avatar";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { SettingsAccountSection } from "@/components/settings/SettingsAccountSection";
import { SettingsVolunteerTeamsSection } from "@/components/settings/SettingsVolunteerTeamsSection";
import { AvatarEditorModal } from "@/components/settings/AvatarEditorModal";
import type { SettingsPageUser } from "@/components/settings/types";

export default function SettingsPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<SettingsPageUser | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [draftOptions, setDraftOptions] = useState<AvatarOptions>(DEFAULT_AVATAR);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [teamLoading, setTeamLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data()?.onboardingComplete !== true) {
        router.replace("/onboarding");
        return;
      }
      const data = { uid: user.uid, ...snap.data() } as SettingsPageUser;
      setFirebaseUser(user);
      setUserData(data);
      setUsername(data.username ?? "");
      setContactNumber(data.contactNumber ?? "");
      setLinkedinUrl(data.linkedinUrl ?? "");
      setGithubUrl(data.githubUrl ?? "");
      setAuthChecked(true);
      setDataLoading(false);
    });
    return () => unsub();
  }, [router]);

  function openAvatarEditor() {
    if (!userData) return;
    setDraftOptions(userData.avatarOptions ?? DEFAULT_AVATAR);
    setShowAvatarEditor(true);
  }

  async function handleSaveAvatar() {
    if (!firebaseUser) return;
    setSavingAvatar(true);
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        avatarOptions: draftOptions,
      });
      setUserData((prev) => (prev ? { ...prev, avatarOptions: draftOptions } : prev));
      setShowAvatarEditor(false);
    } catch {
      // silently fail — user can retry
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    if (!userData || !firebaseUser) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const trimmedUsername = username.trim().toLowerCase();
      const updates: Record<string, string> = {
        username: trimmedUsername,
        contactNumber: contactNumber.trim(),
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
      };
      await updateDoc(doc(db, "users", firebaseUser.uid), updates);
      setUserData((prev) => (prev ? { ...prev, ...updates } : prev));
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLeaveTeam(teamId: string) {
    if (!userData || !firebaseUser) return;
    if ((userData.teams ?? []).length <= 1) return;
    setTeamLoading(teamId);
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        teams: arrayRemove(teamId),
      });
      setUserData((prev) =>
        prev ? { ...prev, teams: prev.teams.filter((t) => t !== teamId) } : prev
      );
    } catch {
      // silently fail — user can retry
    } finally {
      setTeamLoading(null);
    }
  }

  async function handleJoinTeam(teamId: string) {
    if (!userData || !firebaseUser) return;
    setTeamLoading(teamId);
    try {
      await Promise.all([
        updateDoc(doc(db, "users", firebaseUser.uid), {
          teams: arrayUnion(teamId),
        }),
        setDoc(
          doc(db, "users", firebaseUser.uid, "teamProgress", teamId),
          { teamId, currentTier: "team_member" },
          { merge: true }
        ),
      ]);
      setUserData((prev) =>
        prev ? { ...prev, teams: [...prev.teams, teamId] } : prev
      );
    } catch {
      // silently fail — user can retry
    } finally {
      setTeamLoading(null);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await signOut(auth);
      router.replace("/");
    } catch {
      setLogoutLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!firebaseUser) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteDoc(doc(db, "users", firebaseUser.uid));
      await deleteUser(firebaseUser);
      router.replace("/");
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "";
      setDeleteError(
        msg.includes("requires-recent-login")
          ? "Please sign out and sign back in before deleting your account."
          : "Failed to delete account. Please try again."
      );
      setDeleteLoading(false);
      setConfirmDelete(false);
    }
  }

  if (!authChecked || !userData) {
    return (
      <PageShell title="Settings" backHref="/profile" loading skeleton={<SettingsSkeleton />}>
        {null}
      </PageShell>
    );
  }

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);
  const currentTeams = userData.teams ?? [];

  return (
    <PageShell
      title="Settings"
      avatarUrl={avatarUrl}
      backHref="/profile"
      loading={dataLoading}
      skeleton={<SettingsSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-5 lg:items-start pb-10">
          <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-2">
            <SettingsProfileSection
              avatarUrl={avatarUrl}
              onOpenAvatarEditor={openAvatarEditor}
              username={username}
              setUsername={setUsername}
              contactNumber={contactNumber}
              setContactNumber={setContactNumber}
              linkedinUrl={linkedinUrl}
              setLinkedinUrl={setLinkedinUrl}
              githubUrl={githubUrl}
              setGithubUrl={setGithubUrl}
              saveError={saveError}
              saveSuccess={saveSuccess}
              saving={saving}
              onSave={handleSaveProfile}
            />
            <SettingsAccountSection
              onLogout={handleLogout}
              logoutLoading={logoutLoading}
              deleteLoading={deleteLoading}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
              deleteError={deleteError}
              setDeleteError={setDeleteError}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
          <div className="contents lg:flex lg:flex-col gap-5 lg:col-span-1">
            <SettingsVolunteerTeamsSection
              currentTeams={currentTeams}
              teamLoading={teamLoading}
              onLeaveTeam={handleLeaveTeam}
              onJoinTeam={handleJoinTeam}
            />
          </div>
        </div>
      </div>

      <AvatarEditorModal
        open={showAvatarEditor}
        username={userData.username}
        draftOptions={draftOptions}
        setDraftOptions={setDraftOptions}
        savingAvatar={savingAvatar}
        onClose={() => !savingAvatar && setShowAvatarEditor(false)}
        onSave={handleSaveAvatar}
      />
    </PageShell>
  );
}
