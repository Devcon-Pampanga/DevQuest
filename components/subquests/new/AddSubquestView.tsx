"use client";

import Link from "next/link";
import { FormSectionCard } from "@/components/forms/FormSectionCard";
import { IconBack, IconCheck } from "@/components/forms/FormIcons";
import { INPUT_CLS, LABEL_CLS } from "@/lib/formFieldClasses";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import { TEAM_META } from "@/lib/seed/quests";
import type { ChapterSessionUser } from "@/types/chapter";
import { DIFFICULTY_META, type SubquestAssignmentType, type SubquestDifficulty } from "@/types/subquest";
import { SubquestSuccessOverlay } from "./SubquestSuccessOverlay";
import { VolunteerPicker } from "./VolunteerPicker";
import { useAddSubquestForm } from "@/hooks/useAddSubquestForm";

export function AddSubquestView({ userData }: { userData: ChapterSessionUser }) {
  const {
    title, setTitle,
    description, setDescription,
    difficulty, setDifficulty,
    assignmentType, setAssignmentType,
    slots, setSlots,
    slotsRaw, setSlotsRaw,
    selectedTeams, setSelectedTeams,
    selectedVolunteers,
    volunteerSearch, setVolunteerSearch,
    hasDeadline, setHasDeadline,
    deadlineDate, setDeadlineDate,
    deadlineTime, setDeadlineTime,
    submissionGuidance, setSubmissionGuidance,
    errors, setErrors,
    submitting,
    successInfo,
    toggleVolunteer,
    loadingVolunteers,
    filteredVolunteers,
    chapterVolunteers,
    handleSubmit,
  } = useAddSubquestForm({ userData });

  if (successInfo !== null) {
    return <SubquestSuccessOverlay difficulty={difficulty} successInfo={successInfo} />;
  }

  const diffOptions: SubquestDifficulty[] = ["easy", "medium", "hard"];
  const assignmentOptions: { key: SubquestAssignmentType; label: string; desc: string }[] = [
    { key: "open", label: "Open Enrollment", desc: "Any chapter volunteer can sign up" },
    { key: "team", label: "Whole Team(s)", desc: "Goes to every member of the selected team(s)" },
    { key: "specific", label: "Specific Volunteers", desc: "You choose exactly who gets assigned" },
  ];

  const today = new Date().toISOString().slice(0, 10);

  const avatarUrl = buildAvatarUrl(userData.username, userData.avatarOptions ?? DEFAULT_AVATAR);

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
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
        <div className="flex items-center gap-3">
          <Link
            href="/quests"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <IconBack />
          </Link>
          <h1 className="font-heading text-2xl text-text-primary tracking-wide">Create Subquest</h1>
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

      <div
        className="flex-1 overflow-y-auto p-6"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 60% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)",
        }}
      >
        <div className="max-w-2xl mx-auto flex flex-col pb-10">
          <div
            className="animate-fade-up border-b border-border/60 pb-5 mb-6"
            style={{ animationDelay: "0ms" }}
          >
            <p className="text-text-secondary text-sm">
              Set a challenge for your chapter. Volunteers who complete it earn XP — and a real milestone on
              their record.
            </p>
          </div>

          <FormSectionCard animDelay={60} padding="p-6">
            <h2 className="font-heading text-sm text-text-primary mb-5">Subquest Details</h2>

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
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
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
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
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
          </FormSectionCard>

          <div className="mt-5">
            <FormSectionCard animDelay={120} stripe={difficultyStripe}>
              <h2 className="font-heading text-sm text-text-primary mb-1">Difficulty & XP</h2>
              <p className="text-text-muted text-xs mb-4">The harder the subquest, the more XP volunteers earn.</p>

              <div className="grid grid-cols-3 gap-3">
                {diffOptions.map((d) => {
                  const meta = DIFFICULTY_META[d];
                  const active = difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className="relative rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none"
                      style={{
                        borderColor: active ? meta.color : "#27272A",
                        backgroundColor: active ? `${meta.color}18` : "#16213e",
                      }}
                    >
                      <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: meta.color }} />
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
            </FormSectionCard>
          </div>

          <div className="mt-3">
            <FormSectionCard animDelay={180} stripe={assignmentStripe}>
              <h2 className="font-heading text-sm text-text-primary mb-1">Assignment</h2>
              <p className="text-text-muted text-xs mb-4">Choose who gets the call.</p>

              <div className="flex flex-col gap-2 mb-5">
                {assignmentOptions.map((opt) => {
                  const active = assignmentType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
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

              {assignmentType === "open" && (
                <div className="animate-fade-up" style={{ animationDuration: "180ms" }}>
                  <label className={LABEL_CLS}>Available Spots</label>
                  <div className="flex items-center gap-3">
                    <div
                      className="inline-flex items-center rounded-lg border border-border overflow-hidden"
                      style={{ backgroundColor: "#16213e" }}
                    >
                      <button
                        type="button"
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
                        type="button"
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

              {assignmentType === "team" && (
                <div className="animate-fade-up" style={{ animationDuration: "180ms" }}>
                  <label className={LABEL_CLS}>Select Team(s) *</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(TEAM_META).map(([teamId, meta]) => {
                      const active = selectedTeams.includes(teamId);
                      return (
                        <button
                          key={teamId}
                          type="button"
                          onClick={() => {
                            setSelectedTeams((prev) =>
                              active ? prev.filter((t) => t !== teamId) : [...prev, teamId]
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
                              <svg
                                width="9"
                                height="9"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full shrink-0 border-2" style={{ borderColor: "#52525B" }} />
                          )}
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTeams.length > 0 && (
                    <p className="text-text-muted text-xs mt-2">
                      {selectedTeams.length === 1 ? "1 team selected" : `${selectedTeams.length} teams selected`}
                      {" · "}
                      <button
                        type="button"
                        onClick={() => setSelectedTeams([])}
                        className="text-accent-highlight hover:underline"
                      >
                        Clear
                      </button>
                    </p>
                  )}
                  {errors.team && <p className="text-red-400 text-xs mt-2">{errors.team}</p>}
                </div>
              )}

              {assignmentType === "specific" && (
                <VolunteerPicker
                  selectedVolunteers={selectedVolunteers}
                  toggleVolunteer={toggleVolunteer}
                  volunteerSearch={volunteerSearch}
                  setVolunteerSearch={setVolunteerSearch}
                  loadingVolunteers={loadingVolunteers}
                  filteredVolunteers={filteredVolunteers}
                  chapterVolunteers={chapterVolunteers}
                  error={errors.assignees}
                  setErrors={setErrors}
                />
              )}
            </FormSectionCard>
          </div>

          <div className="mt-5">
            <FormSectionCard animDelay={240} padding="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-heading text-sm text-text-primary">Deadline</h2>
                  <p className="text-text-muted text-xs mt-0.5">Set a cutoff, or leave it open-ended.</p>
                </div>
                <button
                  type="button"
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
                  {errors.deadline && <p className="text-red-400 text-xs">{errors.deadline}</p>}
                </div>
              )}
            </FormSectionCard>
          </div>

          <div className="mt-8 animate-fade-up" style={{ animationDelay: "280ms" }}>
            {errors.submit && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-heading text-base text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#A855F7" }}
            >
              {submitting ? "Creating…" : "Create Subquest"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
