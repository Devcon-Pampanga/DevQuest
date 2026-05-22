"use client";

import { useState } from "react";
import type { AvatarOptions } from "@/lib/avatar";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";

export interface ReflectionEntry {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  eventId: string;
  eventName: string;
  chapter: string;
  rolePosition: string;
  ratings: Record<string, number>;
  mood: string;
  insights: string;
  submittedAt?: { toDate: () => Date };
  avatarOptions?: AvatarOptions;
}

interface EventSummary {
  eventId: string;
  name: string;
}

const MOODS = [
  { key: "drained",   emoji: "🥱", label: "Drained",   color: "#6b7280" },
  { key: "okay",      emoji: "🙂", label: "Okay",      color: "#f59e0b" },
  { key: "good",      emoji: "😊", label: "Good",      color: "#22c55e" },
  { key: "energized", emoji: "🔥", label: "Energized", color: "#a78bfa" },
];

const PRE_Qs = [
  { key: "q1", short: "Role Clarity",       full: "My Volunteer Role/s and Responsibility/ies were clearly stated" },
  { key: "q2", short: "Reporting Clarity",  full: "Reporting instructions were clearly stated" },
  { key: "q3", short: "Reporting Complete", full: "Reporting instructions were complete (what to wear, time, location, access to location)" },
  { key: "q4", short: "Prep Readiness",     full: "I received enough materials, time, and support to adequately prepare for my role" },
];

const DURING_Qs = [
  { key: "q5", short: "Overwhelm",      full: "I felt overwhelmed",                                                invert: true  },
  { key: "q6", short: "Impact",         full: "I felt my work was essential for the success of the event",         invert: false },
  { key: "q7", short: "Time Given",     full: "I was given enough time to do tasks assigned to me",                invert: false },
  { key: "q8", short: "Access to Help", full: "I had access to help anytime I needed it to complete my tasks",     invert: false },
];

const avg = (v: number[]) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
const rFor = (key: string, data: ReflectionEntry[]) =>
  data.map((r) => r.ratings?.[key]).filter((v): v is number => typeof v === "number" && v >= 1 && v <= 5);

// ─── Donut KPI ────────────────────────────────────────────────────────────────

function Donut({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const size = 80;
  const r = 32, c = 2 * Math.PI * r, pct = max > 0 ? value / max : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2e2a42" strokeWidth="8" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${pct * c} ${(1 - pct) * c}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold leading-none" style={{ color }}>
            {max === 100 ? `${Math.round(value)}%` : value.toFixed(1)}
          </span>
          {max !== 100 && <span className="text-[10px] text-text-muted leading-none mt-0.5">/ 5</span>}
        </div>
      </div>
      <p className="text-xs text-text-secondary text-center leading-snug max-w-[84px]">{label}</p>
    </div>
  );
}

// ─── Horizontal Bar ────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

interface EventsDataDashboardProps {
  reflections: ReflectionEntry[];
  events: EventSummary[];
}

export function EventsDataDashboard({ reflections, events }: EventsDataDashboardProps) {
  const [filterEvent, setFilterEvent] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = filterEvent === "all" ? reflections : reflections.filter((r) => r.eventId === filterEvent);
  const total = filtered.length;

  const roleClarity   = avg(rFor("q1", filtered));
  const prepReadiness = avg(rFor("q4", filtered));
  const accessHelp    = avg(rFor("q8", filtered));
  const overwhelm     = avg(rFor("q5", filtered));
  const notOverwhelm  = overwhelm > 0 ? Math.round(((5 - overwhelm) / 4) * 100) : 0;

  const moodCounts: Record<string, number> = { drained: 0, okay: 0, good: 0, energized: 0 };
  filtered.forEach((r) => { if (r.mood in moodCounts) moodCounts[r.mood]++; });

  const card = "bg-surface border border-border rounded-2xl p-5";
  const sectionLabel = "font-heading text-xs font-bold uppercase tracking-widest text-text-muted mb-4";

  return (
    <div className="flex flex-col gap-4">

      {/* Event filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="text-sm bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          style={{ colorScheme: "dark" }}
        >
          <option value="all">All Events ({reflections.length} responses)</option>
          {events.map((e) => {
            const count = reflections.filter((r) => r.eventId === e.eventId).length;
            return (
              <option key={e.eventId} value={e.eventId}>
                {e.name} ({count})
              </option>
            );
          })}
        </select>
        <span className="text-sm font-mono text-accent-highlight bg-accent-primary/10 border border-accent-primary/20 px-3 py-1.5 rounded-lg tabular-nums">
          {total} response{total !== 1 ? "s" : ""}
        </span>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted bg-surface border border-border rounded-2xl">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-heading text-base text-text-secondary mb-1">No reflections yet</p>
          <p className="text-sm text-text-muted">Responses will appear here once volunteers submit.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className={card}>
            <p className={sectionLabel}>Key Performance Indicators</p>
            <div className="grid grid-cols-4 gap-4">
              <Donut value={roleClarity}   max={5}   label="Role Clarity"    color="#7c5cf4" />
              <Donut value={prepReadiness} max={5}   label="Prep Readiness"  color="#22c55e" />
              <Donut value={accessHelp}    max={5}   label="Access to Help"  color="#06b6d4" />
              <Donut value={notOverwhelm}  max={100} label="Not Overwhelmed" color="#f59e0b" />
            </div>
          </div>

          {/* Pre-Event Preparation */}
          <div className={card}>
            <p className={sectionLabel}>Pre-Event Preparation</p>
            <div className="flex flex-col gap-2 mb-5">
              {PRE_Qs.map((q) => {
                const vals = rFor(q.key, filtered);
                const mean = avg(vals);
                const pct = mean / 5;
                const color = pct >= 0.8 ? "#22c55e" : pct >= 0.6 ? "#f59e0b" : pct > 0 ? "#f87171" : "#2e2a42";
                return (
                  <div key={q.key} className="flex items-center gap-3">
                    <span className="text-xs text-text-muted w-32 shrink-0 truncate">{q.short}</span>
                    <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, background: color }} />
                    </div>
                    <span className="text-sm font-bold w-8 text-right shrink-0 tabular-nums" style={{ color }}>
                      {mean > 0 ? mean.toFixed(1) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            {PRE_Qs.map((q) => {
              const vals = rFor(q.key, filtered);
              return <HBar key={q.key} label={q.full} counts={[1, 2, 3, 4, 5].map((s) => vals.filter((v) => v === s).length)} total={vals.length} />;
            })}
          </div>

          {/* On-Site Experience */}
          <div className={card}>
            <p className={sectionLabel}>On-Site Experience</p>
            <div className="flex flex-col gap-2 mb-5">
              {DURING_Qs.map((q) => {
                const vals = rFor(q.key, filtered);
                const mean = avg(vals);
                const score = q.invert ? (mean > 0 ? ((5 - mean) / 4) * 100 : 0) : (mean / 5) * 100;
                const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : score > 0 ? "#f87171" : "#2e2a42";
                return (
                  <div key={q.key} className="flex items-center gap-3">
                    <span className="text-xs text-text-muted w-32 shrink-0 truncate">{q.short}</span>
                    <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
                    </div>
                    <span className="text-sm font-bold w-8 text-right shrink-0 tabular-nums" style={{ color }}>
                      {mean > 0 ? mean.toFixed(1) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            {DURING_Qs.map((q) => {
              const vals = rFor(q.key, filtered);
              return <HBar key={q.key} label={q.full} counts={[1, 2, 3, 4, 5].map((s) => vals.filter((v) => v === s).length)} total={vals.length} />;
            })}
          </div>

          {/* Mood After Event */}
          <div className={card}>
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

          {/* Latest Insights */}
          <div className={card}>
            <p className={sectionLabel}>Latest Insights &amp; Suggestions</p>
            <div className="flex flex-col gap-2">
              {filtered.filter((r) => r.insights?.trim()).slice(0, 3).map((r, i) => {
                const name = r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.username;
                return (
                  <div key={i} className="bg-white/5 border border-border rounded-xl px-4 py-3">
                    <p className="text-sm text-text-primary leading-relaxed line-clamp-2">{r.insights}</p>
                    <p className="text-xs text-text-muted mt-2">— {name} · {r.chapter}</p>
                  </div>
                );
              })}
              {filtered.filter((r) => r.insights?.trim()).length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">No insights yet.</p>
              )}
            </div>
          </div>

          {/* Individual Responses */}
          <div className={card}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-text-muted">Individual Responses</p>
              <span className="text-xs text-text-muted font-mono tabular-nums">{total} entries</span>
            </div>
            <div className="divide-y divide-border -mx-5 -mb-5">
              {filtered.map((ref, idx) => {
                const mood = MOODS.find((m) => m.key === ref.mood) ?? MOODS[1];
                const key = `${ref.userId}-${idx}`;
                const isOpen = expandedRow === key;
                const name = ref.firstName && ref.lastName ? `${ref.firstName} ${ref.lastName}` : ref.username;
                return (
                  <div key={key}>
                    <button
                      type="button"
                      onClick={() => setExpandedRow(isOpen ? null : key)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buildAvatarUrl(ref.username, ref.avatarOptions ?? DEFAULT_AVATAR)}
                        alt={name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-lg shrink-0 border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-sm text-text-primary truncate">{name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-xs text-text-muted">{ref.rolePosition}</span>
                          <span className="text-xs text-accent-highlight">· {ref.chapter}</span>
                          <span className="text-xs text-text-muted">· {ref.eventName}</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        {[...PRE_Qs, ...DURING_Qs].slice(0, 4).map((q) => {
                          const v = ref.ratings[q.key];
                          const bg = v >= 4 ? "#22c55e22" : v <= 2 ? "#f8717122" : "#f59e0b22";
                          const cl = v >= 4 ? "#22c55e" : v <= 2 ? "#f87171" : "#f59e0b";
                          return (
                            <div key={q.key} className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold tabular-nums" style={{ background: bg, color: cl }}>
                              {v ?? "-"}
                            </div>
                          );
                        })}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0 transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border bg-white/5 px-5 py-4 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="font-heading text-xs font-bold uppercase tracking-widest text-accent-highlight mb-3">Pre-Event</p>
                            {PRE_Qs.map((q) => (
                              <div key={q.key} className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-text-secondary flex-1 truncate">{q.short}</span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <div key={n} className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold tabular-nums"
                                      style={{ background: ref.ratings[q.key] === n ? "#7c5cf4" : "transparent", border: `1px solid ${ref.ratings[q.key] === n ? "#7c5cf4" : "#2e2a42"}`, color: ref.ratings[q.key] === n ? "#fff" : "#7b76a0" }}>
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
                                    <div key={n} className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold tabular-nums"
                                      style={{ background: ref.ratings[q.key] === n ? "#06b6d4" : "transparent", border: `1px solid ${ref.ratings[q.key] === n ? "#06b6d4" : "#2e2a42"}`, color: ref.ratings[q.key] === n ? "#fff" : "#7b76a0" }}>
                                      {n}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {ref.insights && (
                          <div>
                            <p className="font-heading text-xs font-bold uppercase tracking-widest text-accent-highlight mb-2">Insights</p>
                            <p className="text-sm text-text-primary leading-relaxed bg-surface border border-border rounded-xl px-4 py-3">{ref.insights}</p>
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
        </>
      )}
    </div>
  );
}
