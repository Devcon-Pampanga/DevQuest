# Frequently Asked Questions

## For Volunteers

1. **How do I earn XP?**
   XP is awarded automatically from five sources:
   - Attending an event (role-weighted: +30 to +60 XP depending on your role)
   - Completing a quest (+20 self-mark / +75 coordinator-approved / +150 major milestone)
   - Completing a mission (+25 easy / +75 medium / +150 hard)
   - Submitting a post-event reflection (+25)
   - Completing your profile during onboarding (+10, one time)

   A +100 XP bonus is also granted each time you advance to a new tier.

2. **How do I earn DevCoins?**
   DevCoins are earned automatically alongside every XP grant at a rate of **1 DevCoin per 10 XP** (rounded down). You don't need to do anything extra — if you earned XP, you earned DevCoins.

3. **What's the difference between XP and DevCoins?**
   They're related but serve different purposes:
   - **XP** is your cumulative progress score. It feeds your level, your leaderboard rank, and your public portfolio. It never resets.
   - **DevCoins** are a spendable currency. You redeem them in the market for DEVCON Kids merchandise. Spending DevCoins does not reduce your XP.

4. **What's the difference between quests and missions?**
   - **Quests** are the fixed milestone ladder for your volunteer team — pre-defined by DEVCON Kids and seeded into the platform. Completing them in order is how you advance your tier (e.g., Associate → Specialist).
   - **Missions** are ad hoc tasks created by coordinators for specific needs — a project, an event, a one-off assignment. They don't affect your tier but reward XP and DevCoins.

5. **How do tiers work? What does XP have to do with it?**
   Nothing — tier progression and XP are fully independent systems. Your tier in a team advances only when you complete all the required quests for that tier. Having a high XP total does not unlock the next tier. Think of XP as a measure of activity and tiers as credentials.

6. **Can I be on more than one team?**
   Yes. You can enroll in multiple teams during onboarding. Each team has its own independent tier ladder — your progress in Lead Learners and your progress in Creatives are tracked separately.

7. **Can I change my team after onboarding?**
   Your enrolled teams are locked after onboarding. To request a change, go to **Settings → Team Preferences** and use the "Request team change" option. A coordinator will handle it from there.

8. **How does QR attendance work?**
   When you register for an event in DevQuest, a personal QR code is generated for you. On the day of the event, show your QR code (visible on the Event Details page) to a coordinator. They scan it using the in-app scanner, which confirms your attendance, grants your role-weighted XP and DevCoins, and opens your 72-hour reflection window. Any quests that are triggered by that event type and your role are also auto-completed.

9. **When does the reflection form appear?**
   After a coordinator confirms your attendance at an event, the reflection form becomes available on the Event Details page. You have **72 hours** from the moment attendance is confirmed to submit it. After that the form locks permanently. You can only submit one reflection per event.

10. **What happens if I miss the reflection deadline?**
    The reflection is locked and you won't be able to submit it or earn the +25 XP / +2 DevCoins for that event. The deadline is firm and cannot be extended by volunteers.

11. **How do I export my portfolio?**
    Your portfolio is always publicly accessible at `/profile/[your uid]` — no login required. Share that link directly. A PDF export option is also available on your dashboard.

12. **What is the "Stars Received" stat on my dashboard?**
    After an event, coattendees can give stars to each other as part of the reflection flow. Stars are a peer recognition signal and are displayed on your dashboard and public portfolio as a separate stat. They don't convert to XP or DevCoins.

13. **Can I redeem a market item more than once?**
    No. Each product in the market can only be redeemed once per volunteer. Once you redeem an item, it's marked on your profile and you won't be able to purchase it again.

## For Coordinators

1. **How do I become a coordinator?**
   Coordinator access is granted by email whitelist. When you register with an email that's on the `coordinator_whitelist` Firestore collection, your account is automatically assigned the `coordinator` role. Contact an existing coordinator or the project maintainer to have your email added.

2. **How do I confirm a volunteer's attendance?**
   Open the event in DevQuest, go to the **Volunteers** tab, and either:
   - Tap **Confirm Attendance** next to a volunteer's row, or
   - Tap **Scan QR** to open the camera and scan the volunteer's personal QR code

   Both methods grant the volunteer their role-weighted XP, open their 72-hour reflection window, and auto-complete any matching QR-scan quests.

3. **How do I approve a quest or mission submission?**
   Quest approvals appear in the **Approvals** tab on the Quests page. Mission approvals appear in the **Coordinator Dashboard**. Each item shows the volunteer's name, the quest/mission, any submitted notes or evidence link, and the submission date. You can **Approve** (grants XP immediately) or **Request Revision** (returns it to the volunteer with a note).

4. **How do I create a mission?**
   Go to `/missions/new`. Set a title, description, difficulty (Easy / Medium / Hard), and choose how it's assigned:
   - **Specific** — pick individual volunteers by username
   - **Team** — assign to one or more volunteer teams
   - **Open** — any volunteer can join (optionally cap with a slot limit)

   You can also set a deadline and submission guidance. Once created, the mission is immediately visible to the target volunteers in their Missions Panel.

5. **Can I remove a volunteer from the chapter?**
   Yes. On the Chapter page, coordinators can remove a volunteer via the ⋯ menu on their volunteer row.

6. **Can I see individual reflection responses?**
   Yes — coordinator-only. Go to `/events/[eventId]/reflections/[userId]` to view an individual volunteer's full reflection. On the main Event Details page, the energy distribution chart shows only anonymous aggregate data.

## For Contributors

1. **How do I set up the project locally?**

   ```bash
   git clone https://github.com/Devcon-Pampanga/DevQuest.git
   cd DevQuest
   npm install
   npm run dev    # http://localhost:3000
   ```

   You'll need a Firebase project with Auth, Firestore, and Storage enabled. Create a `.env.local` file at the repo root with your Firebase config keys. Reach out to a coordinator for a dev environment config.

2. **How do I check for type errors?**
   There's no dedicated test runner. Use the build command, which validates TypeScript:

   ```bash
   npm run build
   ```

   Run `npm run lint` for ESLint checks.

3. **Where are the Firestore data models defined?**
   TypeScript interfaces live in the `types/` directory at the repo root:
   - `types/user.ts` — User, InitialUserDocument
   - `types/quest.ts` — Quest, QuestCompletion, QuestStatus, QuestTier
   - `types/mission.ts` — Mission, MissionCompletion, MissionDifficulty
   - `types/xp.ts` — XPLogEntry, XPLogSource
   - `types/chapter.ts` — Chapter, ChapterEventDoc

   The full Firestore schema with field-level documentation is in the [Project Overview → Data Models](Project-Overview#13-data-models).

4. **How does XP granting work under the hood?**
   All XP grants go through `addXpRewardToBatch()` in `lib/devCoins.ts`. It takes a Firestore batch, the user UID, XP amount, source, and description, then atomically:
   1. Increments `users/{uid}.xp`
   2. Increments `users/{uid}.devCoins` by `floor(xp / 10)`
   3. Appends an entry to `users/{uid}/xpLog`

   Never grant XP by writing directly to the user doc — always use this function to keep the log consistent.

5. **How do QR-scan quests auto-complete?**
   When a coordinator confirms attendance, `lib/events/completeQrScanQuests.ts` runs for each of the volunteer's enrolled teams. It finds the volunteer's current tier, looks for the first incomplete `qr_scan` quest in that tier where `triggerEventType` matches the event's `eventType` (and `triggerRole` matches the volunteer's role, if set), and auto-completes it. Quest `triggerEventType` and `triggerRole` are set when seeding quests.

6. **How do I seed quests into Firestore?**
   Quests are seeded via the API route at `/api/seed-quests` (dev environment only). Quest definitions live in `lib/seed/quests.ts`. Only run the seeder once — it writes to the top-level `quests` collection which is shared across all users.

7. **Where should I look for existing utilities before writing new code?**
   - XP granting: `lib/devCoins.ts`
   - Tier logic: `lib/tierLadder.ts`
   - Quest status: `lib/quest-utils.ts`
   - Query keys: `lib/queryKeys.ts` — always use this, never hardcode TanStack Query key strings
   - Auth helpers: `lib/auth-helpers.ts`
   - Event attendance: `lib/events/attendanceConfirmation.ts`
