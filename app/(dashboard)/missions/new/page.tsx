"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  collection,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import PageShell, { SkeletonLine, SkeletonBlock } from "@/components/layout/PageShell";
import { TEAM_META } from "@/lib/seed/quests";
import {
  MissionDifficulty,
  MissionAssignmentType,
  DIFFICULTY_META,
} from "@/types/mission";

const WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvatarOptions {
  backgroundColor: string;
  backgroundType: "solid" | "gradientLinear";
  eyes: string;
  mouth: string;
}

interface UserData {
  uid: string;
  username: string;
  role: "volunteer" | "coordinator";
  chapterId: string;
  teams: string[];
  avatarOptions?: AvatarOptions;
}

interface ChapterVolunteer {
  uid: string;
  username: string;
  teams: string[];
  avatarOptions?: AvatarOptions;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR: AvatarOptions = {
  backgroundColor: "5e35b1",
  backgroundType: "solid",
  eyes: "round",
  mouth: "smile01",
};

function buildAvatarUrl(seed: string, opts: AvatarOptions): string {
  const p: Record<string, string> = {
    seed,
    backgroundColor: opts.backgroundColor,
    backgroundType: opts.backgroundType,
    eyes: opts.eyes,
    mouth: opts.mouth,
  };
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?${new URLSearchParams(p)}`;
}

// ─── Shared style constants ───────────────────────────────────────────────────

const INPUT_CLS =
  "w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow";

const LABEL_CLS =
  "block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2";

function SectionCard({
  stripe = "linear-gradient(90deg, #7C3AED, #A855F7)",
  animDelay = 0,
  padding = "p-5",
  children,
}: {
  stripe?: string;
  animDelay?: number;
  padding?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-border overflow-hidden animate-fade-up"
      style={{ backgroundColor: "#1e1a2e", animationDelay: `${animDelay}ms` }}
    >
      <div className="h-[3px] w-full" style={{ background: stripe, transition: "background 200ms ease-out" }} />
      <div className={padding}>{children}</div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AddMissionSkeleton() {
  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5 pb-10">
      <SkeletonBlock className="h-8 w-48 rounded-lg" />
      <SkeletonBlock className="h-40 rounded-2xl" />
      <SkeletonBlock className="h-48 rounded-2xl" />
      <SkeletonBlock className="h-32 rounded-2xl" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AddMissionPageInner() {
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<MissionDifficulty>("medium");
  const [assignmentType, setAssignmentType] = useState<MissionAssignmentType>("open");
  const [slots, setSlots] = useState(10);
  const [slotsRaw, setSlotsRaw] = useState("10");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<ChapterVolunteer[]>([]);
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [submissionGuidance, setSubmissionGuidance] = useState("");

  // Chapter volunteers (for specific assignment type)
  const [chapterVolunteers, setChapterVolunteers] = useState<ChapterVolunteer[]>([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);

  // Errors + submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ count: number; type: MissionAssignmentType } | null>(null);

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.replace("/"); return; }
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!snap.exists()) { router.replace("/"); return; }
      const data = snap.data() as Omit<UserData, "uid"> & { onboardingComplete?: boolean };
      if (!data.onboardingComplete) { router.replace("/onboarding"); return; }
      if (data.role !== "coordinator") { router.replace("/quests"); return; }
      setUserData({ ...data, uid: firebaseUser.uid } as UserData);
      setLoadingAuth(false);
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load chapter volunteers when specific assignment selected ────────────────
  useEffect(() => {
    if (assignmentType !== "specific" || !userData?.chapterId) return;
    setLoadingVolunteers(true);
    getDocs(
      query(
        collection(db, "users"),
        where("chapterId", "==", userData.chapterId),
        where("role", "==", "volunteer")
      )
    ).then((snap) => {
      setChapterVolunteers(
        snap.docs.map((d) => ({
          uid: d.id,
          username: d.data().username as string,
          teams: (d.data().teams as string[]) ?? [],
          avatarOptions: d.data().avatarOptions as AvatarOptions | undefined,
        }))
      );
      setLoadingVolunteers(false);
    });
  }, [assignmentType, userData?.chapterId]);

  // ── Volunteer picker helpers ─────────────────────────────────────────────────
  const filteredVolunteers = chapterVolunteers.filter(
    (v) =>
      !selectedVolunteers.find((s) => s.uid === v.uid) &&
      v.username.toLowerCase().includes(volunteerSearch.toLowerCase())
  );

  function toggleVolunteer(v: ChapterVolunteer) {
    setSelectedVolunteers((prev) =>
      prev.find((s) => s.uid === v.uid)
        ? prev.filter((s) => s.uid !== v.uid)
        : [...prev, v]
    );
  }

  // ── Validation ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Give this mission a name.";
    if (!description.trim()) errs.description = "Describe what needs to be done.";
    if (assignmentType === "specific" && selectedVolunteers.length === 0)
      errs.assignees = "Pick at least one volunteer.";
    if (assignmentType === "team" && selectedTeams.length === 0)
      errs.team = "Pick at least one team.";
    if (hasDeadline && (!deadlineDate || !deadlineTime)) {
      errs.deadline = "Set both a date and time for the deadline.";
    } else if (hasDeadline && deadlineDate && deadlineTime) {
      const deadlineTs = new Date(`${deadlineDate}T${deadlineTime}:00`).getTime();
      if (deadlineTs <= Date.now()) {
        errs.deadline = "The deadline has already passed — pick a future date and time.";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate() || !userData) return;
    setSubmitting(true);

    try {
      const xpReward = DIFFICULTY_META[difficulty].xp;

      // Build mission document
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const missionData: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        xpReward,
        assignmentType,
        chapterId: userData.chapterId,
        createdBy: userData.uid,
        createdByUsername: userData.username,
        status: "active",
        createdAt: serverTimestamp(),
      };

      if (assignmentType === "specific") {
        missionData.assignedTo = selectedVolunteers.map((v) => v.uid);
      } else if (assignmentType === "team") {
        missionData.assignedTeams = selectedTeams;
      } else {
        missionData.slots = slots;
      }

      if (hasDeadline && deadlineDate && deadlineTime) {
        missionData.deadline = new Date(`${deadlineDate}T${deadlineTime}:00`);
      }

      if (submissionGuidance.trim()) {
        missionData.submissionGuidance = submissionGuidance.trim();
      }

      const missionRef = await addDoc(collection(db, "missions"), missionData);
      const missionId = missionRef.id;

      // Pre-create completions for specific and team assignments
      // Nested try/catch: if addDoc succeeded but batch fails, we show a targeted
      // message instead of letting the outer catch suggest a full retry (which
      // would create a duplicate mission document).
      let notifiedCount = 0;
      try {
        if (assignmentType === "specific") {
          notifiedCount = selectedVolunteers.length;
          const batch = writeBatch(db);
          for (const v of selectedVolunteers) {
            batch.set(doc(db, "users", v.uid, "missionCompletions", missionId), {
              missionId,
              status: "assigned",
              xpGranted: xpReward,
            });
          }
          await batch.commit();
        } else if (assignmentType === "team" && selectedTeams.length > 0) {
          // Load all chapter volunteers, then filter to those in any selected team
          // (fetching per-team and deduplicating is safer than array-contains-any limits)
          const allUsersSnap = await getDocs(
            query(
              collection(db, "users"),
              where("chapterId", "==", userData.chapterId),
              where("role", "==", "volunteer")
            )
          );
          const targetUids = new Set<string>();
          allUsersSnap.docs.forEach((d) => {
            const userTeams = (d.data().teams as string[]) ?? [];
            if (userTeams.some((t) => selectedTeams.includes(t))) {
              targetUids.add(d.id);
            }
          });
          notifiedCount = targetUids.size;
          if (targetUids.size > 0) {
            const batch = writeBatch(db);
            targetUids.forEach((uid) => {
              batch.set(doc(db, "users", uid, "missionCompletions", missionId), {
                missionId,
                status: "assigned",
                xpGranted: xpReward,
              });
            });
            await batch.commit();
          }
        }
      } catch (batchErr) {
        console.error("Assignment batch failed after mission write:", batchErr);
        setErrors({
          submit: "Mission was saved, but volunteer assignments couldn't be written. Find it in the missions list to assign manually.",
        });
        setSubmitting(false);
        return;
      }

      setSuccessInfo({ count: notifiedCount, type: assignmentType });
      setTimeout(() => router.push("/quests"), 2400);
    } catch (err) {
      console.error("Failed to create mission:", err);
      setErrors({ submit: "Something went wrong — give it another try." });
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loadingAuth) {
    return (
      <PageShell title="Create Mission" loading={true} skeleton={<AddMissionSkeleton />}>
        {null}
      </PageShell>
    );
  }

  if (!userData) return null;

  // ── Success overlay ───────────────────────────────────────────────────────
  if (successInfo !== null) {
    const sc = DIFFICULTY_META[difficulty].color;
    const msg =
      successInfo.type === "open"
        ? "Your chapter can now claim a spot."
        : successInfo.count === 0
        ? "Mission is live."
        : `${successInfo.count} volunteer${successInfo.count !== 1 ? "s" : ""} ${successInfo.count !== 1 ? "have" : "has"} been assigned.`;

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base"
        style={{ animation: "successFadeIn 0.35s ease-out forwards" }}
      >
        <style>{`
          @keyframes successFadeIn {
            from { opacity: 0; transform: scale(0.97); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes circleDraw {
            from { stroke-dashoffset: 166; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes checkDraw {
            from { stroke-dashoffset: 48; }
            to   { stroke-dashoffset: 0; }
          }
          .draw-circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            animation: circleDraw 0.55s ease-out 0.15s forwards;
          }
          .draw-check {
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: checkDraw 0.3s ease-out 0.65s forwards;
          }
        `}</style>

        <svg viewBox="0 0 52 52" className="w-20 h-20 mb-8" style={{ overflow: "visible" }}>
          <circle
            cx="26" cy="26" r="25"
            fill="none"
            stroke={sc}
            strokeWidth="1.5"
            className="draw-circle"
          />
          <path
            fill="none"
            stroke={sc}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 27l8 8 16-16"
            className="draw-check"
          />
        </svg>

        <h2 className="font-heading text-3xl text-text-primary mb-3 tracking-wide">
          Mission live.
        </h2>
        <p className="text-text-secondary text-sm text-center max-w-xs leading-relaxed">
          {msg}
        </p>
        <p className="text-text-muted text-xs mt-10">Heading to missions…</p>
      </div>
    );
  }

  const diffOptions: MissionDifficulty[] = ["easy", "medium", "hard"];
  const assignmentOptions: { key: MissionAssignmentType; label: string; desc: string }[] = [
    { key: "open", label: "Open Enrollment", desc: "Any chapter volunteer can sign up" },
    { key: "team", label: "Whole Team(s)", desc: "Goes to every member of the selected team(s)" },
    { key: "specific", label: "Specific Volunteers", desc: "You choose exactly who gets assigned" },
  ];

  const today = new Date().toISOString().slice(0, 10);

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);

  // ── Derived stripe colors ─────────────────────────────────────────────────
  const diffColor = DIFFICULTY_META[difficulty].color;
  const difficultyStripe = `linear-gradient(90deg, ${diffColor}, ${diffColor}99)`;

  const assignmentStripe = (() => {
    if (assignmentType === "team" && selectedTeams.length > 0) {
      const colors = selectedTeams.map((t) => TEAM_META[t]?.color).filter(Boolean) as string[];
      if (colors.length === 1) return `linear-gradient(90deg, ${colors[0]}, ${colors[0]}99)`;
      const stops = colors.map((c, i) => `${c} ${Math.round((i / (colors.length - 1)) * 100)}%`).join(", ");
      return `linear-gradient(90deg, ${stops})`;
    }
    return "linear-gradient(90deg, #7C3AED, #A855F7)";
  })();

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
        <div className="flex items-center gap-3">
          <Link
            href="/quests"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <IconBack />
          </Link>
          <h1 className="font-heading text-2xl text-text-primary tracking-wide">
            Create Mission
          </h1>
        </div>

        <Link href="/dashboard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Profile"
            width={36}
            height={36}
            className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors"
          />
        </Link>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 60% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)",
        }}
      >
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col pb-10">

          {/* ── Page subtitle ────────────────────────────────────────────────── */}
          <div className="animate-fade-up border-b border-border/60 pb-5 mb-6" style={{ animationDelay: "0ms" }}>
            <p className="text-text-secondary text-sm">
              Set a challenge for your chapter. Volunteers who complete it earn XP — and a real milestone on their record.
            </p>
          </div>

          {/* ── Basic info ──────────────────────────────────────────────────── */}
          <SectionCard animDelay={60} padding="p-6">
            <h2 className="font-heading text-sm text-text-primary mb-5">Mission Details</h2>

            <div className="flex flex-col gap-5">
              <div>
                <label className={LABEL_CLS}>Title *</label>
                <input
                  className={INPUT_CLS}
                  placeholder="e.g. Design social media banners for Code Camp"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((p) => ({ ...p, title: "" }));
                  }}
                />
                {errors.title && (
                  <p className="text-red-400 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className={LABEL_CLS}>Description *</label>
                <textarea
                  className={`${INPUT_CLS} resize-none`}
                  placeholder="Describe what needs to be done and any context volunteers should know."
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((p) => ({ ...p, description: "" }));
                  }}
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label className={LABEL_CLS}>Submission Guidance (optional)</label>
                <textarea
                  className={`${INPUT_CLS} resize-none`}
                  placeholder="e.g. Upload the finished files and paste a Google Drive link."
                  rows={2}
                  value={submissionGuidance}
                  onChange={(e) => setSubmissionGuidance(e.target.value)}
                />
                <p className="text-text-muted text-xs mt-1.5">
                  Volunteers see this when they submit — tell them exactly what to include.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ── Difficulty ──────────────────────────────────────────────────── */}
          <div className="mt-5">
          <SectionCard animDelay={120} stripe={difficultyStripe}>
            <h2 className="font-heading text-sm text-text-primary mb-1">Difficulty & XP</h2>
            <p className="text-text-muted text-xs mb-4">
              The harder the mission, the more XP volunteers earn.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {diffOptions.map((d) => {
                const meta = DIFFICULTY_META[d];
                const active = difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className="relative rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none"
                    style={{
                      borderColor: active ? meta.color : "#27272A",
                      backgroundColor: active ? `${meta.color}18` : "#16213e",
                    }}
                  >
                    {/* Difficulty dot */}
                    <div
                      className="w-3 h-3 rounded-full mb-3"
                      style={{ backgroundColor: meta.color }}
                    />
                    <p
                      className="font-heading text-sm font-semibold"
                      style={{ color: active ? meta.color : "#A1A1AA" }}
                    >
                      {meta.label}
                    </p>
                    <p
                      className="text-xs mt-0.5 font-sans font-semibold"
                      style={{ color: active ? meta.color : "#52525B" }}
                    >
                      +{meta.xp} XP
                    </p>
                    {active && (
                      <div
                        className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: meta.color }}
                      >
                        <IconCheck />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>
          </div>

          {/* ── Assignment ──────────────────────────────────────────────────── */}
          <div className="mt-3">
          <SectionCard animDelay={180} stripe={assignmentStripe}>
            <h2 className="font-heading text-sm text-text-primary mb-1">Assignment</h2>
            <p className="text-text-muted text-xs mb-4">
              Choose who gets the call.
            </p>

            {/* Assignment type toggle */}
            <div className="flex flex-col gap-2 mb-5">
              {assignmentOptions.map((opt) => {
                const active = assignmentType === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setAssignmentType(opt.key);
                      setErrors((p) => ({ ...p, assignees: "", team: "" }));
                    }}
                    className="flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-200"
                    style={{
                      borderColor: active ? "#A855F7" : "#27272A",
                      backgroundColor: active ? "#A855F71A" : "transparent",
                    }}
                  >
                    <div
                      className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        borderColor: active ? "#A855F7" : "#52525B",
                        backgroundColor: active ? "#A855F7" : "transparent",
                      }}
                    >
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-heading ${active ? "text-text-primary" : "text-text-secondary"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Open enrollment — slot count */}
            {assignmentType === "open" && (
              <div className="animate-fade-up" style={{ animationDuration: "180ms" }}>
                <label className={LABEL_CLS}>Available Spots</label>
                <div className="flex items-center gap-3">
                  <div
                    className="inline-flex items-center rounded-lg border border-border overflow-hidden"
                    style={{ backgroundColor: "#16213e" }}
                  >
                    <button
                      onClick={() => {
                        const next = Math.max(1, slots - 1);
                        setSlots(next);
                        setSlotsRaw(String(next));
                      }}
                      className="w-9 h-9 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors flex items-center justify-center font-sans text-lg shrink-0"
                    >
                      −
                    </button>
                    <div className="w-px self-stretch bg-border" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-14 h-9 text-center font-heading text-sm text-text-primary bg-transparent focus:outline-none"
                      value={slotsRaw}
                      onChange={(e) => {
                        setSlotsRaw(e.target.value);
                        const n = parseInt(e.target.value, 10);
                        if (!isNaN(n) && n >= 1) setSlots(n);
                      }}
                      onBlur={() => {
                        const n = parseInt(slotsRaw, 10);
                        const clamped = isNaN(n) || n < 1 ? 1 : n;
                        setSlots(clamped);
                        setSlotsRaw(String(clamped));
                      }}
                    />
                    <div className="w-px self-stretch bg-border" />
                    <button
                      onClick={() => {
                        const next = slots + 1;
                        setSlots(next);
                        setSlotsRaw(String(next));
                      }}
                      className="w-9 h-9 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors flex items-center justify-center font-sans text-lg shrink-0"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-text-muted text-xs">max volunteers</span>
                </div>
              </div>
            )}

            {/* Team selection — multi-select */}
            {assignmentType === "team" && (
              <div className="animate-fade-up" style={{ animationDuration: "180ms" }}>
                <label className={LABEL_CLS}>Select Team(s) *</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TEAM_META).map(([teamId, meta]) => {
                    const active = selectedTeams.includes(teamId);
                    return (
                      <button
                        key={teamId}
                        onClick={() => {
                          setSelectedTeams((prev) =>
                            active
                              ? prev.filter((t) => t !== teamId)
                              : [...prev, teamId]
                          );
                          setErrors((p) => ({ ...p, team: "" }));
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-heading transition-all"
                        style={{
                          borderColor: active ? meta.color : "#27272A",
                          backgroundColor: active ? `${meta.color}1A` : "transparent",
                          color: active ? meta.color : "#71717A",
                        }}
                      >
                        {active ? (
                          <span
                            className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: meta.color }}
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        ) : (
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border-2"
                            style={{ borderColor: "#52525B" }}
                          />
                        )}
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
                {selectedTeams.length > 0 && (
                  <p className="text-text-muted text-xs mt-2">
                    {selectedTeams.length === 1
                      ? "1 team selected"
                      : `${selectedTeams.length} teams selected`}
                    {" · "}
                    <button
                      onClick={() => setSelectedTeams([])}
                      className="text-accent-highlight hover:underline"
                    >
                      Clear
                    </button>
                  </p>
                )}
                {errors.team && (
                  <p className="text-red-400 text-xs mt-2">{errors.team}</p>
                )}
              </div>
            )}

            {/* Specific volunteer picker */}
            {assignmentType === "specific" && (
              <div className="animate-fade-up" style={{ animationDuration: "180ms" }}>
                <label className={LABEL_CLS}>Who gets assigned? *</label>

                {/* Selected volunteers chips */}
                {selectedVolunteers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedVolunteers.map((v) => (
                      <div
                        key={v.uid}
                        className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full border border-[#27272A] bg-[#16213e] text-xs text-text-secondary"
                      >
                        <img
                          src={buildAvatarUrl(v.username, v.avatarOptions ?? DEFAULT_AVATAR)}
                          alt={v.username}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="font-sans">{v.username}</span>
                        <button
                          onClick={() => toggleVolunteer(v)}
                          className="text-text-muted hover:text-text-primary transition-colors ml-0.5"
                        >
                          <IconX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <IconSearch />
                  </span>
                  <input
                    className={`${INPUT_CLS} pl-9`}
                    placeholder="Search by username..."
                    value={volunteerSearch}
                    onChange={(e) => setVolunteerSearch(e.target.value)}
                  />
                </div>

                {loadingVolunteers ? (
                  <div className="flex items-center gap-2 py-3">
                    {WAVE_COLORS.map((color, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: color,
                          animation: "wave-dot 0.6s ease-in-out infinite",
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : filteredVolunteers.length === 0 ? (
                  <p className="text-text-muted text-xs py-2">
                    {volunteerSearch
                      ? "No one matches that search."
                      : chapterVolunteers.length === 0
                      ? "No volunteers in your chapter yet."
                      : "Everyone's on the list."}
                  </p>
                ) : (
                  <div
                    className="flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-minimal pr-1"
                  >
                    {filteredVolunteers.map((v) => (
                      <button
                        key={v.uid}
                        onClick={() => {
                          toggleVolunteer(v);
                          setErrors((p) => ({ ...p, assignees: "" }));
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#ffffff08] transition-colors text-left"
                      >
                        <img
                          src={buildAvatarUrl(v.username, v.avatarOptions ?? DEFAULT_AVATAR)}
                          alt={v.username}
                          className="w-7 h-7 rounded-full shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary font-sans truncate">{v.username}</p>
                          {v.teams.length > 0 && (
                            <p className="text-xs text-text-muted truncate">
                              {v.teams.map((t) => TEAM_META[t]?.label ?? t).join(", ")}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {errors.assignees && (
                  <p className="text-red-400 text-xs mt-2">{errors.assignees}</p>
                )}
              </div>
            )}
          </SectionCard>
          </div>

          {/* ── Deadline ────────────────────────────────────────────────────── */}
          <div className="mt-5">
          <SectionCard animDelay={240} padding="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-heading text-sm text-text-primary">Deadline</h2>
                <p className="text-text-muted text-xs mt-0.5">Set a cutoff, or leave it open-ended.</p>
              </div>
              <button
                onClick={() => {
                  setHasDeadline((p) => !p);
                  setDeadlineDate("");
                  setDeadlineTime("23:59");
                  setErrors((p) => ({ ...p, deadline: "" }));
                }}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  hasDeadline ? "bg-accent-highlight" : "bg-[#3f3f46]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                    hasDeadline ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {hasDeadline && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Date *</label>
                    <input
                      type="date"
                      className={`${INPUT_CLS} [&::-webkit-calendar-picker-indicator]:invert`}
                      min={today}
                      value={deadlineDate}
                      onChange={(e) => {
                        setDeadlineDate(e.target.value);
                        setErrors((p) => ({ ...p, deadline: "" }));
                      }}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Time *</label>
                    <input
                      type="time"
                      className={`${INPUT_CLS} [&::-webkit-calendar-picker-indicator]:invert`}
                      value={deadlineTime}
                      onChange={(e) => {
                        setDeadlineTime(e.target.value);
                        setErrors((p) => ({ ...p, deadline: "" }));
                      }}
                    />
                  </div>
                </div>
                {errors.deadline && (
                  <p className="text-red-400 text-xs">{errors.deadline}</p>
                )}
              </div>
            )}
          </SectionCard>
          </div>

          {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
          <div className="mt-8 animate-fade-up" style={{ animationDelay: "280ms" }}>

            {/* Submit error sits directly above the button */}
            {errors.submit && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-heading text-base text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#A855F7" }}
            >
              {submitting ? "Creating…" : "Create Mission"}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

export default function AddMissionPage() {
  return <AddMissionPageInner />;
}
