# CLAUDE.md — DevQuest

This file gives Claude the context needed to assist with the DevQuest codebase effectively. Read this before making any changes.

---

## What Is DevQuest

DevQuest is an open-source career progression platform for DEVCON Kids student volunteers. It transforms volunteer work into verifiable professional milestones through structured quest lines, role-weighted XP, coordinator-verified attendance, post-event reflections, and exportable portfolios.

**Tagline:** Turn your volunteer work into your career.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Fonts | Agrandir Bold (headings), DM Sans (body/UI) |
| Auth | Firebase Authentication |
| Database | Firestore |
| Storage | Firebase Storage (avatars) |
| Hosting | Vercel |
| QR Generation | `qrcode.react` |
| QR Scanning | `react-qr-reader` or ZXing |
| PDF Export | `jsPDF` + `html2canvas` |
| State | React Context + `useReducer` |

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Sign-in, Sign-up (no sidebar)
│   ├── (onboarding)/           # Onboarding (no sidebar)
│   └── (dashboard)/            # All authenticated pages (with sidebar)
│       ├── dashboard/
│       ├── quests/
│       ├── events/
│       │   ├── [eventId]/
│       │   │   └── reflect/    # Reflection form
│       │   └── new/            # Add event (coordinator only)
│       ├── chapter/
│       ├── market/
│       ├── profile/
│       ├── notifications/
│       └── settings/
├── components/
│   ├── ui/                     # Reusable primitives (Button, Card, Input, Badge, etc.)
│   ├── layout/                 # Sidebar, TopBar, BottomNav
│   ├── quests/                 # QuestCard, QuestPath, ApprovalsQueue
│   ├── events/                 # EventCard, RoleSelector, QRCodeCard, VolunteersTab
│   ├── dashboard/              # HeroCard, XPProgressBar, ReflectionNudge
│   ├── profile/                # MilestoneLadder, ActivityFeed, PortfolioPreview
│   └── chapter/                # Leaderboard, VolunteerTable, StatsRow
├── lib/
│   ├── firebase.ts             # Firebase app initialization
│   ├── firestore.ts            # Firestore helper functions
│   └── xp.ts                  # XP grant logic and constants
├── hooks/                      # useAuth, useUser, useQuests, useEvents
├── context/                    # AuthContext, UserContext
├── types/                      # TypeScript interfaces for all data models
└── utils/                      # QR generation, PDF export, date helpers
```

---

## User Roles

There are two roles: `volunteer` (default) and `coordinator`.

Role is assigned at registration by checking the user's email against a Firestore `coordinator_whitelist` collection. Coordinators have all volunteer capabilities plus: adding events, confirming attendance via QR scan, approving quest completions, and accessing volunteer management.

**Never trust the client for role checks.** Always validate role server-side or via Firestore security rules before performing coordinator actions.

---

## Authentication & Guards

- Unauthenticated users → redirect to `/`
- Authenticated users with `onboardingComplete: false` → redirect to `/onboarding`
- `/onboarding` is inaccessible once `onboardingComplete: true`
- `/events/new` and coordinator UI elements → hidden/disabled if `role !== "coordinator"`
- `/events/[eventId]/reflect` → only accessible if: attended = true, reflectionSubmitted = false, and now < reflectionDeadline
- `/profile/[username]` → fully public, no auth required

---

## Design System

### Colors (use as Tailwind CSS variables or inline)

```
bg-base:          #0a0a0f   — page background
bg-surface:       #1a1a2e   — cards, panels
bg-elevated:      #16213e   — modals, elevated surfaces
accent-primary:   #7C3AED   — primary actions
accent-highlight: #A855F7   — CTAs, hover
border:           #27272A   — card borders
text-primary:     #FFFFFF
text-secondary:   #A1A1AA
text-muted:       #52525B
```

### Team Colors
```
Lead Learners:         #F5C518  (yellow)
People & Culture:      #F97316  (orange)
Community Engagement:  #06B6D4  (cyan)
Creatives:             #9333EA  (purple)
Sustainability:        #22C55E  (green)
```

Team colors are used on: card left borders, progress bar fills, chip backgrounds, badge rings, section headers, and stat numbers. Use them aggressively — the UI should feel colorful, not just dark.

### Typography
- **Agrandir Bold** — all headings (H1, H2, display text, section headers)
- **DM Sans** — body copy, labels, buttons, input text, numbers

### Component Conventions
- Cards: `rounded-2xl`, `bg-surface`, `border border-[#27272A]`
- Buttons: primary = `bg-[#A855F7]` · secondary = ghost with purple border
- Progress bars: 8px height, `rounded-full`, team color fill
- Badges: circular, team color ring when earned, grayscale + lock when locked
- Inputs: `bg-surface`, `rounded-lg`, purple focus ring

---

## Key Data Models

### User (`users/{uid}`)
```typescript
interface User {
  uid: string;
  email: string;
  role: 'volunteer' | 'coordinator';
  username: string;
  contactNumber: string;
  linkedinUrl?: string;
  githubUrl?: string;
  chapterId: string;
  teams: string[];           // e.g. ['lead_learners', 'creatives']
  xp: number;                // global cumulative XP — never resets
  onboardingComplete: boolean;
  createdAt: Timestamp;
}
```

### Team Progress (`users/{uid}/teamProgress/{teamId}`)
```typescript
interface TeamProgress {
  teamId: string;
  currentTier: 'team_member' | 'associate' | 'specialist' | 'lead';
}
```

### XP Transaction Log (`users/{uid}/xpLog/{logId}`)
```typescript
interface XPLog {
  logId: string;
  source: 'event_attendance' | 'quest_completion' | 'reflection' | 'profile_setup' | 'tier_bonus';
  sourceId: string;          // eventId / questId / reflectionId
  description: string;       // e.g. "Attended Code Camp as Facilitator"
  xp: number;
  createdAt: Timestamp;
}
```

### Event (`events/{eventId}`)
```typescript
interface Event {
  eventId: string;
  name: string;
  description: string;
  date: Timestamp;
  location: string;
  chapterId: string;
  createdBy: string;
  eventType?: string;        // e.g. "Code Camp", "Lead Learner Workshop" — used for qr_scan quest triggers
  roles: { roleName: string; slots: number; xpReward: number }[];
  createdAt: Timestamp;
}
```

### Event Registration (`events/{eventId}/registrations/{uid}`)
```typescript
interface Registration {
  userId: string;
  role: string;
  roleXP: number;
  qrData: string;
  attended: boolean;
  reflectionSubmitted: boolean;
  reflectionDeadline?: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
}
```

### Quest (`quests/{questId}`) — stored in Firestore, seeded from `lib/seed/quests.ts`
```typescript
interface Quest {
  questId: string;
  teamId: string;
  tier: 'associate' | 'specialist' | 'lead';  // team_member tier has 0 quests; volunteers start at associate
  name: string;
  description: string;
  xpReward: number;
  completionMethod: 'qr_scan' | 'coordinator_approval' | 'self_mark';
  approvalType?: 'standard' | 'major';        // coordinator_approval quests only
  triggerEventType?: string;                  // qr_scan: event type required (e.g. "Code Camp")
  triggerRole?: string;                       // qr_scan: role keyword, case-insensitive substring match
}
```

Quest definitions live in **Firestore** (`quests/{questId}`) so coordinators can add/edit milestones
without code changes. The seed file (`lib/seed/quests.ts`) is the source of truth for one-time
population — re-seed via `GET /api/seed-quests` in development whenever the seed changes.

**26 quests total** across 5 teams (no `team_member` tier quests):
- Lead Learners: 3 associate · 2 specialist · 3 lead
- People & Culture: 1 associate · 1 specialist · 3 lead
- Creatives: 1 associate · 1 specialist · 2 lead
- Sustainability: 1 associate · 1 specialist · 2 lead
- Community Engagement: 1 associate · 2 specialist · 2 lead

### Quest Completion (`users/{uid}/questCompletions/{questId}`)
```typescript
interface QuestCompletion {
  questId: string;
  status: 'in_progress' | 'pending_approval' | 'completed';
  submissionNotes?: string;
  evidenceUrl?: string;
  approvedBy?: string;
  completedAt?: Timestamp;
  xpGranted: number;
}
```

### Reflection (`users/{uid}/reflections/{reflectionId}`)
```typescript
interface Reflection {
  reflectionId: string;
  eventId: string;
  eventName: string;
  role: string;
  whatDidYouDo: string;
  wentWell: string;
  doDifferently: string;
  energyLevel: 'drained' | 'okay' | 'good' | 'energized';
  xpGranted: number;         // always 25
  submittedAt: Timestamp;
}
```

### Notification (`users/{uid}/notifications/{notifId}`)
```typescript
interface Notification {
  notifId: string;
  type: 'quest_approved' | 'quest_revision' | 'attendance_confirmed' | 'reflection_due' | 'tier_promoted' | 'new_event';
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: Timestamp;
}
```

---

## XP System

XP and team tier progression are **fully independent systems.**

- **XP** is a global cumulative number. It feeds the leaderboard, market, and portfolio. It never resets.
- **Team tier** advances only when all required quests for a tier are completed — not by reaching an XP threshold.

### XP Grant Rules

**Event attendance (role-weighted):**
| Role | XP |
|---|---|
| Documentation | +30 |
| Usher | +30 |
| Registration | +30 |
| Tech | +40 |
| Host | +50 |
| Facilitator | +60 |
| Custom roles (default) | +40 |

**Other sources:**
| Action | XP |
|---|---|
| Profile setup | +10 |
| Quest self-mark | +20 |
| Quest coordinator-approved (standard) | +75 |
| Quest coordinator-approved (major) | +150 |
| Reflection submitted | +25 |
| Tier promotion bonus | +100 |

Every XP grant must be written to `users/{uid}/xpLog` in addition to incrementing `users/{uid}.xp`.

---

## QR Code System

QR codes are generated when a volunteer joins an event. The coordinator scans them to confirm attendance.

**QR data string format:**
```
devquest://attendance?eventId={eventId}&userId={uid}&role={role}
```

On scan:
1. Parse the string, extract `eventId`, `userId`, `role`
2. Validate the registration exists in Firestore
3. Update `registrations/{uid}.attended = true`
4. Grant role-weighted XP + log transaction
5. Set `reflectionDeadline = now + 72 hours`
6. Auto-complete any quest linked to this attendance
7. Write notification to volunteer

---

## Reflection System

- Triggered when coordinator confirms a volunteer's attendance
- Available for 72 hours after the event date
- One reflection per volunteer per event — cannot be resubmitted
- Grants +25 XP on submission (no approval needed)
- After 5 submitted reflections → unlock "Reflective Contributor" badge
- Coordinators see **anonymous aggregate** energy responses per event — never individual responses
- If 50%+ of responses are "Drained" → show burnout warning flag on event

---

## Volunteer Teams & Tiers

All teams follow: **Team Member → Associate → Specialist → Lead**

> **Note:** The `team_member` tier has **0 quests**. It is the entry state after onboarding — volunteers
> begin their milestone progression at the `associate` tier. Tier advancement is purely quest-driven
> (not XP-threshold-based): all quests in a tier must be completed before the next tier unlocks.

| Team | Lead Title | Color |
|---|---|---|
| Lead Learners | Certified Lead Learner | `#F5C518` |
| Creatives | Creative Director | `#9333EA` |
| People & Culture | P&C Lead | `#F97316` |
| Community Engagement | CE Lead | `#06B6D4` |
| Sustainability | Sustainability Lead | `#22C55E` |

Quest definitions are stored in **Firestore** (`quests/{questId}`) and seeded from `lib/seed/quests.ts`.
Re-seed in development via `GET /api/seed-quests` whenever the seed file changes.

**qr_scan quest trigger system:** Quests with `completionMethod: "qr_scan"` auto-complete when a
coordinator confirms a volunteer's attendance, but only if:
1. The event's `eventType` matches the quest's `triggerEventType` (exact string match), AND
2. The volunteer's role contains the quest's `triggerRole` as a substring (case-insensitive), if set.

Sequential qr_scan quests at the same tier with the same trigger (e.g., Facilitate Code Camp #1
then #2 for Lead Learners) complete **one at a time** — only the first incomplete match per
attendance confirmation resolves.

---

## Pages Reference

| Route | Page | Access |
|---|---|---|
| `/` | Sign-in | Public |
| `/register` | Sign-up | Public |
| `/onboarding` | Profile setup | Auth, first-time |
| `/dashboard` | Dashboard | Auth |
| `/quests` | Quest map | Auth |
| `/events` | Events list | Auth |
| `/events/[eventId]` | Event details | Auth |
| `/events/new` | Add event | Coordinator only |
| `/events/[eventId]/reflect` | Reflection form | Auth + attended |
| `/chapter` | Chapter dashboard | Auth |
| `/market` | Market (WIP) | Auth |
| `/profile` | Own profile | Auth |
| `/profile/[username]` | Public portfolio | Public |
| `/notifications` | Notifications | Auth |
| `/settings` | Settings | Auth |

---

## Important Conventions

- **Never use `<form>` HTML elements.** Use controlled inputs with `onChange` / `onClick` handlers.
- **Never store role in localStorage or client state alone.** Always read from Firestore.
- **Always log XP transactions** to `xpLog` — never just increment the total without a log entry.
- **Coordinator-only UI** must be conditionally rendered, not just hidden with CSS.
- **Reflection page** must validate all three conditions server-side before rendering: attended, not yet submitted, within deadline.
- **Public portfolio page** (`/profile/[username]`) must never expose contact number or email — only username, chapter, team, tier, milestones, badges, and impact numbers.
- When adding new pages, update this file and the project context document (`DevQuest_Project_Context.md`).

---

## Design Context

### Users

Filipino student volunteers (ages ~16–22) in the DEVCON Kids program. Two roles: volunteers and coordinators. Often on mobile, between school and volunteer commitments. This is frequently their first structured career-building experience.

**The job to be done:** Transform "I helped run an event" into a verifiable, exportable career milestone — something credible enough to share with a recruiter.

### Brand Personality

**Bold · Playful · Energetic.** DevQuest feels like a coach genuinely excited about your progress — not a corporate HR system logging hours. Celebratory and forward-moving.

### Emotional Goal

**Proud of their progress.** The UI constantly reflects how far volunteers have come — XP history, tier badges, milestone counts front and center. Progress is never invisible; every interaction reinforces that effort is real, tracked, and valued.

### Aesthetic Direction

Dark-only. Purple-dominant (#7C3AED / #A855F7) with team colors as first-class identity markers. The dark base (#0a0a0f) is the stage; team colors and accent purples are the lights. Closer to a polished indie game dashboard than a career tool — RPG character sheet meets professional portfolio.

**Anti-reference:** Generic SaaS / corporate (Jira, Linear, Google Workspace). No cold blues, no sterile white space, no enterprise-dashboard energy. If it could belong to a B2B productivity startup, it's wrong.

**Accessibility:** Standard contrast, keyboard nav, semantic HTML. No formal WCAG compliance requirement.

### Design Principles

1. **Progress is always visible.** XP, tier, quest completion, milestone count — never bury these. A volunteer should feel their effort reflected back on every page.

2. **Team identity shapes the interface.** Team colors (#F5C518 learners · #F97316 culture · #06B6D4 community · #9333EA creatives · #22C55E sustainability) should appear on all team-contextual content. Never render cards in neutral gray when team context is available.

3. **Bold over subtle.** Stronger color, heavier type, larger numbers. Quiet designs read as low-effort here. When in doubt, push further.

4. **Gamified but credible.** XP, tier badges, and quest completions are real professional milestones — treat them with visual weight, not novelty. The gamification should feel earned.

5. **No corporate sterility.** Every component needs at least one moment of personality — a team color, a glowing border, a bold stat. If a section looks like it belongs in a business dashboard, it needs more.