# Contributing Guidelines

Thank you for contributing to DevQuest.
This guide explains how to collaborate effectively and keep the codebase consistent.

## Project Structure

DevQuest currently uses a Next.js App Router structure:

```text
app/                  # Application routes and pages
lib/                  # Shared libraries and service config (e.g., firebase.ts)
public/               # Static assets

.env.local.example    # Firebase environment variable template
tailwind.config.ts    # Tailwind CSS configuration
next.config.mjs       # Next.js configuration
```

When adding code:
- Put route-level UI in `app/`.
- Put reusable service setup and shared logic in `lib/`.
- Keep project-level config files in the root.

## Branching Strategy

Use clear branch names so work is easy to track:

- `main` -> production-ready code
- `staging` -> integration and QA (if your team uses a staging branch)
- `feature/<name>` -> new features
- `fix/<name>` -> bug fixes
- `chore/<name>` -> tooling, docs, or maintenance updates

Example:

```bash
git checkout -b feature/quest-progress-tracker
```

## Commit Message Format

Use concise, imperative commit messages with one of these prefixes:

| Prefix | Use When | Example |
|:--|:--|:--|
| `Add:` | Creating a new feature, file, or module | `Add: firebase auth utility` |
| `Fix:` | Fixing a bug or broken behavior | `Fix: leaderboard rank sorting` |
| `Update:` | Improving or refactoring existing code | `Update: onboarding copy in home page` |
| `Delete:` | Removing unused or deprecated code | `Delete: obsolete quest mock data` |
| `Docs:` | Documentation-only changes | `Docs: setup steps for firebase env` |
| `Merge:` | Merge commits between branches | `Merge: staging into main` |

Tips:
- Use imperative voice (`Add`, not `Added`).
- Keep the subject short and specific.
- Focus on the reason for the change when possible.

## Issue Naming Convention

Use this pattern for issue titles:

```text
[OptionalPriority][OptionalArea] Type: Component/Feature - Short description
```

Guidance:
- Optional priority: `[High]`, `[Med]`, `[Low]`
- Optional area: `[Frontend]`, `[Backend]`, `[Firebase]`, `[Docs]`
- Type examples: `Create`, `Fix`, `Update`, `Refactor`, `Test`

Examples:
- `Create: Quest Dashboard - initial progress widgets`
- `Fix: QR attendance scanner permission handling`
- `[High][Firebase] Fix: Firestore rules for leaderboard writes`
- `Update: Portfolio Export - include badge metadata`

## Pull Request Process

1. Sync your branch with the latest base branch.
2. Push your branch:

```bash
git push origin feature/<feature-name>
```

3. Open a pull request against `staging` (or `main` if your team does not use `staging`).
4. Add a clear PR description with:
   - what changed
   - why it changed
   - how it was tested
5. Request a review and address feedback.
6. Merge after approval and passing checks.

After merge, clean up your local and remote branch:

```bash
git branch -d feature/<feature-name>
git push origin --delete feature/<feature-name>
```

## Local Setup Checklist

Before running the app locally:

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.local.example` to `.env.local`.
3. Fill in all Firebase keys in `.env.local`.
4. Start development server:

```bash
npm run dev
```

## Code Quality Expectations

- Keep TypeScript types explicit where they improve readability and safety.
- Prefer small, focused components and modules.
- Avoid hardcoding secrets or Firebase credentials in source files.
- Run checks before opening a PR:

```bash
npm run lint
```
