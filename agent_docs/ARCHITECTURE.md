# Architecture

## Auth & Session Pattern

**`useAuth()`** from `context/AuthContext.tsx` is the single source of truth. It exposes:
- `status: "loading" | "ready"` — wait for `ready` before acting
- `firebaseUser: FirebaseUser | null` — Firebase Auth user
- `user: SessionUser | null` — Firestore `users/{uid}` document, live-synced via `onSnapshot`

**`useRequireDashboardAuth()`** (`hooks/useRequireDashboardAuth.ts`) handles redirects for all dashboard routes: unauthenticated → `/`, `onboardingComplete: false` → `/onboarding`.

Do **not** add new `onAuthStateChanged` listeners in pages. Rely on `useAuth()`.

---

## Data Fetching Pattern

All server data fetches use **TanStack Query** (`useQuery`). Query keys come exclusively from `lib/queryKeys.ts` — never hardcode key strings. Mutations call Firestore directly and invalidate relevant query keys.

---

## User Roles

Two roles: `volunteer` (default) and `coordinator`. Role is set at registration by checking the `coordinator_whitelist` Firestore collection. **Never trust client-side role.** Always validate from Firestore before performing coordinator actions.

---

## Authentication Guards

| Condition | Redirect |
|---|---|
| Unauthenticated | `/` |
| `onboardingComplete: false` | `/onboarding` |
| `/events/new`, `/subquests/new` | Coordinator only |
| `/events/[eventId]/reflect` | Auth + attended + not submitted + within 72h deadline |
| `/profile/[uid]` | Public — no auth required |

---

## Pages Reference

| Route | Access |
|---|---|
| `/` | Public |
| `/register` | Public |
| `/onboarding` | Auth, first-time only |
| `/dashboard` | Auth |
| `/quests` | Auth |
| `/events` | Auth |
| `/events/[eventId]` | Auth |
| `/events/new` | Coordinator only |
| `/events/[eventId]/reflect` | Auth + attended + deadline |
| `/events/[eventId]/reflections/[userId]` | Coordinator only |
| `/chapter` | Auth |
| `/leaderboard` | Auth |
| `/market` | Auth |
| `/subquests/new` | Coordinator only |
| `/profile` | Auth (own profile) |
| `/profile/[uid]` | Public portfolio |
| `/notifications` | Auth |
| `/settings` | Auth |

---

## Critical Conventions

- **Never use `<form>` HTML elements.** Use controlled inputs with `onChange` / `onClick`.
- **Never trust client for role.** Always read from Firestore before coordinator actions.
- **Always log XP** to `xpLog` — never increment `users/{uid}.xp` alone.
- **Coordinator-only UI** must be conditionally rendered, not CSS-hidden.
- **Public portfolio** (`/profile/[uid]`) must never expose contact number or email.
- **Route groups at root:** Never add a `app/(group)/page.tsx` alongside `app/(auth)/page.tsx` — both resolve to `/` and conflict. Use `app/routename/page.tsx` for new top-level pages.
- **Query keys:** Always use `lib/queryKeys.ts` — never hardcode TanStack Query key strings.
- **`@/*`** path alias maps to the repository root.
