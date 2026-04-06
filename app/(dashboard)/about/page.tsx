"use client";

import { useState } from "react";
import { CaretDown, GithubLogo, GitFork, Bug, BookOpen, LinkedinLogo } from "@phosphor-icons/react";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { useAuth } from "@/context/AuthContext";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import PageShell from "@/components/layout/PageShell";
import { FormSectionCard } from "@/components/forms/FormSectionCard";
import { AboutSkeleton } from "@/components/about/AboutSkeleton";

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How do I earn XP?",
    a: "XP is awarded automatically from five sources: attending an event (role-weighted: +30 to +60 XP), completing a quest (+20 self-mark / +75 coordinator-approved / +150 major milestone), completing a subquest (+25 easy / +75 medium / +150 hard), submitting a post-event reflection (+25), and completing onboarding (+10, one time). A +100 XP bonus is also granted each time you advance to a new tier.",
  },
  {
    q: "How do I earn DevCoins?",
    a: "DevCoins are earned automatically alongside every XP grant at a rate of 1 DevCoin per 10 XP (rounded down). You don't need to do anything extra — if you earned XP, you earned DevCoins.",
  },
  {
    q: "What's the difference between XP and DevCoins?",
    a: "XP is your cumulative progress score — it feeds your level, leaderboard rank, and public portfolio, and never resets. DevCoins are a spendable currency you redeem in the market for DEVCON Kids merchandise. Spending DevCoins does not reduce your XP.",
  },
  {
    q: "What's the difference between quests and subquests?",
    a: "Quests are the fixed milestone ladder for your volunteer team — pre-defined by DEVCON Kids and seeded into the platform. Completing them in order is how you advance your tier (e.g., Associate → Specialist). Subquests are ad hoc tasks created by coordinators for specific needs — a project, an event, a one-off assignment. They don't affect your tier but reward XP and DevCoins.",
  },
  {
    q: "How do tiers work? What does XP have to do with it?",
    a: "Tier progression and XP are fully independent systems. Your tier in a team advances only when you complete all the required quests for that tier — having a high XP total does not unlock the next tier. Think of XP as a measure of activity and tiers as credentials.",
  },
  {
    q: "Can I be on more than one team?",
    a: "Yes. You can enroll in multiple teams during onboarding. Each team has its own independent tier ladder — your progress in Lead Learners and your progress in Creatives are tracked separately.",
  },
  {
    q: "How does QR attendance work?",
    a: "When you register for an event, a personal QR code is generated for you. On the day of the event, show your QR code (visible on the Event Details page) to a coordinator. They scan it using the in-app scanner, which confirms your attendance, grants your role-weighted XP and DevCoins, and opens your 72-hour reflection window.",
  },
  {
    q: "When does the reflection form appear?",
    a: "After a coordinator confirms your attendance, the reflection form becomes available on the Event Details page. You have 72 hours from the moment attendance is confirmed to submit it. After that, the form locks permanently — one reflection per event, no extensions.",
  },
];

// ─── Credits data ─────────────────────────────────────────────────────────────

const CREDITS = [
  { name: "Joaquin Galang", role: "Lead Developer", linkedin: "https://linkedin.com/in/joaquin-galang/", github: "https://github.com/joaquingalang" },
  { name: "Russel Jan Patio", role: "Lead Designer", linkedin: "https://linkedin.com/in/rjpatio/", github: "https://github.com/iampatchyyyy" },
  { name: "Kiel Abien David", role: "Developer", linkedin: "https://linkedin.com/in/kiel-abien-david-1b8393385/", github: "https://github.com/abi-cache" },
  { name: "Eiwelle Aldreign Magtoto", role: "Developer", linkedin: null, github: "https://github.com/reignnn08" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left text-sm text-text-primary hover:text-accent-highlight transition-colors"
      >
        <span>{q}</span>
        <CaretDown
          size={16}
          weight="bold"
          className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-text-secondary leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const { ready } = useRequireDashboardAuth();
  const { user: sessionUser, status } = useAuth();
  const authLoading = status === "loading" || !ready;

  const avatarUrl = sessionUser
    ? buildAvatarUrl(
        sessionUser.username ?? "user",
        sessionUser.avatarOptions ?? DEFAULT_AVATAR
      )
    : undefined;

  return (
    <PageShell
      title="About"
      avatarUrl={avatarUrl}
      loading={authLoading}
      skeleton={<AboutSkeleton />}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-5 pb-10">

          {/* What is DevQuest */}
          <FormSectionCard animDelay={0} stripe="#7C3AED">
            <h2 className="font-heading text-base text-text-primary">What is DevQuest?</h2>
            <p className="text-sm text-text-secondary leading-relaxed mt-3">
              DevQuest is an open-source career progression platform built for{" "}
              <span className="text-text-primary">DEVCON Kids</span> student volunteers.
              It transforms volunteer work into verifiable professional milestones —
              through structured quest lines, role-weighted XP, coordinator-verified
              attendance, post-event reflections, and exportable portfolios.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mt-3">
              Whether you&apos;re just starting out or a seasoned organizer, DevQuest
              gives you a clear picture of how far you&apos;ve come and where you&apos;re headed.
            </p>
          </FormSectionCard>

          {/* FAQ */}
          <FormSectionCard
            animDelay={60}
            stripe="#F5C518"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base text-text-primary">Frequently Asked Questions</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-highlight font-sans font-medium uppercase tracking-wide">
                For Volunteers
              </span>
            </div>
            <div className="mt-3">
              {FAQS.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </FormSectionCard>

          {/* Contributing */}
          <FormSectionCard
            animDelay={120}
            stripe="#22C55E"
          >
            <h2 className="font-heading text-base text-text-primary">Contributing</h2>
            <p className="text-sm text-text-secondary leading-relaxed mt-3">
              DevQuest is open source. Contributions are welcome — whether it&apos;s
              fixing a bug, improving the docs, or building a new feature.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <a
                href="https://github.com/Devcon-Pampanga/DevQuest"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-highlight transition-colors"
              >
                <GithubLogo size={16} weight="fill" />
                View on GitHub
              </a>
              <a
                href="https://github.com/Devcon-Pampanga/DevQuest/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-highlight transition-colors"
              >
                <GitFork size={16} weight="bold" />
                Fork the repo
              </a>
              <a
                href="https://github.com/Devcon-Pampanga/DevQuest/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-highlight transition-colors"
              >
                <Bug size={16} weight="bold" />
                Report an issue
              </a>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-border">
              <pre className="text-xs text-text-muted font-mono leading-relaxed whitespace-pre"><span className="text-accent-highlight"># Quick start</span>{`\ngit clone https://github.com/Devcon-Pampanga/DevQuest\ncd DevQuest\nnpm install\nnpm run dev`}</pre>
            </div>
            <p className="mt-3 text-xs text-text-muted">
              Please read{" "}
              <a
                href="https://github.com/Devcon-Pampanga/DevQuest/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-highlight hover:underline inline-flex items-center gap-1"
              >
                <BookOpen size={12} weight="bold" />
                CONTRIBUTING.md
              </a>{" "}
              before submitting a pull request.
            </p>
          </FormSectionCard>

          {/* Credits */}
          <FormSectionCard
            animDelay={180}
            stripe="#F97316"
          >
            <h2 className="font-heading text-base text-text-primary">Credits</h2>
            <p className="text-sm text-text-secondary mt-3 mb-4">
              Built with care by the DEVCON Kids community.
            </p>
            <div className="space-y-3">
              {CREDITS.map(({ name, role, linkedin, github }) => (
                <div key={name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">{name}</p>
                    <p className="text-xs text-text-muted">{role}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {linkedin && (
                      <a
                        href={linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                        aria-label={`${name} on LinkedIn`}
                      >
                        <LinkedinLogo size={16} weight="fill" />
                      </a>
                    )}
                    {github && (
                      <a
                        href={github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                        aria-label={`${name} on GitHub`}
                      >
                        <GithubLogo size={16} weight="fill" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-text-muted border-t border-border pt-4">
              DevQuest v1.0 &middot; MIT License &middot; Made for DEVCON Kids
            </p>
          </FormSectionCard>

        </div>
      </div>
    </PageShell>
  );
}
