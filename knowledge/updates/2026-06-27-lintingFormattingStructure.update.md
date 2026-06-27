# Unified Linting & Formatting Structure (2026-06-27)

> Full design/spec: `docs/superpowers/specs/2026-06-27-lint-format-structure-design.md` (outer MVP repo)
> Root configs: `eslint.config.mjs`, `prettier.config.mjs`, `.prettierignore`, `.editorconfig`

## Problem

Front's lint/format was inconsistent and partly broken:

- ESLint was split: `apps/dashboard` used **legacy** `.eslintrc.json`,
  `apps/admin` used a **flat** config; `packages/ui` had none.
- Prettier configs only loaded the tailwind plugin — **no shared rules**, so
  quotes/width fell back to per-editor defaults.
- Front runs **Next 16**, which **removed `next lint`**, so the per-app `next
  lint` scripts were already obsolete.
- No `.editorconfig`, no git hooks, no commitlint, no CI.

## Solution

A **single root ESLint flat config** (`eslint.config.mjs`) built on
`eslint-config-next` via `FlatCompat` (`next/core-web-vitals` +
`next/typescript`), applied to both apps and `packages/ui`. Flat config resolves
from the cwd and searches upward, so this one file serves `eslint .` at the root
(lint-staged / CI) and lint from any app dir. `eslint-config-prettier` is last.

- `next.rootDir` points at both apps so the Next plugin's page-aware rules work
  from the monorepo root.
- **Adoption baseline**: 94 pre-existing errors (across 11 rules, e.g.
  `react-hooks/rules-of-hooks`, `react/jsx-no-undef`, `@typescript-eslint/
  no-namespace`) are downgraded to **warnings** so CI is green on day one
  WITHOUT hiding them. They are real and should be fixed, then re-escalated to
  `error` one rule at a time. **Do not add new violations.**
- One root `prettier.config.mjs` (`tabWidth 2`, single quotes, `trailingComma
  all`, `printWidth 100`) **with `prettier-plugin-tailwindcss`** for class
  sorting + a `.prettierignore` (excludes `.next`, build output, worktrees, docs).
- husky + lint-staged + commitlint + GitHub Actions `ci.yml` (`format:check` + `lint`).

## Changes

- **Added**: root `eslint.config.mjs`, `prettier.config.mjs`, `.prettierignore`,
  `.editorconfig`, `.lintstagedrc.mjs`, `commitlint.config.mjs`,
  `.husky/{pre-commit,commit-msg}`, `.github/workflows/ci.yml`. Root devDeps:
  eslint, @eslint/eslintrc, eslint-config-next, eslint-config-prettier, prettier,
  prettier-plugin-tailwindcss, husky, lint-staged, commitlint.
- **Removed**: `apps/dashboard/.eslintrc.json`, `apps/admin/eslint.config.mjs`,
  and both apps' `.prettierrc`.
- **Scripts** (root): `lint` (`eslint .`), `lint:fix`, `format`, `format:check`,
  `ci:check`, `prepare`. Per-app `next lint` → `eslint .`.
- **Reformat**: one-time `style:` commit reformatted 709 source files. No behavior change.

## Verification

- `pnpm lint` → **0 errors**, 625 warnings (baselined + informational).
- `pnpm exec prettier --check .` → clean.
- commitlint + lint-staged verified live on commit.
- Lands as two commits: `build(tooling): ...` then `style: reformat ...`.

## Follow-up

Burn down the baselined warnings (see `eslint.config.mjs` "Adoption baseline"
block) and re-escalate rules to `error`. `react-hooks/rules-of-hooks` and
`react/jsx-no-undef` warnings are worth reviewing first — some may be real bugs.
