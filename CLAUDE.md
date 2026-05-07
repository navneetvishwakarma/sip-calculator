# SIP Calculator — Project Rules

## Branching

- **Never commit directly to `main`.** All work happens on feature branches.
- Branch naming: `phase/NN-slug` for phase work, `fix/slug` for bug fixes, `chore/slug` for non-code changes.
- Merge to `main` only via PR, after CI passes.
- Push after every wave or logical completion checkpoint — do not let commits accumulate locally.

## GitHub Workflow

- Every phase maps to a `phase/NN-slug` branch.
- Open a PR when the phase is ready for verification. CI must be green before merge.
- GitHub Issues track requirements and plans. GitHub Project board tracks phase/plan status.

## Stack

See `.planning/PROJECT.md` for full stack details. Key constraints:
- `packages/core` has zero DOM/browser/React/Next.js imports — enforced by tsconfig lib and ESLint.
- No inline `/ 12 / 100` for rate conversion — use `monthlyRate()` only.
- Tailwind v4 CSS-first config (no `tailwind.config.js`).
- Better Auth only (Lucia deprecated 2025).
