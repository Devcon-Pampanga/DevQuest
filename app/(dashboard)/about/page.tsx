"use client";

import { useState } from "react";
import { CaretDown, GithubLogo, GitFork, Bug, BookOpen } from "@phosphor-icons/react";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { useAuth } from "@/context/AuthContext";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import PageShell from "@/components/layout/PageShell";
import { FormSectionCard } from "@/components/forms/FormSectionCard";
import { AboutSkeleton } from "@/components/about/AboutSkeleton";

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Who can use DevQuest?",
    a: "DevQuest is built for DEVCON Kids student volunteers. If you've volunteered at a DEVCON Kids event, you can create an account and start tracking your journey.",
  },
  {
    q: "How do I earn XP?",
    a: "You earn XP by attending events (verified via QR check-in), submitting reflections, completing subquests, and finishing quest milestones. Each action has a defined XP reward logged to your profile.",
  },
  {
    q: "What are Quests and Subquests?",
    a: "Quests are structured learning paths tied to each volunteer team. Each quest is made up of subquests — specific tasks or contributions you complete to progress through a team's tier system.",
  },
  {
    q: "How does QR attendance work?",
    a: "Coordinators display a QR code at each event. Scanning it with DevQuest's scanner logs your attendance and awards XP — no manual entry needed.",
  },
  {
    q: "Can I be on multiple teams?",
    a: "Yes. You can join and be active on multiple volunteer teams simultaneously. Your progress on each team is tracked independently.",
  },
  {
    q: "What is a coordinator?",
    a: "Coordinators are verified organizers who manage events, approve subquest submissions, and verify reflections. They have additional tools accessible through the same interface.",
  },
  {
    q: "Is my data private?",
    a: "Your profile is private by default. You can share a public portfolio link manually. DevQuest uses Firebase — your data is stored securely and never sold.",
  },
];

// ─── Credits data ─────────────────────────────────────────────────────────────

const CREDITS = [
  { name: "Joaquin Galang", role: "Lead Developer", github: "https://github.com/joaquingalang" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-lg text-text-primary mb-1">{children}</h2>
  );
}

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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* What is DevQuest */}
        <FormSectionCard animDelay={0}>
          <SectionHeading>What is DevQuest?</SectionHeading>
          <p className="text-sm text-text-secondary leading-relaxed mt-2">
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
          stripe="linear-gradient(90deg, #2563eb, #7c3aed)"
        >
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          <div className="mt-2">
            {FAQS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </FormSectionCard>

        {/* Contributing */}
        <FormSectionCard
          animDelay={120}
          stripe="linear-gradient(90deg, #059669, #0891b2)"
        >
          <SectionHeading>Contributing</SectionHeading>
          <p className="text-sm text-text-secondary leading-relaxed mt-2">
            DevQuest is open source. Contributions are welcome — whether it&apos;s
            fixing a bug, improving the docs, or building a new feature.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href="https://github.com/devconkids/devquest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-highlight transition-colors"
            >
              <GithubLogo size={16} weight="fill" />
              View on GitHub
            </a>
            <a
              href="https://github.com/devconkids/devquest/fork"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-highlight transition-colors"
            >
              <GitFork size={16} weight="bold" />
              Fork the repo
            </a>
            <a
              href="https://github.com/devconkids/devquest/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-highlight transition-colors"
            >
              <Bug size={16} weight="bold" />
              Report an issue
            </a>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-border">
            <p className="text-xs text-text-muted font-mono leading-relaxed">
              <span className="text-accent-highlight"># Quick start</span>{"\n"}
              git clone https://github.com/devconkids/devquest{"\n"}
              cd devquest{"\n"}
              npm install{"\n"}
              npm run dev
            </p>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Please read{" "}
            <a
              href="https://github.com/devconkids/devquest/blob/main/CONTRIBUTING.md"
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
          stripe="linear-gradient(90deg, #d97706, #dc2626)"
        >
          <SectionHeading>Credits</SectionHeading>
          <p className="text-sm text-text-secondary mt-2 mb-4">
            Built with care by the DEVCON Kids community.
          </p>
          <div className="space-y-3">
            {CREDITS.map(({ name, role, github }) => (
              <div key={name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">{name}</p>
                  <p className="text-xs text-text-muted">{role}</p>
                </div>
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
            ))}
          </div>
          <p className="mt-6 text-xs text-text-muted border-t border-border pt-4">
            DevQuest v1.0 &middot; MIT License &middot; Made for DEVCON Kids
          </p>
        </FormSectionCard>
      </div>
    </PageShell>
  );
}
