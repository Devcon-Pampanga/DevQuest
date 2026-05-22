"use client";

import { useState, useMemo } from "react";
import type { EventRegistration, ReflectionRatingKey } from "@/lib/events/types";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";

const PRE_Qs: { key: ReflectionRatingKey; short: string; full: string }[] = [
  { key: "q1", short: "Role Clarity",       full: "My volunteer role(s) and responsibilities were clearly stated" },
  { key: "q2", short: "Reporting Clarity",  full: "Reporting instructions were clearly stated" },
  { key: "q3", short: "Reporting Complete", full: "Reporting instructions were complete (what to wear, time, location, access)" },
  { key: "q4", short: "Prep Readiness",     full: "I received enough materials, time, and support to adequately prepare" },
];

const DURING_Qs: { key: ReflectionRatingKey; short: string; full: string; invert: boolean }[] = [
  { key: "q5", short: "Overwhelm",      full: "I felt overwhelmed during the event",                           invert: true  },
  { key: "q6", short: "Impact",         full: "My work was essential for the success of the event",            invert: false },
  { key: "q7", short: "Time Given",     full: "I was given enough time to do tasks assigned to me",            invert: false },
  { key: "q8", short: "Access to Help", full: "I had access to help anytime I needed it to complete my tasks", invert: false },
];

const MOODS = [
  { key: "drained",   emoji: "🥱", label: "Drained",   color: "#6b7280" },
  { key: "okay",      emoji: "🙂", label: "Okay",      color: "#f59e0b" },
  { key: "good",      emoji: "😊", label: "Good",      color: "#22c55e" },
  { key: "energized", emoji: "🔥", label: "Energized", color: "#a78bfa" },
];

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function HBar({ label, counts, total }: { label: string; counts: number[]; total: number }) {
  const mx = Math.max(...counts, 1);
  return (
    <div className="bg-bg-base border border-border rounded-xl p-4 mb-3">
      <p className="font-heading text-sm text-text-primary mb-0.5">{label}</p>
      <p className="text-xs text-text-muted mb-3">{total} responses</p>
      <div className="flex flex-col gap-2">
        {counts.map((c, i) => {
          const pct = total > 0 ? Math.round((c / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-text-muted w-3 shrink-0 text-center">{i + 1}</span>
              <div className="flex-1 h-5 rounded-sm bg-border overflow-hidden">
                <div className="h-full rounded-sm bg-team-sustainability" style={{ width: `${mx > 0 ? (c / mx) * 100 : 0}%` }} />
              </div>
              <span className="text-xs text-text-secondary w-16 text-right shrink-0 tabular-nums">
                {c > 0 ? `${c} (${pct}%)` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ReflectionDataPreviewProps {
  registrations: EventRegistration[];
}

export function ReflectionDataPreview({ registrations }: ReflectionDataPreviewProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const reflectedRegs = registrations.filter((r) => r.reflectionSubmitted && r.reflectionData);

  const starCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const reg of registrations) {
      for (const uid of reg.starsGiven ?? []) {
        counts[uid] = (counts[uid] ?? 0) + 1;
      }
    }
    return counts;
  }, [registrations]);

  if (reflectedRegs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted bg-surface border border-border rounded-2xl animate-fade-in">
        <div className="text-4xl mb-3 animate-float">📋</div>
        <p className="font-heading text-base text-text-secondary mb-1">No reflections yet</p>
        <p className="text-sm">Responses will appear here once volunteers submit.</p>
      </div>
    );
  }

  const allRatingsFor = (key: ReflectionRatingKey) =>
    reflectedRegs.map((r) => r.reflectionData!.ratings[key]).filter(Boolean) as number[];

  const preKeys = PRE_Qs.map((q) => q.key);
  const duringKeys = DURING_Qs.map((q) => q.key);

  const avgPre    = avg(preKeys.flatMap(allRatingsFor));
  const avgDuring = avg(duringKeys.flatMap(allRatingsFor));

  const moodCounts: Record<string, number> = { drained: 0, okay: 0, good: 0, energized: 0 };
  reflectedRegs.forEach((r) => {
    const m = r.reflectionData!.mood;
    if (m in moodCounts) moodCounts[m]++;
  });

  const total = reflectedRegs.length;
  const positivePct = Math.round(((moodCounts.good + moodCounts.energized) / total) * 100);
  const burnout = moodCounts.drained / total >= 0.5;

  const insights = reflectedRegs
    .map((r) => r.reflectionData!.insights)
    .filter((s): s is string => !!s && s.trim().length > 0);

  const card = "bg-surface border border-border rounded-2xl p-5";
  const sectionLabel = "font-heading text-xs font-bold uppercase tracking-widest text-text-muted mb-4";

  return (
    <div className="flex flex-col gap-4">

      {/* Burnout warning */}
      {burnout && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3 animate-fade-up" style={{ animationDelay: "0ms" }}>
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="font-heading text-sm font-semibold text-red-400 mb-0.5">Burnout Warning</p>
            <p className="text-xs text-red-400/80">
              {moodCounts.drained} of {total} volunteers reported feeling drained. Consider reviewing event workload and support.
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: total,               color: "text-accent-highlight", label: "Submitted"       },
          { value: avgPre.toFixed(1),   color: "text-team-community",   label: "Avg Pre-Event"   },
          { value: avgDuring.toFixed(1),color: "text-team-learners",    label: "Avg During Event" },
          { value: `${positivePct}%`,   color: "text-team-sustainability", label: "Positive Mood" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-surface border border-border p-4 flex flex-col gap-1 animate-fade-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className={`text-3xl font-heading font-bold tabular-nums ${stat.color}`}>{stat.value}</span>
            <span className="text-xs text-text-muted">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Mood After Event */}
      <div className={`${card} animate-fade-up`} style={{ animationDelay: "80ms" }}>
        <p className={sectionLabel}>Mood After Event</p>
        <div className="grid grid-cols-4 gap-3">
          {MOODS.map((m) => {
            const count = moodCounts[m.key] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={m.key} className="flex flex-col items-center gap-1.5 bg-white/5 border border-border rounded-xl py-4">
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-base font-bold tabular-nums" style={{ color: m.color }}>{count}</span>
                <span className="text-xs text-text-muted tabular-nums">{pct}%</span>
                <span className="text-xs text-text-secondary">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pre-Event Preparation */}
      <div className={`${card} animate-fade-up`} style={{ animationDelay: "140ms" }}>
        <p className={sectionLabel}>Pre-Event Preparation</p>
        <div className="flex flex-col gap-2 mb-5">
          {PRE_Qs.map((q) => {
            const vals = allRatingsFor(q.key);
            const mean = avg(vals);
            const pct = mean / 5;
            const color = pct >= 0.8 ? "#22c55e" : pct >= 0.6 ? "#f59e0b" : pct > 0 ? "#f87171" : "#2e2a42";
            return (
              <div key={q.key} className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-32 shrink-0 truncate">{q.short}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, background: color }} />
                </div>
                <span className="text-sm font-bold w-8 text-right shrink-0 tabular-nums" style={{ color }}>
                  {mean > 0 ? mean.toFixed(1) : "—"}
                </span>
              </div>
            );
          })}
        </div>
        {PRE_Qs.map((q) => {
          const vals = allRatingsFor(q.key);
          return <HBar key={q.key} label={q.full} counts={[1, 2, 3, 4, 5].map((s) => vals.filter((v) => v === s).length)} total={vals.length} />;
        })}
      </div>

      {/* During the Event */}
      <div className={`${card} animate-fade-up`} style={{ animationDelay: "200ms" }}>
        <p className={sectionLabel}>During the Event</p>
        <div className="flex flex-col gap-2 mb-5">
          {DURING_Qs.map((q) => {
            const vals = allRatingsFor(q.key);
            const mean = avg(vals);
            const score = q.invert ? (mean > 0 ? ((5 - mean) / 4) * 100 : 0) : (mean / 5) * 100;
            const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : score > 0 ? "#f87171" : "#2e2a42";
            return (
              <div key={q.key} className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-32 shrink-0 truncate">{q.short}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
                </div>
                <span className="text-sm font-bold w-8 text-right shrink-0 tabular-nums" style={{ color }}>
                  {mean > 0 ? mean.toFixed(1) : "—"}
                </span>
              </div>
            );
          })}
        </div>
        {DURING_Qs.map((q) => {
          const vals = allRatingsFor(q.key);
          return <HBar key={q.key} label={q.full} counts={[1, 2, 3, 4, 5].map((s) => vals.filter((v) => v === s).length)} total={vals.length} />;
        })}
      </div>

      {/* Volunteer Insights */}
      {insights.length > 0 && (
        <div className={`${card} animate-fade-up`} style={{ animationDelay: "250ms" }}>
          <p className={sectionLabel}>Volunteer Insights</p>
          <div className="flex flex-col gap-2">
            {insights.map((text, i) => (
              <div key={i} className="bg-white/5 border border-border rounded-xl px-4 py-3">
                <p className="text-sm text-text-primary leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Responses */}
      <div className={`${card} animate-fade-up`} style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-text-muted">Individual Responses</p>
          <span className="text-xs text-text-muted font-mono tabular-nums">{total} entries</span>
        </div>
        <div className="divide-y divide-border -mx-5 -mb-5">
          {reflectedRegs.map((reg) => {
            const rd = reg.reflectionData!;
            const mood = MOODS.find((m) => m.key === rd.mood) ?? MOODS[1];
            const name = rd.firstName && rd.lastName
              ? `${rd.firstName} ${rd.lastName}`
              : (reg.username ?? reg.userId);
            const role = rd.rolePosition || reg.role;
            const isOpen = expandedRow === reg.userId;

            return (
              <div key={reg.userId}>
                <button
                  type="button"
                  onClick={() => setExpandedRow(isOpen ? null : reg.userId)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildAvatarUrl(reg.username ?? reg.userId, reg.avatarOptions ?? DEFAULT_AVATAR)}
                    alt={name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-lg shrink-0 border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading text-sm text-text-primary truncate">{name}</p>
                      {(starCounts[reg.userId] ?? 0) > 0 && (
                        <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-medium tabular-nums">
                          ⭐ {starCounts[reg.userId]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="text-xs text-text-muted">{role}</span>
                      {rd.chapterId && (
                        <span className="text-xs text-accent-highlight">· {rd.chapterId}</span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    {[...PRE_Qs, ...DURING_Qs].slice(0, 4).map((q) => {
                      const v = rd.ratings[q.key];
                      const bg = v >= 4 ? "#22c55e22" : v <= 2 ? "#f8717122" : "#f59e0b22";
                      const cl = v >= 4 ? "#22c55e" : v <= 2 ? "#f87171" : "#f59e0b";
                      return (
                        <div key={q.key} className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold tabular-nums" style={{ background: bg, color: cl }}>
                          {v ?? "-"}
                        </div>
                      );
                    })}
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="text-text-muted shrink-0 transition-transform duration-300"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && (
                  <div
                    className="border-t border-border bg-white/5 px-5 py-4 flex flex-col gap-4 animate-fade-up"
                    style={{ animationDuration: "220ms" }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="font-heading text-xs font-bold uppercase tracking-widest text-accent-highlight mb-3">Pre-Event</p>
                        {PRE_Qs.map((q) => (
                          <div key={q.key} className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-text-secondary flex-1 truncate">{q.short}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold tabular-nums transition-colors duration-150"
                                  style={{ background: rd.ratings[q.key] === n ? "#7c5cf4" : "transparent", border: `1px solid ${rd.ratings[q.key] === n ? "#7c5cf4" : "#2e2a42"}`, color: rd.ratings[q.key] === n ? "#fff" : "#7b76a0" }}>
                                  {n}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="font-heading text-xs font-bold uppercase tracking-widest text-team-community mb-3">During Event</p>
                        {DURING_Qs.map((q) => (
                          <div key={q.key} className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-text-secondary flex-1 truncate">{q.short}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold tabular-nums transition-colors duration-150"
                                  style={{ background: rd.ratings[q.key] === n ? "#06b6d4" : "transparent", border: `1px solid ${rd.ratings[q.key] === n ? "#06b6d4" : "#2e2a42"}`, color: rd.ratings[q.key] === n ? "#fff" : "#7b76a0" }}>
                                  {n}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {rd.insights && (
                      <div>
                        <p className="font-heading text-xs font-bold uppercase tracking-widest text-accent-highlight mb-2">Insights</p>
                        <p className="text-sm text-text-primary leading-relaxed bg-surface border border-border rounded-xl px-4 py-3">{rd.insights}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="font-heading text-xs font-bold uppercase tracking-widest text-accent-highlight">Mood:</p>
                      <span>{mood.emoji}</span>
                      <span className="text-sm font-semibold" style={{ color: mood.color }}>{mood.label}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
