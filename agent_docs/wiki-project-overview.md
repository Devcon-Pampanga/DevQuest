# DevQuest — Project Context Document

**Version:** 4.0
**Last Updated:** April 2026
**Track:** Cabalen Connect — DevCon Pampanga Hackathon

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Roles](#2-user-roles)
3. [Design System](#3-design-system)
4. [Volunteer Teams & Milestones](#4-volunteer-teams--milestones)
5. [Quest Verification System](#5-quest-verification-system)
6. [XP & Progression System](#6-xp--progression-system)
7. [DevCoins & Marketplace](#7-devcoins--marketplace)
8. [Subquests System](#8-subquests-system)
9. [Reflection Form System](#9-reflection-form-system)
10. [Page Inventory & Content](#10-page-inventory--content)
11. [User Flow Diagrams](#11-user-flow-diagrams)
12. [Key Interactions & Logic](#12-key-interactions--logic)
13. [Data Models](#13-data-models)
14. [Tech Stack](#14-tech-stack)

---

## 1. Project Overview

**Product Name:** DevQuest
**Tagline:** Turn your volunteer work into your career.
**One-liner:** DevQuest is an open-source career progression platform that transforms DEVCON Kids volunteer work into verifiable professional milestones through structured quest lines, tracked contributions, and exportable portfolios.

### Problem Statement

DEVCON Kids Pampanga student volunteers face high churn and a confidence gap — without a structured way to track their contributions or connect their work to real career credentials, high-potential local talent burns out and walks away with nothing to show for it.

### Solution

DevQuest maps every volunteer contribution to a real DEVCON Kids career milestone through structured Quest Lines, coordinator-verified attendance, role-weighted XP, post-event reflections, coordinator-assigned subquests, and an exportable professional portfolio. Volunteers also earn DevCoins — a redeemable currency that lets their effort translate into tangible rewards from the DEVCON Kids merch market.

---

## 2. User Roles

### Volunteer

- Default role for all registered users
- Can join events, complete quests, submit reflections, earn XP and DevCoins, and export their portfolio
- Cannot add events, confirm attendance, or approve quests

### Coordinator

- Assigned by email whitelist (checked at registration)
- Has all volunteer capabilities PLUS:
  - Add / manage events
  - Confirm volunteer attendance via QR scan
  - Approve quest and subquest completions
  - Create and assign subquests to volunteers
  - Access volunteer management on the Chapter Page
  - View aggregate reflection energy reports per event

---

## 3. Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| bg-base | #0a0a0f | App background |
| bg-surface | #1a1a2e | Cards, panels |
| bg-elevated | #16213e | Elevated surfaces, modals |
| accent-primary | #7C3AED | Primary actions, active states |
| accent-highlight | #A855F7 | CTAs, hover states |
| accent-yellow | #F5C518 | Lead Learners team, XP numbers |
| accent-orange | #F97316 | People & Culture team, warnings |
| accent-green | #22C55E | Community Engagement team, success states |
| accent-purple | #9333EA | Creatives team, badges |
| accent-cyan | #06B6D4 | Sustainability team |
| text-primary | #FFFFFF | Headings, primary text |
| text-secondary | #A1A1AA | Subtext, labels |
| text-muted | #52525B | Disabled, locked states |
| border | #27272A | Card borders, dividers |

### Team Color Map

| Volunteer Team | Color Token | Hex |
|---|---|---|
| Lead Learners | `accent-yellow` | `#F5C518` |
| People & Culture | `accent-orange` | `#F97316` |
| Community Engagement | `accent-green` | `#22C55E` |
| Creatives | `accent-purple` | `#9333EA` |
| Sustainability | `accent-cyan` | `#06B6D4` |

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Hero | Agrandir | Bold | 32–48px |
| Headings (H1) | Agrandir | Bold | 24–28px |
| Headings (H2) | Agrandir | Bold | 18–22px |
| Body | DM Sans | 400 | 14–16px |
| Labels / Caps | DM Sans | 600 | 11–12px |
| XP Numbers | DM Sans | 700 | 24–32px |
| Buttons | DM Sans | 600 | 14–16px |

### Spacing Scale
`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px`

### Border Radius
- Cards: `rounded-2xl` (16px)
- Buttons: `rounded-xl` (12px)
- Chips / Tags: `rounded-full`
- Input fields: `rounded-lg` (8px)

### Component Tokens

**Cards:**
- Background: `bg-surface`
- Border: `1px solid border`
- Hover: subtle inner glow `box-shadow: inset 0 0 0 1px accent-primary`

**Buttons:**
- Primary: `bg-accent-highlight`, white text, `rounded-xl`
- Secondary: `bg-transparent`, `border accent-primary`, `accent-highlight` text
- Destructive: `bg-red-900/30`, `border red-500`, red text
- Disabled: `bg-muted`, `text-muted`, `cursor-not-allowed`

**Progress Bars:**
- Track background: `bg-elevated`
- Fill: team color (per volunteer's primary team)
- Height: 8px, `rounded-full`

**Badges:**
- Earned: colored ring (team color) + colored icon, full opacity
- Locked: grayscale + lock icon overlay
- Shape: circular, 48×48px standard

**Bottom Navigation (Mobile):**
- Background: `bg-elevated` with top border
- Active icon: `accent-highlight` fill
- Scan button (center): elevated, `bg-accent-primary` gradient, larger tap target

### Elevation & Shadows
- Level 1 (cards): `shadow-md` with purple tint
- Level 2 (modals): `shadow-xl` with `bg-black/50` backdrop
- Glow (active/featured): `0 0 20px rgba(168, 85, 247, 0.3)`

---

## 4. Volunteer Teams & Milestones

All five volunteer teams follow the same four-tier progression:
**Team Member → Associate → Specialist → Team Lead**

Milestones within each tier are the quests a volunteer must complete before being promoted to the next tier. **Team progression is independent from XP** — advancing tiers requires completing specific quests, not reaching an XP threshold.

> ⚠️ **Note:** Lead Learners milestones are sourced from official DEVCON Kids documentation. Milestones for the remaining four teams are proposed and should be reviewed and approved by a DEVCON Kids coordinator before being seeded into the database.

---

### 📚 Lead Learners
*The largest volunteer team — deliver the learning experiences central to the program.*
**Team color:** `#F5C518` (Yellow)

| Tier | Quest | Verification Type |
|---|---|---|
| **Associate** | Attend a Lead Learner Workshop (both days) | QR Scan |
| **Associate** | Train for a code camp specialization | QR Scan |
| **Associate** | Complete a Lead Learner Candidate Application Form | Self-mark |
| **Specialist** | Facilitate 2 code camps for your specialization | QR Scan × 2 |
| **Certified Lead Learner** | Assist as Assistant LL in 2 code camps | QR Scan × 2 |
| **Certified Lead Learner** | Complete a 15-min live teaching demo (co-teach with DEVCON Kids officers in audience) | Coordinator Approval |
| **Certified Lead Learner** | Be assessed via the Lead Learner Certification Rubric and reflect on scores with DEVCON Kids officers | Coordinator Approval |

---

### 🎨 Creatives
*Produce artwork and design assets to support DEVCON Kids events.*
**Team color:** `#9333EA` (Purple)

| Tier | Quest | Verification Type |
|---|---|---|
| **Associate** | Attend a Creatives onboarding session | QR Scan |
| **Associate** | Submit 1 completed design asset for a DEVCON Kids event | Coordinator Approval |
| **Associate** | Complete a Creatives Candidate Application Form | Self-mark |
| **Specialist** | Deliver all required design assets for 2 full events | Coordinator Approval |
| **Specialist** | Receive a design feedback review from the Creative Director | Coordinator Approval |
| **Creative Director** | Lead the visual identity for 1 full event season | Coordinator Approval |
| **Creative Director** | Onboard and mentor a new Creatives Associate | Coordinator Approval |
| **Creative Director** | Present a portfolio of contributions to DEVCON Kids officers | Coordinator Approval |

---

### 🤝 People & Culture
*Recruit volunteers and keep volunteer engagement high.*
**Team color:** `#F97316` (Orange)

| Tier | Quest | Verification Type |
|---|---|---|
| **Associate** | Attend a People & Culture onboarding session | QR Scan |
| **Associate** | Assist in 1 volunteer recruitment drive | QR Scan |
| **Associate** | Complete a P&C Candidate Application Form | Self-mark |
| **Specialist** | Lead a volunteer recruitment drive for 1 event | Coordinator Approval |
| **Specialist** | Conduct 2 volunteer check-ins or engagement activities | Coordinator Approval |
| **Specialist** | Submit a brief outcomes report for an engagement activity | Coordinator Approval |
| **P&C Lead** | Design and run a volunteer engagement initiative for 1 full season | Coordinator Approval |
| **P&C Lead** | Manage onboarding for at least 3 new volunteers | Coordinator Approval |
| **P&C Lead** | Present engagement metrics to DEVCON Kids officers | Coordinator Approval |

---

### 🌐 Community Engagement
*Build relationships, partnerships, and synergies with other organizations.*
**Team color:** `#22C55E` (Green)

| Tier | Quest | Verification Type |
|---|---|---|
| **Representative Associate** | Attend a Community Engagement onboarding session | QR Scan |
| **Representative Associate** | Represent DEVCON Kids at 1 external event or meeting | Coordinator Approval |
| **Representative Associate** | Complete a CE Candidate Application Form | Self-mark |
| **Ambassador Specialist** | Represent DEVCON Kids at 2 external events | Coordinator Approval |
| **Ambassador Specialist** | Initiate or support 1 partnership or collaboration | Coordinator Approval |
| **Ambassador Specialist** | Submit a partnership outreach report | Coordinator Approval |
| **CE Lead** | Own and close 1 formal partnership or MOU | Coordinator Approval |
| **CE Lead** | Lead the CE team for 1 full event season | Coordinator Approval |
| **CE Lead** | Present partnership outcomes to DEVCON Kids officers | Coordinator Approval |

---

### ⚙️ Sustainability
*Work towards critical resource management and financial sustainability.*
**Team color:** `#06B6D4` (Cyan)

| Tier | Quest | Verification Type |
|---|---|---|
| **Sustainability Associate** | Attend a Sustainability onboarding session | QR Scan |
| **Sustainability Associate** | Assist in logistics and resource management for 1 event | QR Scan |
| **Sustainability Associate** | Complete a Sustainability Candidate Application Form | Self-mark |
| **Sustainability Specialist** | Manage logistics and resource tracking for 2 events | Coordinator Approval |
| **Sustainability Specialist** | Submit a post-event resource utilization report | Coordinator Approval |
| **Sustainability Lead** | Own financial and resource planning for 1 full event season | Coordinator Approval |
| **Sustainability Lead** | Identify and implement 1 cost-saving or process improvement | Coordinator Approval |
| **Sustainability Lead** | Present a sustainability report to DEVCON Kids officers | Coordinator Approval |

---

## 5. Quest Verification System

There are three types of quest completion. Each quest is assigned exactly one type.

### Type 1 — QR Scan (Attendance-based)
**Used for:** Onboarding sessions, event participation, code camp facilitation, external representation

**Flow:**
1. Volunteer registers for the event in DevQuest and selects their role
2. A unique QR code is generated and stored in Firestore for that volunteer + event
3. On the day, the coordinator scans the volunteer's QR code using the in-app scanner
4. Attendance confirmed → linked quest auto-completes (matched by event type + volunteer role) → XP and DevCoins granted

### Type 2 — Coordinator Approval (Submission-based)
**Used for:** Reports, portfolio reviews, teaching demos, rubric assessments, design deliverables, presentations, mentoring verification

**Flow:**
1. Volunteer completes the real-world task
2. Volunteer opens the quest card and taps "Submit for Approval"
3. Optional: volunteer attaches a Google Drive link, notes, or evidence
4. Quest status changes to "Pending Approval"
5. Coordinator reviews in the Approvals Queue:
   - **Approve** → XP and DevCoins granted, quest marked Completed ✓, volunteer notified
   - **Request Revision** → volunteer notified with revision note, quest returns to In Progress

### Type 3 — Self-mark (Acknowledgment-based)
**Used for:** Application form completion, reading guides, profile setup

**Flow:**
1. Volunteer completes the task
2. Volunteer taps "Mark Complete" on the quest card
3. Quest immediately marked Completed → XP and DevCoins granted (lower amount, unverified)

---

## 6. XP & Progression System

XP and team tier progression are two **fully independent systems.**

### Global XP
XP is a single cumulative number representing everything a volunteer has contributed — across all teams, all events, all quests, and all subquests. It feeds the leaderboard, DevCoin balance, and the portfolio's total XP display. It never resets (leaderboards are season-scoped, XP is not).

### XP Levels
Every 500 XP = 1 level. This is a display value shown on the dashboard and public portfolio.

| XP Range | Level |
|---|---|
| 0 – 499 | Level 1 |
| 500 – 999 | Level 2 |
| 1000 – 1499 | Level 3 |
| … | … |

### Team Tier Progression
Tier advancement (Team Member → Associate → Specialist → Team Lead) is determined **entirely by quest completion**, not by XP thresholds. A volunteer can have high XP but remain an Associate if they haven't finished the required quests. Tier is a credential; XP is a measure of activity.

---

### XP Grant Rules

**Event Attendance — Role-weighted:**

| Role | XP Granted |
|---|---|
| Documentation | +30 |
| Usher | +30 |
| Registration | +30 |
| Tech | +40 |
| Host | +50 |
| Facilitator | +60 |

Facilitation and hosting carry the most responsibility and preparation, so they reward the most XP. New roles added by coordinators default to +40 XP until manually configured.

**Quest Completion:**

| Quest Type | XP Granted |
|---|---|
| Self-mark (e.g., application form) | +20 |
| Coordinator-approved (standard) | +75 |
| Coordinator-approved (major milestone, e.g., teaching demo, portfolio presentation) | +150 |

**Subquest Completion:**

| Subquest Difficulty | XP Granted |
|---|---|
| Easy | +25 |
| Medium | +75 |
| Hard | +150 |

**Other Actions:**

| Action | XP Granted |
|---|---|
| Profile setup complete | +10 |
| Post-event reflection submitted | +25 |
| Tier promotion bonus | +100 |

---

### Dashboard Display

The hero section on the Dashboard shows the volunteer's profile, XP, tier, and quest progress across all enrolled teams.

```
┌──────────────────────────────────────────────────────┐
│  [Avatar]  @username                                  │
│  Lead Learners — Associate  |  Total XP: 650  Lv.2   │
│  DevCoins: 65 🪙                                       │
│                                                      │
│  [Events Attended]  [Badges Earned]  [Stars Received]│
│                                                      │
│  MILESTONES                                          │
│  Lead Learners: ████████░░░░  2 of 4 quests to Spec  │
│                                                      │
│  MISSIONS    ACTIVITY FEED    LEADERBOARD   BADGES   │
└──────────────────────────────────────────────────────┘
```

- **Stat cards:** Events attended, badges earned, stars received from coattendees
- **Milestones section:** Per-team tier progress (quests completed / quests needed for next tier)
- **Subquests panel:** Active coordinator-assigned subquests
- **Activity feed:** Last 20 XP log entries with source, description, and XP/DevCoin amounts
- **Leaderboard widget:** Top 3 volunteers in the chapter + current user's position
- **Badges grid:** All earned and locked achievement badges

---

### XP Transaction Log
Every XP grant is logged as an individual transaction. This powers:
- The Activity Feed on the Dashboard
- Audit trail for coordinators
- Portfolio display ("earned through X events, Y quests, Z reflections")

---

## 7. DevCoins & Marketplace

### What Are DevCoins?

DevCoins are a volunteer-earned currency automatically awarded whenever XP is granted.

**Conversion rate:** 1 DevCoin per 10 XP (rounded down)

Examples:
- +60 XP (Facilitator attendance) → +6 DevCoins
- +75 XP (coordinator-approved quest) → +7 DevCoins
- +25 XP (reflection submitted) → +2 DevCoins

DevCoin balance is shown in the profile header card and the market page. DevCoins never expire.

### The Market

Volunteers spend DevCoins on exclusive DEVCON Kids merchandise at `/market`.

**Product Catalog:**

| Product | Category | Price (DevCoins) |
|---|---|---|
| Sticker Pack | Collectibles | 10 |
| Lanyard | Accessories | 20 |
| Tote Bag | Accessories | 40 |
| T-Shirt | Apparel | 50 |
| Hoodie | Apparel | 150 |
| Plushie | Collectibles | 200 |

**Purchase Rules:**
- Insufficient balance prevents checkout
- Each product can only be redeemed once per volunteer
- Already-redeemed products are visually marked and non-interactive

**Purchase Flow:**
1. Volunteer selects product, color, size, and quantity
2. Confirmation modal shows total DevCoin cost and remaining balance
3. Client fetches Firebase ID token → POST `/api/market/purchase`
4. Server validates balance, executes atomic Firestore transaction: deducts DevCoins, records `redeemedItems[productId]`, creates purchase record
5. Email receipt sent to volunteer and chapter coordinators
6. Success toast displayed; purchase appears in receipt history

**Receipt History:**
Volunteers can view all past orders from the market page, including order ID, product details, date, and DevCoins spent.

---

## 8. Subquests System

Subquests are coordinator-created tasks that supplement the static quest tree. Unlike quests (which are seeded team milestones), subquests are ad hoc assignments created for specific events, projects, or volunteer needs.

### Assignment Types

| Type | Who Can Join |
|---|---|
| `specific` | Named volunteers only (coordinator selects UIDs) |
| `team` | All volunteers in a specified team |
| `open` | Any volunteer can self-enroll |

### Difficulty & XP

| Difficulty | XP Reward |
|---|---|
| Easy | +25 |
| Medium | +75 |
| Hard | +150 |

### Subquest Lifecycle

```
Created (Coordinator) → Active
    │
    ├── Assigned / Joined (Volunteer)
    │
    ├── Submitted (Volunteer adds notes/evidence)
    │
    ├── Coordinator Reviews:
    │       ├── Approve → XP + DevCoins granted, Completed ✓
    │       └── Request Revision → back to Submitted with revision note
    │
    └── Closed (Coordinator closes enrollment)
```

### Subquest Fields

- Title, description, difficulty, XP reward
- Assignment type + assigned volunteers/teams
- Optional: slots limit, deadline, submission guidance
- Created by coordinator (name and UID stored for attribution)

### Where It Lives

- **Dashboard / Subquests Panel:** Volunteers see their active, submitted, and completed subquests
- **`/subquests/new`:** Coordinator creates a new subquest
- **Coordinator Dashboard:** Approval queue for pending subquest submissions

---

## 9. Reflection Form System

Post-event reflections replace the previous Google Forms workflow. Reflections are tied directly to confirmed event attendance and reward XP and DevCoins on submission.

### Trigger Conditions
- A reflection form becomes available to a volunteer **after their attendance at an event is confirmed** by a coordinator
- The form is available for **72 hours** after attendance confirmation, then locked
- One reflection per event, per volunteer — cannot be resubmitted

### The Form (4 questions, ~3 minutes)

```
Post-Event Reflection — [Event Name]
Deadline: [date/time]

1. What was your role today, and what did you actually do?
   (short text, 2–3 sentences)

2. What's one thing that went well?
   (short text)

3. What's one thing you'd do differently?
   (short text)

4. How are you feeling after today's event?
   😴 Drained  |  😐 Okay  |  🙂 Good  |  🔥 Energized
   (single select)
```

### Volunteer Rewards
- **+25 XP** and **+2 DevCoins** on submission (instant, no approval needed)
- Reflection logged in the dashboard activity feed
- After 5 submitted reflections → unlocks "Reflective Contributor" badge

### Stars
Volunteers can give stars to coattendees as part of the reflection flow. Stars received are tracked on the recipient's profile and displayed as a stat card on the dashboard.

### Coordinator View (aggregate only, anonymous)
- Completion rate per event: "6 of 8 volunteers submitted a reflection"
- Energy distribution chart per event (anonymous): breakdown of Drained / Okay / Good / Energized responses
- Individual reflection detail available at `/events/[eventId]/reflections/[userId]`
- If 50%+ of responses are "Drained" → coordinator sees a burnout warning flag on the event

### Where It Lives in the App
- **Events Page / Event Details:** "Submit Reflection" button visible on past events where reflection is pending
- **Dashboard Activity Feed:** Reflection submissions appear as XP log entries

---

## 10. Page Inventory & Content

### Page List

| # | Page | Route | Access |
|---|---|---|---|
| 10.1 | Sign-in | `/` | Public |
| 10.2 | Sign-up | `/register` | Public |
| 10.3 | Onboarding | `/onboarding` | Auth, first-time only |
| 10.4 | Dashboard (Profile) | `/dashboard` | Auth |
| 10.5 | Quests | `/quests` | Auth |
| 10.6 | Events | `/events` | Auth |
| 10.7 | Event Details | `/events/[eventId]` | Auth |
| 10.8 | Reflection Form | `/events/[eventId]/reflect` | Auth, attended volunteers only |
| 10.9 | Reflection Detail | `/events/[eventId]/reflections/[userId]` | Coordinator only |
| 10.10 | Chapter | `/chapter` | Auth |
| 10.11 | Leaderboard | `/leaderboard` | Auth |
| 10.12 | Market | `/market` | Auth |
| 10.13 | Add Subquest | `/subquests/new` | Coordinator only |
| 10.15 | Public Portfolio | `/profile/[uid]` | Public |
| 10.16 | Notifications | `/notifications` | Auth |
| 10.17 | Settings | `/settings` | Auth |

> **Note:** `/profile` redirects to `/dashboard`. There is no longer a separate profile page for authenticated users.

---

### 10.1 Sign-in Page
**Route:** `/`
**Access:** Public (unauthenticated only)

**Content:**
- DevQuest logo + wordmark (top center)
- Tagline: *"Turn your volunteer work into your career."*
- Email input field
- Password input field
- "Sign In" primary button
- "Don't have an account? Sign up" link → `/register`
- Subtle dark purple gradient mesh background

**Logic:**
- On successful auth: check `onboardingComplete`
  - `false` → `/onboarding`
  - `true` → `/dashboard`
- Inline error on failed login

---

### 10.2 Sign-up Page
**Route:** `/register`
**Access:** Public (unauthenticated only)

**Content:**
- DevQuest logo + wordmark
- Email input
- Password input
- Confirm Password input
- "Create Account" primary button
- "Already have an account? Sign in" link → `/`

**Logic:**
- Create Firebase Auth account
- Check email against `coordinator_whitelist`
  - Match → `role: "coordinator"`
  - No match → `role: "volunteer"`
- Redirect to `/onboarding`

---

### 10.3 Onboarding Page
**Route:** `/onboarding`
**Access:** Authenticated, `onboardingComplete === false` only

**Content:**
- "Complete Your Profile" heading
- Avatar customization (DiceBear bottts-neutral; eyes, mouth, background color)
- Username, Contact Number, LinkedIn URL (optional), GitHub URL (optional)
- DEVCON Kids Chapter — dropdown
- Volunteer Team Selection — multiselect chips:
  - 🎨 Creatives · 🤝 People & Culture · 🌐 Community Engagement · 📚 Lead Learners · ⚙️ Sustainability
- "Let's Go" primary CTA

**Logic:**
- Write profile to `users/{uid}`
- Set `onboardingComplete: true`
- Initialize XP: 0, DevCoins: 0, tier: "Team Member" per selected team
- Log +10 XP (+1 DevCoin) transaction for profile setup
- Redirect to `/dashboard`
- Inaccessible after `onboardingComplete === true`

---

### 10.4 Dashboard Page (Unified Profile)
**Route:** `/dashboard`
**Access:** Authenticated

> The Dashboard and Profile pages are consolidated. `/profile` redirects here.

**Content — Volunteer View:**

*Top Bar:* Hamburger menu / "DevQuest" wordmark / Bell → `/notifications` / Avatar

*Profile Header Card:*
- Avatar (team color ring), username, XP total, current level, DevCoin balance
- Primary team + current tier (e.g., "Lead Learners — Associate")
- Team color gradient accent

*Stat Cards (3):*
- Events Attended
- Badges Earned
- Stars Received

*Milestones Section:*
- Per enrolled team: quest progress bar toward next tier
- "X of Y quests to [next tier]"

*Subquests Panel:*
- Active, submitted, and completed coordinator-assigned subquests
- Join / submit / view status per subquest

*Activity Feed:*
- Last 20 XP log entries: icon, description, XP earned, DevCoins earned, date

*Chapter Leaderboard Widget:*
- Top 3 volunteers in chapter + current user's rank

*Badges Grid:*
- Earned (team color ring) / Locked (grayscale + lock) / tap → tooltip

**Coordinator View:**
- Different layout via `CoordinatorDashboardPage`
- Shows: volunteer roster, pending subquest approvals, chapter stats, team breakdowns

---

### 10.5 Quests Page
**Route:** `/quests`
**Access:** Authenticated

**Content — Volunteer View:**

*Tab Bar:* One tab per enrolled team, active tab in team color

*Quest Path (per tab):*
- Vertical node path: Team Member → Associate → Specialist → Team Lead
- Each tier section header: tier name + lock/unlock status
- Each quest node (expandable):
  - Name + description
  - XP reward badge + DevCoin equivalent
  - Completion method label
  - Status: Locked / In Progress / Pending Approval / Completed ✓
  - Completion date (if done)
  - Action:
    - Self-mark → "Mark Complete"
    - Approval → "Submit for Approval" (opens notes/evidence input)
    - QR scan → "Completed via Event Attendance" (informational only)
- Locked quests visible but greyed + lock icon

**Coordinator Additions:**

*Approvals Tab:*
- All pending quest approvals in coordinator's chapter
- Per item: volunteer name + team tag, quest name, notes/evidence, date submitted
- "Approve" → XP + DevCoins granted, Completed ✓, volunteer notified
- "Request Revision" → In Progress with revision note, volunteer notified

---

### 10.6 Events Page
**Route:** `/events`
**Access:** Authenticated

**Content — Volunteer View:**
- "Events" heading, search bar, filter chips: All / Upcoming / Past
- Event cards: name, date/time, chapter, location, slot fill bar, role tags, status chip

**Coordinator Additions:**
- "Add Event" FAB (bottom right) → `/events/new`
- Events Data Dashboard: reflection analytics per event (energy distribution, burnout flags)

---

### 10.7 Event Details Page
**Route:** `/events/[eventId]`
**Access:** Authenticated

**Content — Volunteer View:**

*Header:* Event name, date/time, location, chapter badge, description

*Roles Section:*
- Each role card: name, slots filled/total, XP reward label
- "Join Event" CTA → Role Confirmation Modal → confirm → registered + QR generated

*Joined State:*
- "You're registered as [Role] · +[XP] XP on attendance" banner
- Personal QR code (full width)
- "Show this to the coordinator on the day of the event"

*Reflection State (post-event, attended):*
- If reflection pending: "Submit your reflection — due in [X hours]" banner + "Submit Now" → `/events/[eventId]/reflect`
- If reflection submitted: "Reflection submitted ✓" chip

**Coordinator View — Volunteers Tab:**
- Summary: X registered / Y confirmed / Z reflections submitted
- Per volunteer: avatar, name, team badge, role, XP to be granted, attendance status
- "Confirm Attendance" → marks attended, grants role-weighted XP + DevCoins, triggers reflection window
- "Scan QR" → camera mode
- "Confirm All" bulk action
- "Export CSV"
- Energy report section (post-event): anonymous distribution + burnout flag if applicable

---

### 10.8 Reflection Form Page
**Route:** `/events/[eventId]/reflect`
**Access:** Authenticated, attended volunteers only, within 72-hour window

**Content:**
- "Post-Event Reflection" heading
- Event name + date (read-only context)
- Deadline countdown: "Closes in [X hours]"
- Q1: "What was your role today, and what did you actually do?" — short text
- Q2: "What's one thing that went well?" — short text
- Q3: "What's one thing you'd do differently?" — short text
- Q4: "How are you feeling after today's event?" — single select: 😴 Drained · 😐 Okay · 🙂 Good · 🔥 Energized
- "+25 XP on submission" reminder label
- "Submit Reflection" primary button

**Logic:**
- On submit: write to `users/{uid}/reflections/{reflectionId}`
- Grant +25 XP (+2 DevCoins), log XP transaction
- Update `events/{eventId}/registrations/{uid}.reflectionSubmitted = true`
- Check if 5th reflection submitted → unlock "Reflective Contributor" badge
- Redirect back to `/events/[eventId]`
- Inaccessible if: reflection already submitted, deadline has passed, or attendance not confirmed

---

### 10.9 Reflection Detail Page
**Route:** `/events/[eventId]/reflections/[userId]`
**Access:** Coordinator only

**Content:**
- Read-only view of an individual volunteer's reflection for a specific event
- Shows all 4 responses and energy level selection
- Volunteer avatar and name (not anonymous — this is the coordinator-only view)

---

### 10.10 Chapter Page
**Route:** `/chapter`
**Access:** Authenticated

**Content:**
- Chapter name + region
- Coordinator info card: avatar, name, contact
- Stats row: Total Events Hosted / Total Volunteers / Total XP Earned
- Events carousel → tap → `/events/[eventId]`
- Volunteers section: search + filter, list with team badge / tier / XP, tap → public profile
- Team breakdown: per-team volunteer counts

**Coordinator Additions:**
- Edit chapter info
- Remove volunteer (⋯ menu)

---

### 10.11 Leaderboard Page
**Route:** `/leaderboard`
**Access:** Authenticated

**Content:**
- Chapter-wide volunteer rankings by total XP
- Season filter (Season / All-Time)
- Each entry: rank, avatar, username, team badge, tier, XP total
- Current user's row highlighted
- DevCoin balances visible alongside XP

---

### 10.12 Market Page
**Route:** `/market`
**Access:** Authenticated

**Content:**
- "Market" heading + current DevCoin balance chip
- *"Redeem your DevCoins for exclusive DEVCON Kids merch."*
- Category filter: All / Accessories / Apparel / Collectibles
- Product grid: each card shows image, name, price, and color options
- Already-redeemed products marked non-interactive
- "Receipts" section: order history viewer

**Purchase Flow:**
- Select product → choose color/size → confirm in modal → purchase executes
- Email receipt sent to volunteer + chapter coordinators
- DevCoin balance updates immediately on success

---

### 10.13 Add Subquest Page
**Route:** `/subquests/new`
**Access:** Coordinator only

**Content:**
- "Create Subquest" heading
- Title, description, difficulty (Easy / Medium / Hard), XP reward (auto-set by difficulty)
- Assignment type: Specific Volunteers / Team / Open
  - Specific: volunteer picker by username
  - Team: team selector (one or more)
  - Open: optional slot limit
- Optional: deadline, submission guidance
- "Create Subquest" primary button

---

### 10.15 Public Portfolio Page
**Route:** `/profile/[uid]`
**Access:** Public (no auth required)

**Content:**
- DevQuest logo + "Verified by DevQuest" badge
- Read-only portfolio: username, chapter, enrolled teams, current tier per team, total XP, XP level
- Verified quest completions (with coordinator and date where applicable)
- Earned badges
- Activity summary (events attended, reflections submitted, XP earned)
- No email, contact number, or DevCoin balance exposed
- "Join DevQuest" CTA → `/register`

---

### 10.16 Notifications Page
**Route:** `/notifications`
**Access:** Authenticated

**Content:**
- "Notifications" heading + "Mark all as read"
- Chronological list:
  - Quest approved: "[Coordinator] approved [Quest]. +[XP] XP"
  - Quest revision: "[Coordinator] requested a revision on [Quest]"
  - Subquest approved: "[Coordinator] approved [Subquest]. +[XP] XP"
  - Subquest revision: "[Coordinator] requested a revision on [Subquest]"
  - Attendance confirmed: "Attendance at [Event] confirmed. +[XP] XP"
  - Reflection due: "Reflection for [Event] due in [X hours]"
  - Tier promoted: "Promoted to [Tier] in [Team]! +100 XP 🎉"
  - New event: "New event: [Name] on [Date]"
- Each item: icon, message, timestamp, unread dot
- Empty state: "You're all caught up."

---

### 10.17 Settings Page
**Route:** `/settings`
**Access:** Authenticated

**Content:**

*Account:* Edit avatar (DiceBear options), username, contact number, LinkedIn URL, GitHub URL, resume URL, change password

*Team Preferences:*
- Enrolled teams (read-only post-onboarding)
- "Request team change" → sends note to coordinator

*Chapter:* Read-only — requires coordinator action to change

*Danger Zone:* "Delete Account" (confirmation modal)

---

## 11. User Flow Diagrams

### 11.1 New User Flow
```
Sign-in Page
    └──→ Sign-up Page
              │
              ├── Email vs coordinator whitelist
              │       ├── Match → role: coordinator
              │       └── No match → role: volunteer
              │
              └──→ Onboarding Page (+10 XP, +1 DevCoin)
                        └──→ Dashboard
```

### 11.2 Returning User Flow
```
Sign-in Page
    ├── onboardingComplete: false ──→ Onboarding Page
    └── onboardingComplete: true  ──→ Dashboard
```

### 11.3 Event Attendance Flow
```
[VOLUNTEER]
Events Page → Event Details Page
    └── "Join Event" → Role Confirmation Modal → Confirm
            └── Registered ✓
                QR Code generated in Firestore
                QR displayed on volunteer's Event Details page

[COORDINATOR]
Event Details Page → Volunteers Tab
    ├── Option A: "Confirm Attendance" per volunteer row
    │       └── Role-weighted XP + DevCoins granted → reflection window opens (72hr)
    │           → QR-triggered quests auto-complete
    │
    └── Option B: "Scan QR" → Camera
              └── Scan → Confirmation dialog → Confirm
                      └── Same as Option A
```

### 11.4 Reflection Flow
```
Attendance confirmed → reflection window opens (72 hours)

Volunteer → /events/[eventId]/reflect
    └── Complete 4-question form → Submit
            └── +25 XP, +2 DevCoins granted
                Stars can be given to coattendees
                Logged in activity feed
                [If 5th reflection] → "Reflective Contributor" badge unlocked

[COORDINATOR]
Event Details → Volunteers Tab (post-event)
    └── Energy distribution chart (anonymous)
            └── [If 50%+ Drained] → burnout warning flag shown

    Events → [eventId]/reflections/[userId]
        └── Individual reflection detail (coordinator only)
```

### 11.5 Quest Completion Flow
```
[SELF-MARK]
Quests Page → Quest Card → "Mark Complete"
    └── Completed ✓ → +20 XP, +2 DevCoins → logged

[COORDINATOR APPROVAL]
Quests Page → Quest Card → "Submit for Approval" → optional notes/evidence
    └── Pending Approval
            └── Coordinator: Approvals Tab
                      ├── Approve → +75/+150 XP → Completed ✓ → volunteer notified
                      └── Request Revision → In Progress with note → volunteer notified

[QR SCAN]
Auto-completes on coordinator attendance confirmation
    └── Matches by eventType + volunteer role → quest auto-completes + XP + DevCoins
```

### 11.6 Subquest Flow
```
[COORDINATOR]
/subquests/new → fill form → "Create Subquest"
    └── Subquest active in Firestore → visible to target volunteers

[VOLUNTEER]
Dashboard → Subquests Panel
    └── View assigned/open subquests
              └── Join (if open) → status: joined
                      └── Submit for Approval (notes/evidence)
                                └── Pending Approval

[COORDINATOR]
Dashboard → Subquest Approvals Queue
    ├── Approve → +25/75/150 XP + DevCoins → Completed ✓ → volunteer notified
    └── Request Revision → back to Submitted with revision note
```

### 11.7 Tier Progression Flow
```
All quests for current tier completed & approved
    └──→ Tier promoted (e.g., Associate → Specialist)
              ├── +100 XP bonus + DevCoins
              ├── Dashboard milestones section updates
              ├── New quest nodes unlocked
              └── Promotion notification sent
```

### 11.8 Market Redemption Flow
```
Market Page → Select Product → Choose color/size/quantity
    └── Confirm Modal → "Redeem [N] DevCoins"
              └── POST /api/market/purchase
                      └── Server validates balance + one-time flag
                              ├── Success → DevCoins deducted, receipt stored, email sent
                              │             Success toast + receipt history updated
                              └── Fail → Error message (insufficient balance / already redeemed)
```

---

## 12. Key Interactions & Logic

### Role Detection at Registration
```
1. Create Firebase Auth account
2. Query: coordinator_whitelist WHERE email == submittedEmail
3. Match → role: "coordinator" | No match → role: "volunteer"
4. Write to users/{uid}
```

### QR Code Generation
```
On volunteer joins event:
1. Generate: "devquest://attendance?eventId={id}&userId={uid}&role={role}"
2. Store in Firestore: events/{eventId}/registrations/{uid}
   { role, roleXP, qrData, attended: false, reflectionSubmitted: false }
3. Render QR client-side from qrData
```

### Coordinator QR Scan → Attendance Confirmation
```
1. Parse scan → extract eventId, userId, role
2. Validate: event exists, user registered
3. Update: registrations/{uid}.attended = true, confirmedAt, confirmedBy
4. Grant XP + DevCoins: users/{uid}.xp += roleXP, users/{uid}.devCoins += floor(roleXP/10)
5. Log XP transaction: source "event_attendance", description "Attended [Event] as [Role]"
6. Open reflection window: registrations/{uid}.reflectionDeadline = now + 72hr
7. Match QR scan quests → auto-complete by eventType + role
8. Send notification to volunteer
```

### DevCoin Calculation
```
DevCoins earned = floor(XP earned / 10)

All XP grants use addXpRewardToBatch() from lib/devCoins.ts:
  - Atomically increments users/{uid}.xp
  - Atomically increments users/{uid}.devCoins
  - Writes to users/{uid}/xpLog/{logId}
```

### Reflection Submission
```
1. Validate: attended = true, reflectionSubmitted = false, now < reflectionDeadline
2. Write to users/{uid}/reflections/{reflectionId}
3. Grant +25 XP (+2 DevCoins), log XP transaction
4. Update registrations/{uid}.reflectionSubmitted = true
5. Count total reflections for user → if === 5, unlock "Reflective Contributor" badge
6. Redirect to /events/[eventId]
```

### XP Grant — All Sources Summary
```
Profile setup:          +10 XP  (+1 DevCoin)     (once)
Event attendance:       +30–60 XP  (+3–6 DevCoins)  (role-weighted, per event)
Quest self-mark:        +20 XP  (+2 DevCoins)     (per quest)
Quest approved:         +75 or +150 XP            (per quest, standard or major)
Subquest approved:      +25, +75, or +150 XP      (per subquest, by difficulty)
Reflection submitted:   +25 XP  (+2 DevCoins)     (per event, within 72hr window)
Tier promotion bonus:   +100 XP (+10 DevCoins)    (per tier, per team)
```

### Guard Conditions
- `/onboarding` → redirect to `/dashboard` if `onboardingComplete: true`
- All app pages → redirect to `/` if unauthenticated
- `/events/[eventId]/reflect` → blocked if not attended, already submitted, or deadline passed
- `/events/[eventId]/reflections/[userId]` → blocked if `role !== "coordinator"`
- `/subquests/new` → blocked if `role !== "coordinator"`
- Coordinator UI elements → conditionally rendered, never CSS-hidden
- Public profile → no email, contact, or DevCoin balance exposed

---

## 13. Data Models

### User
```
users/{uid}
  ├── uid: string
  ├── email: string
  ├── role: "volunteer" | "coordinator"
  ├── username: string
  ├── usernameLower: string          ← lowercase, used for search
  ├── contactNumber: string
  ├── linkedinUrl: string (optional)
  ├── githubUrl: string (optional)
  ├── resumeUrl: string (optional)
  ├── chapterId: string
  ├── teams: string[]
  ├── xp: number
  ├── devCoins: number               ← new: redeemable currency
  ├── starsReceived: number (optional) ← new: peer recognition
  ├── onboardingComplete: boolean
  ├── avatarOptions: object (optional)
  ├── redeemedItems: Record<string, boolean> (optional) ← new: market redemptions
  └── createdAt: timestamp
```

### Team Progress
```
users/{uid}/teamProgress/{teamId}
  ├── teamId: string
  └── currentTier: "team_member" | "associate" | "specialist" | "lead"
```

### XP Transaction Log
```
users/{uid}/xpLog/{logId}
  ├── logId: string
  ├── source: "event_attendance" | "quest_completion" | "reflection" | "profile_setup" | "tier_bonus"
  ├── sourceId: string (eventId / questId / reflectionId)
  ├── description: string
  ├── xp: number
  └── createdAt: timestamp
```

### Event
```
events/{eventId}
  ├── eventId: string
  ├── name: string
  ├── description: string
  ├── date: timestamp
  ├── location: string
  ├── chapterId: string
  ├── createdBy: string (coordinatorUid)
  ├── roles: { roleName: string, slots: number, xpReward: number }[]
  ├── eventType: string (optional)    ← used for QR quest auto-completion matching
  ├── bannerUrl: string (optional)
  ├── isInternal: boolean (optional)
  └── createdAt: timestamp
```

### Event Registration
```
events/{eventId}/registrations/{uid}
  ├── userId: string
  ├── role: string
  ├── roleXP: number
  ├── qrData: string
  ├── attended: boolean
  ├── reflectionSubmitted: boolean
  ├── reflectionDeadline: timestamp (set on attendance confirmation)
  ├── confirmedAt: timestamp (optional)
  └── confirmedBy: string (optional)
```

### Quest (seed data)
```
quests/{questId}
  ├── questId: string
  ├── teamId: string
  ├── tier: "team_member" | "associate" | "specialist" | "lead"
  ├── name: string
  ├── description: string
  ├── xpReward: number
  ├── completionMethod: "qr_scan" | "coordinator_approval" | "self_mark"
  ├── approvalType: "standard" | "major" (optional)  ← determines XP tier
  ├── triggerEventType: string (optional)             ← for QR auto-completion
  └── triggerRole: string (optional)                 ← for QR auto-completion
```

### Quest Completion
```
users/{uid}/questCompletions/{questId}
  ├── questId: string
  ├── status: "in_progress" | "pending_approval" | "completed"
  ├── submissionNotes: string (optional)
  ├── evidenceUrl: string (optional)
  ├── approvedBy: string (optional)
  ├── completedAt: timestamp (optional)
  ├── xpGranted: number
  └── revisionNote: string (optional)
```

### Subquest
```
subquests/{subquestId}
  ├── subquestId: string
  ├── title: string
  ├── description: string
  ├── difficulty: "easy" | "medium" | "hard"
  ├── xpReward: number (25 / 75 / 150)
  ├── assignmentType: "specific" | "team" | "open"
  ├── assignedTo: string[] (optional)    ← UIDs for "specific" type
  ├── assignedTeams: string[] (optional) ← team IDs for "team" type
  ├── slots: number (optional)           ← max joiners for "open" type
  ├── deadline: timestamp (optional)
  ├── submissionGuidance: string (optional)
  ├── chapterId: string
  ├── createdBy: string (coordinatorUid)
  ├── createdByUsername: string
  └── status: "active" | "closed"
```

### Subquest Completion
```
users/{uid}/subquestCompletions/{subquestId}
  ├── subquestId: string
  ├── status: "assigned" | "joined" | "submitted" | "completed"
  ├── submissionNotes: string (optional)
  ├── evidenceUrl: string (optional)
  ├── approvedBy: string (optional)
  ├── completedAt: timestamp (optional)
  ├── xpGranted: number
  └── revisionNote: string (optional)
```

### Reflection
```
users/{uid}/reflections/{reflectionId}
  ├── reflectionId: string
  ├── eventId: string
  ├── eventName: string
  ├── role: string
  ├── whatDidYouDo: string
  ├── wentWell: string
  ├── doDifferently: string
  ├── energyLevel: "drained" | "okay" | "good" | "energized"
  ├── xpGranted: number (always 25)
  └── submittedAt: timestamp
```

### Chapter
```
chapters/{chapterId}
  ├── chapterId: string
  ├── name: string
  ├── region: string
  └── coordinatorUid: string
```

### Notification
```
users/{uid}/notifications/{notifId}
  ├── notifId: string
  ├── type: "quest_approved" | "quest_revision" | "attendance_confirmed" | "reflection_due" | "tier_promoted" | "new_event"
  ├── message: string
  ├── read: boolean
  ├── relatedId: string (optional)
  └── createdAt: timestamp
```

### Purchase Record
```
users/{uid}/purchases/{orderId}
  ├── orderId: string
  ├── productId: number
  ├── productName: string
  ├── color: string
  ├── size: string (optional)
  ├── quantity: number
  ├── totalCost: number (DevCoins)
  ├── remainingDevCoins: number
  └── createdAt: timestamp
```

---

## 14. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Fonts | Agrandir Bold (headings), DM Sans (body/UI) |
| Auth | Firebase Authentication |
| Database | Firestore |
| File Storage | Firebase Storage (avatars, assets) |
| Hosting | Vercel |
| Data Fetching | TanStack Query v5 |
| Server State | React Context (AuthContext, SidebarContext) |
| QR Generation | Client-side from QR data string |
| QR Scanning | `html5-qrcode` |
| PDF Export | `jspdf` |
| AI | Google Gemini (`@google/generative-ai`) — resume enhancement |
| Icons | `@phosphor-icons/react` |
| Email | `nodemailer` — market receipts |

---

*This document reflects the shipped state of DevQuest as of April 2026. Update it when significant features ship or are removed.*
