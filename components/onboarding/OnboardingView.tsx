"use client";

import { CHAPTERS, TEAM_INFO, TEAMS } from "@/lib/onboardingConstants";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import {
  LinkedInIcon,
  GitHubIcon,
  ChevronDownIcon,
  InfoIcon,
  CloseIcon,
  ChevronRightSmIcon,
  TEAM_ICONS,
} from "./OnboardingIcons";

const labelCls =
  "block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2";
const inputCls =
  "w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary text-sm font-sans placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow";

export function OnboardingView() {
  const {
    showOnboarding,
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
  } = useOnboardingForm();

  if (!showOnboarding) return null;

  return (
    <>
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-14"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 30% 20%, rgba(124,58,237,0.22) 0%, transparent 60%)",
          backgroundColor: "#0a0a0f",
        }}
      >
        <div className="w-full max-w-sm">
          <h1 className="font-heading text-3xl text-text-primary mb-2">
            Complete Your Profile
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Enter your details to finish setting up your DevQuest account.
          </p>

          {/* Full Name */}
          <div className="mb-4">
            <label className={labelCls}>Full Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              className={inputCls}
            />
          </div>

          {/* Contact Number */}
          <div className="mb-4">
            <label className={labelCls}>Contact Number</label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(formatContactNumber(e.target.value))}
              onFocus={() => {
                if (!contactNumber.startsWith("+63")) {
                  setContactNumber(contactNumber.trim() ? formatContactNumber(contactNumber) : CONTACT_PREFIX);
                }
              }}
              placeholder="+63 900 000 0000"
              className={inputCls}
            />
          </div>

          {/* LinkedIn URL */}
          <div className="mb-4">
            <label className={labelCls}>
              LinkedIn URL{" "}
              <span className="normal-case tracking-normal text-text-muted">(optional)</span>
            </label>
            <div className="flex rounded-lg overflow-hidden border border-border focus-within:ring-2 focus-within:ring-accent-highlight transition-shadow">
              <div className="w-1 bg-[#0A66C2] flex-shrink-0" />
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <LinkedInIcon />
                </div>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/yourname"
                  className="w-full bg-surface pl-10 pr-4 py-3 text-text-primary text-sm font-sans placeholder:text-text-muted focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* GitHub URL */}
          <div className="mb-4">
            <label className={labelCls}>
              GitHub URL{" "}
              <span className="normal-case tracking-normal text-text-muted">(optional)</span>
            </label>
            <div className="flex rounded-lg overflow-hidden border border-border focus-within:ring-2 focus-within:ring-[#341539] transition-shadow">
              <div className="w-1 bg-[#341539] flex-shrink-0" />
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <GitHubIcon />
                </div>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="github.com/yourusername"
                  className="w-full bg-surface pl-10 pr-4 py-3 text-text-primary text-sm font-sans placeholder:text-text-muted focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* DEVCON Kids Chapter */}
          <div className="mb-6">
            <label className={labelCls}>DEVCON Kids Chapter</label>
            <div className="relative">
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 pr-10 text-text-primary text-sm font-sans appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow"
              >
                <option value="" disabled className="bg-[#1a1a2e]">
                  Select your chapter
                </option>
                {CHAPTERS.map((c) => (
                  <option key={c} value={c} className="bg-[#1a1a2e]">
                    {c}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          {/* Volunteer Teams */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-sans uppercase tracking-widest text-text-secondary">
                Volunteer Team(s)
              </span>
              <button
                onClick={() => setShowTeamInfo(true)}
                className="text-text-muted hover:text-accent-highlight transition-colors"
                aria-label="Learn about volunteer teams"
              >
                <InfoIcon />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEAMS.map((team) => {
                const isSelected = selectedTeams.includes(team.id);
                const Icon = TEAM_ICONS[team.id];
                return (
                  <button
                    key={team.id}
                    onClick={() => toggleTeam(team.id)}
                    className={
                      isSelected
                        ? "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans border-2 transition-all"
                        : "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans border border-border bg-surface text-text-secondary hover:border-text-muted transition-all"
                    }
                    style={
                      isSelected
                        ? {
                            borderColor: team.color,
                            backgroundColor: `${team.color}18`,
                            color: team.color,
                          }
                        : undefined
                    }
                  >
                    {Icon && <Icon />}
                    {team.name}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-accent-highlight hover:bg-accent-primary text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Let's Go"}
          </button>

          {/* Team color dots */}
          <div className="flex justify-center gap-2 mt-10">
            {TEAMS.map((team, i) => (
              <div
                key={team.id}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: team.color,
                  ...(loading && {
                    animation: "wave-dot 0.6s ease-in-out infinite",
                    animationDelay: `${i * 0.1}s`,
                  }),
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Team Info Dialog */}
      {showTeamInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTeamInfo(false)}
          />

          <div className="relative border border-border rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl" style={{ backgroundColor: "#1a1625" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-heading text-lg text-text-primary">
                Volunteer Teams
              </h2>
              <button
                onClick={() => setShowTeamInfo(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-minimal px-6 py-5 space-y-4">
              {TEAM_INFO.map((team) => {
                const Icon = TEAM_ICONS[team.id];
                return (
                  <div
                    key={team.id}
                    className="rounded-xl border border-border overflow-hidden"
                    style={{ backgroundColor: "#1e1a2e" }}
                  >
                    <div className="h-[3px]" style={{ backgroundColor: team.color }} />

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: team.color }}>
                          {Icon && <Icon />}
                        </span>
                        <span
                          className="font-heading text-sm"
                          style={{ color: team.color }}
                        >
                          {team.name}
                        </span>
                      </div>

                      <p className="text-text-secondary text-xs mb-4 leading-relaxed">
                        {team.description}
                      </p>

                      <p className="text-[10px] font-sans uppercase tracking-widest text-text-muted mb-2">
                        Path Progression
                      </p>

                      <div className="flex flex-wrap items-center gap-1">
                        {team.tiers.map((tier, i) => {
                          const isLast = i === team.tiers.length - 1;
                          return (
                            <div key={tier} className="flex items-center gap-1">
                              <span
                                className={
                                  isLast
                                    ? "px-2 py-1 rounded-md text-[10px] font-sans border"
                                    : "px-2 py-1 rounded-md text-[10px] font-sans border border-border text-text-secondary"
                                }
                                style={
                                  isLast
                                    ? {
                                        borderColor: `${team.color}55`,
                                        backgroundColor: `${team.color}18`,
                                        color: team.color,
                                      }
                                    : { backgroundColor: "#252038" }
                                }
                              >
                                {tier}
                              </span>
                              {!isLast && (
                                <span className="text-text-muted flex-shrink-0">
                                  <ChevronRightSmIcon />
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
