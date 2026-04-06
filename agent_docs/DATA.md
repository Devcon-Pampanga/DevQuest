# Data Models & Domain Logic

## Key Data Models

### User — `users/{uid}`
```typescript
interface SessionUser {
  uid, email, role, username, usernameLower, contactNumber,
  chapterId, teams: string[], xp, devCoins, onboardingComplete,
  linkedinUrl?, githubUrl?, resumeUrl?, createdAt?,
  avatarOptions?, redeemedItems?, starsReceived?
}
```

### Team Progress — `users/{uid}/teamProgress/{teamId}`
```typescript
{ teamId, currentTier: 'team_member' | 'associate' | 'specialist' | 'lead' }
```

### XP Log — `users/{uid}/xpLog/{logId}`
```typescript
{ logId, source, sourceId, description, xp, createdAt }
```
Every XP grant **must** write here AND increment `users/{uid}.xp`.

### Event — `events/{eventId}`
```typescript
{ eventId, name, description, date, location, chapterId, createdBy,
  eventType?, roles: { roleName, slots, xpReward }[], createdAt }
```

### Registration — `events/{eventId}/registrations/{uid}`
```typescript
{ userId, role, roleXP, qrData, attended, reflectionSubmitted,
  reflectionDeadline?, confirmedAt?, confirmedBy? }
```

### Quest — `quests/{questId}` (seeded from `lib/seed/quests.ts`)
```typescript
{ questId, teamId, tier, name, description, xpReward,
  completionMethod: 'qr_scan' | 'coordinator_approval' | 'self_mark',
  approvalType?: 'standard' | 'major',
  triggerEventType?, triggerRole? }
```
Re-seed in development: `GET /api/seed-quests`.

### Quest Completion — `users/{uid}/questCompletions/{questId}`
```typescript
{ questId, status: 'in_progress' | 'pending_approval' | 'completed',
  submissionNotes?, evidenceUrl?, approvedBy?, completedAt?, xpGranted }
```

### Notification — `users/{uid}/notifications/{notifId}`
```typescript
{ notifId, type, message, read, relatedId?, createdAt }
```
Types: `quest_approved | quest_revision | attendance_confirmed | reflection_due | tier_promoted | new_event`

---

## XP System

XP and team tier are **fully independent**. XP is global and cumulative (never resets). Tier advances only when all required quests for a tier are completed.

| Source | XP |
|---|---|
| Profile setup | +10 |
| Event attendance (Documentation/Usher/Registration) | +30 |
| Event attendance (Tech/Custom) | +40 |
| Event attendance (Host) | +50 |
| Event attendance (Facilitator) | +60 |
| Quest self-mark | +20 |
| Quest coordinator-approved (standard) | +75 |
| Quest coordinator-approved (major) | +150 |
| Reflection submitted | +25 |
| Tier promotion bonus | +100 |

---

## QR Attendance System

QR data format:
```
devquest://attendance?eventId={eventId}&userId={uid}&role={role}
```

On scan: validate registration → set `attended = true` → grant role-weighted XP + log → set `reflectionDeadline = now + 72h` → auto-complete matching `qr_scan` quests → write notification.

**qr_scan quest matching:** `eventType` must exactly match `triggerEventType`, and if `triggerRole` is set, the volunteer's role must contain it (case-insensitive substring). Sequential quests of the same tier/trigger complete one at a time.

---

## Reflection System

- Available 72 hours after attendance confirmation
- One per volunteer per event, cannot resubmit
- Grants +25 XP on submission (no approval needed)
- Coordinators see **anonymous aggregate** energy responses only
- ≥50% "Drained" responses → show burnout warning flag on event

---

## Volunteer Teams & Tiers

All teams: **Team Member → Associate → Specialist → Lead**

`team_member` is the entry state — it has 0 quests. Volunteers start milestone progression at `associate`.

| Team | Lead Title | Color |
|---|---|---|
| Lead Learners | Certified Lead Learner | `#F5C518` |
| Creatives | Creative Director | `#9333EA` |
| People & Culture | P&C Lead | `#F97316` |
| Community Engagement | CE Lead | `#06B6D4` |
| Sustainability | Sustainability Lead | `#22C55E` |
