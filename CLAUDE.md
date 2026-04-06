# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What Is DevQuest

DevQuest is an open-source career progression platform for DEVCON Kids student volunteers. It transforms volunteer work into verifiable professional milestones through structured quest lines, role-weighted XP, coordinator-verified attendance, post-event reflections, and exportable portfolios.

---

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build (also validates TypeScript)
npm run lint     # ESLint
```

No test runner is configured. Use `npm run build` to catch TypeScript errors.

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
| Storage | Firebase Storage |
| Hosting | Vercel |
| Data fetching | TanStack Query v5 |
| AI | Google Gemini (`@google/generative-ai`) |
| QR Scanning | `html5-qrcode` |
| PDF Export | `jspdf` |
| Icons | `@phosphor-icons/react` |

---

## Project Structure

Application code lives at the **repository root** — there is no `src/` folder.

```
app/
├── (auth)/                   # Sign-in `/`, register `/register`
├── onboarding/               # `/onboarding` — NOT a route group (avoids root conflict with (auth))
├── (dashboard)/              # Authenticated shell with sidebar
│   ├── dashboard/            # /dashboard
│   ├── quests/               # /quests
│   ├── events/               # /events, /events/[eventId], /events/[eventId]/reflect
│   │   └── [eventId]/reflections/[userId]/   # coordinator-only reflection detail
│   ├── chapter/              # /chapter
│   ├── leaderboard/          # /leaderboard
│   ├── market/               # /market
│   ├── subquests/new/        # /subquests/new (coordinator: add subquest)
│   ├── notifications/        # /notifications
│   ├── profile/              # /profile (own profile)
│   └── settings/             # /settings
├── profile/[uid]/            # /profile/[uid] — public portfolio, no auth required
├── api/
│   ├── luma/                 # Luma event sync
│   ├── market/purchase/      # DevCoin market purchase + email receipt
│   ├── resume-enhance/       # Gemini-powered resume AI
│   └── seed-quests/          # Dev-only: populate Firestore quests collection
├── providers.tsx             # QueryClientProvider wrapper
└── layout.tsx                # Root layout — AuthProvider + Providers

components/
├── ui/                       # Avatar, icons
├── layout/                   # PageShell, Sidebar
├── dashboard/                # Dashboard section components
├── events/                   # Events list + event detail (modular: eventDetail/)
│   └── reflect/              # ReflectionView + LikertScale (reflect page components)
├── onboarding/               # OnboardingView, OnboardingIcons
├── quests/                   # Quest map, tier sections, missions panel, coordinator hub
├── chapter/                  # Chapter page components
├── leaderboard/              # Leaderboard components
├── market/                   # Market page, product cards, receipt system
├── profile/                  # Profile page components (own + public)
├── subquests/new/            # Add subquest view + VolunteerPicker
└── forms/                    # FormSectionCard, FormIcons

context/
├── AuthContext.tsx           # AuthProvider + useAuth — Firebase auth + live Firestore user subscription
└── SidebarContext.tsx        # Mobile sidebar open state

hooks/                        # Feature hooks — all data-fetching hooks use TanStack Query
                              # Form/action hooks: useReflectionForm, useOnboardingForm,
                              #   useNewEventForm, useAddSubquestForm,
                              #   useQuestSubmission, useSubquestActions
lib/
├── firebase.ts               # Firebase app, auth, db, storage (client)
├── firebase-admin.ts         # Firebase Admin SDK (server/API routes only)
├── auth-helpers.ts           # signIn, signUp, completeOnboarding
├── queryKeys.ts              # Centralized TanStack Query key factory — always use this
├── events/                   # Event data, QR attendance, quest completion triggers
├── resume-enhance/           # Gemini resume AI — context loader + merger
└── market/                   # DevCoin purchase helpers + email receipt

types/                        # Shared TypeScript interfaces
utils/                        # password.ts (strength check)
agent_docs/                   # Extended reference docs (see below)
```

---

## Reference Docs

- [Architecture](agent_docs/ARCHITECTURE.md) — auth/session pattern, data fetching, roles, guards, pages, conventions
- [Data](agent_docs/DATA.md) — Firestore schema, XP system, QR attendance, reflections, teams & tiers
- [Design](agent_docs/DESIGN.md) — color tokens, team colors, typography, component conventions, aesthetic direction
