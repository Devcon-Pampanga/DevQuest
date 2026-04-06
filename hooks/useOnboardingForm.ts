"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { completeOnboarding } from "@/lib/auth-helpers";

const CONTACT_PREFIX = "+63 ";

export function useOnboardingForm() {
  const router = useRouter();
  const { firebaseUser, user, status } = useAuth();

  const [username, setUsername]           = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl]     = useState("");
  const [githubUrl, setGithubUrl]         = useState("");
  const [chapterId, setChapterId]         = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [showTeamInfo, setShowTeamInfo]   = useState(false);

  useEffect(() => {
    if (status !== "ready") return;
    if (!firebaseUser) {
      router.replace("/");
      return;
    }
    if (user?.onboardingComplete === true) {
      router.replace("/dashboard");
    }
  }, [status, firebaseUser, user, router]);

  const showOnboarding =
    status === "ready" && firebaseUser && user && user.onboardingComplete === false;

  function toggleTeam(teamId: string) {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((t) => t !== teamId) : [...prev, teamId]
    );
  }

  function formatContactNumber(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) return CONTACT_PREFIX;
    let after63 = digits.startsWith("63") ? digits.slice(2) : digits;
    after63 = after63.slice(0, 10);
    const part1 = after63.slice(0, 3);
    const part2 = after63.slice(3, 6);
    const part3 = after63.slice(6, 10);
    return CONTACT_PREFIX + [part1, part2, part3].filter(Boolean).join(" ");
  }

  function ensureFullUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("http://") || lower.startsWith("https://")) return trimmed;
    return "https://" + trimmed.replace(/^\/+/, "");
  }

  function validate(): string {
    const u = username.trim();
    if (!u) return "Full name is required.";
    if (u.length < 3) return "Full name must be at least 3 characters.";
    if (!contactNumber.trim()) return "Contact number is required.";
    if (!chapterId) return "Please select your chapter.";
    if (selectedTeams.length === 0) return "Please select at least one team.";
    return "";
  }

  async function handleSubmit() {
    setError("");
    const validErr = validate();
    if (validErr) { setError(validErr); return; }
    if (!firebaseUser?.uid) return;

    setLoading(true);
    try {
      await completeOnboarding({
        uid:           firebaseUser.uid,
        username:      username.trim(),
        contactNumber: contactNumber.replace(/\s/g, "").trim(),
        linkedinUrl:   ensureFullUrl(linkedinUrl),
        githubUrl:     ensureFullUrl(githubUrl),
        chapterId,
        teams: selectedTeams,
      });
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(
        (err as Error).message === "USERNAME_TAKEN"
          ? "A profile with this name already exists."
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    showOnboarding: !!showOnboarding,
    username, setUsername,
    contactNumber, setContactNumber,
    linkedinUrl, setLinkedinUrl,
    githubUrl, setGithubUrl,
    chapterId, setChapterId,
    selectedTeams,
    toggleTeam,
    formatContactNumber,
    CONTACT_PREFIX,
    error,
    loading,
    showTeamInfo, setShowTeamInfo,
    handleSubmit,
  };
}
