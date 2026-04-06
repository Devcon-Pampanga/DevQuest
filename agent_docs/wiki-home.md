# Welcome to the DevQuest Wiki

**DevQuest** is an open-source career progression platform for DEVCON Kids student volunteers. It transforms volunteer work into verifiable professional milestones through structured quest lines, role-weighted XP, coordinator-verified attendance, post-event reflections, and exportable portfolios.

> _"Turn your volunteer work into your career."_

## What is DevQuest?

DEVCON Kids Pampanga student volunteers do real, meaningful work — facilitating code camps, designing event materials, building community partnerships — but they walk away with nothing to show for it. No credentials, no structured record, no career story.

DevQuest fixes that. Every contribution a volunteer makes is mapped to a real DEVCON Kids career milestone: tracked, verified by a coordinator, and reflected in an exportable professional portfolio. Volunteers earn XP and DevCoins as they grow, and can redeem their coins for exclusive DEVCON Kids merchandise.

**Built for:** DEVCON Kids volunteers and coordinators
**Open source:** Contributions welcome — see [Contributing](#contributing)
**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Firebase · Vercel

## Wiki Pages

### For Everyone

| Page | Description |
|---|---|
| [Project Overview](Project-Overview) | Full product spec — roles, pages, flows, data models, design system |
| [FAQ](FAQ) | Common questions for volunteers, coordinators, and contributors |

### Quick Reference

| Topic | Where to look |
|---|---|
| App pages & routes | [Project Overview → Page Inventory](Project-Overview#10-page-inventory--content) |
| User roles | [Project Overview → User Roles](Project-Overview#2-user-roles) |
| XP values & sources | [Project Overview → XP & Progression](Project-Overview#6-xp--progression-system) |
| DevCoins & market | [Project Overview → DevCoins & Marketplace](Project-Overview#7-devcoins--marketplace) |
| Quest verification types | [Project Overview → Quest Verification](Project-Overview#5-quest-verification-system) |
| Volunteer teams & milestones | [Project Overview → Volunteer Teams](Project-Overview#4-volunteer-teams--milestones) |
| Missions system | [Project Overview → Missions](Project-Overview#8-missions-system) |
| Reflection forms | [Project Overview → Reflection Form](Project-Overview#9-reflection-form-system) |
| Data models (Firestore) | [Project Overview → Data Models](Project-Overview#13-data-models) |
| Design system & tokens | [Project Overview → Design System](Project-Overview#3-design-system) |
| Tech stack | [Project Overview → Tech Stack](Project-Overview#14-tech-stack) |

## Key Concepts at a Glance

### Two User Roles
- **Volunteer** — joins events, completes quests, earns XP and DevCoins, exports portfolio
- **Coordinator** — all volunteer capabilities + creates events and missions, confirms attendance via QR scan, approves quest and mission completions

### How Progression Works
Volunteers belong to one or more of five teams (Lead Learners, Creatives, People & Culture, Community Engagement, Sustainability). Each team has its own tier ladder: **Team Member → Associate → Specialist → Team Lead**. Advancing through tiers requires completing team-specific quests — not XP thresholds.

XP is a separate global score that accumulates from all activity (events, quests, missions, reflections) and feeds the leaderboard, DevCoin balance, and public portfolio.

### How Quests Are Verified
| Type | Used for |
|---|---|
| QR Scan | Event attendance, code camp facilitation — auto-completes on coordinator scan |
| Coordinator Approval | Reports, demos, design deliverables — coordinator reviews and approves |
| Self-mark | Application forms, acknowledgments — volunteer marks complete |

### DevCoins
Every XP earned automatically converts to DevCoins at **1 DevCoin per 10 XP**. Volunteers spend DevCoins in the DevQuest Market to redeem exclusive DEVCON Kids merchandise (stickers, lanyards, tote bags, shirts, hoodies, plushies).

## Contributing

DevQuest is open source. To get started:

```bash
git clone https://github.com/Devcon-Pampanga/DevQuest.git
cd DevQuest
npm install
npm run dev        # http://localhost:3000
```

**Build & type-check:**
```bash
npm run build      # Also validates TypeScript
npm run lint       # ESLint
```

No test runner is configured — use `npm run build` to catch type errors before opening a PR.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Firebase (Auth, Firestore, Storage) · Vercel

Firebase credentials are required for local development. Reach out to a coordinator for a dev environment config.



## Project Info

| | |
|---|---|
| **Track** | Cabalen Connect — DevCon Pampanga Hackathon |
| **Organization** | DEVCON Kids Pampanga |
| **Wiki version** | 4.0 — April 2026 |
