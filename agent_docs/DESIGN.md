# Design System

## Colors (Tailwind CSS variables)
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

## Team Colors

Team colors are first-class identity markers — use them aggressively on card left borders, progress bar fills, chip backgrounds, badge rings, and section headers. Never render team-contextual content in neutral gray.

```
Lead Learners:         #F5C518
People & Culture:      #F97316
Community Engagement:  #06B6D4
Creatives:             #9333EA
Sustainability:        #22C55E
```

## Typography

- **Agrandir Bold** — all headings, section headers, display text
- **DM Sans** — body copy, labels, buttons, inputs, numbers

## Component Conventions

- Cards: `rounded-2xl bg-surface border border-[#27272A]`
- Buttons: primary = `bg-[#A855F7]` / secondary = ghost with purple border
- Progress bars: 8px height, `rounded-full`, team color fill
- Badges: circular, team color ring when earned, grayscale + lock when locked
- Inputs: `bg-surface rounded-lg`, purple focus ring

## Aesthetic Direction

Dark-only. Purple-dominant (#7C3AED / #A855F7) with team colors as first-class identity markers. Closer to an indie game dashboard than a career tool — RPG character sheet meets professional portfolio.

**Anti-reference:** Generic SaaS / corporate (Jira, Linear, Google Workspace). No cold blues, no sterile white space, no enterprise-dashboard energy.

## Design Principles

1. **Progress is always visible.** XP, tier, quest completion, milestone count — never bury these. A volunteer should feel their effort reflected back on every page.

2. **Team identity shapes the interface.** Team colors should appear on all team-contextual content.

3. **Bold over subtle.** Stronger color, heavier type, larger numbers. When in doubt, push further.

4. **Gamified but credible.** XP, tier badges, and quest completions are real professional milestones — treat them with visual weight, not novelty.

5. **No corporate sterility.** Every component needs at least one moment of personality — a team color, a glowing border, a bold stat.

## Users

Filipino student volunteers (ages ~16–22) in the DEVCON Kids program. Often on mobile, between school and volunteer commitments. This is frequently their first structured career-building experience.

**The job to be done:** Transform "I helped run an event" into a verifiable, exportable career milestone — something credible enough to share with a recruiter.

**Brand personality:** Bold · Playful · Energetic. DevQuest feels like a coach genuinely excited about your progress — not a corporate HR system logging hours.

**Emotional goal:** Proud of their progress. Progress is never invisible; every interaction reinforces that effort is real, tracked, and valued.
