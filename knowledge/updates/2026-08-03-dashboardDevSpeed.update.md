# 2026-08-03 — Dashboard Dev-Mode Speed

Reference: `apps/dashboard/next.config.mjs`, `apps/dashboard/src/instrumentation-client.ts`,
`apps/dashboard/sentry.server.config.ts`, `apps/dashboard/sentry.edge.config.ts`

## Problem
`apps/dashboard` was very heavy to run in dev mode — slow compiles and high CPU/RAM.

Static analysis (no dev server was run) found three causes:

1. **`@phosphor-icons/react` barrel imports.** The package's barrel
   (`dist/index.es.js`) has 1,515 import lines and pulls **~3,025 modules**
   (1,512 CSR + 1,513 SSR). We import it from **119 places** — 93 in
   `apps/dashboard/src`, 26 in `packages/ui/src`. Turbopack does **not**
   tree-shake in dev, so every route touching a single icon dragged all ~3,025
   modules into its graph.

   Next 16.2.10 ships a default `optimizePackageImports` list
   (`next/dist/server/config.js:988`) that covers `lucide-react` and `recharts`,
   but **not** `@phosphor-icons/react`. Next's own docs
   (`dist/docs/01-app/02-guides/local-development.md:103`) call out this exact
   package as a known dev-speed problem.

2. **Sentry ran at full power in dev.** No config had a dev guard:
   - `instrumentation-client.ts` enabled `replayIntegration()` — Session Replay
     records DOM mutations non-stop, which is costly once HMR starts
     re-rendering the tree on every save.
   - All three configs used `tracesSampleRate: 1` and `enableLogs: true`.
   - The server SDK wires OpenTelemetry auto-instrumentation through
     `import-in-the-middle` / `require-in-the-middle` (both explicit deps), which
     hooks **every module load** in the Node dev server.

3. **Cache bloat.** `apps/dashboard/.next` had grown to **5.2 GB**
   (`.next/dev/cache/turbopack` = 3.8 GB, with single `.sst` files up to 247 MB;
   `.next/dev/server/chunks/ssr` = 626 MB; `.next/dev/static/chunks` = 569 MB).
   This is mostly downstream of cause 1.

## Solution
- Added `experimental.optimizePackageImports: ['@phosphor-icons/react', '@befroosh/ui']`
  so Next rewrites barrel imports to the single icon/component module.
  `@befroosh/ui` is included for its 29-component barrel behind the
  `@/components/ui` alias, which 78 dashboard files import from.
- Gated Sentry off in dev with `enabled: isProd` in all three configs, and made
  `tracesSampleRate` / `enableLogs` / `replayIntegration()` production-only.
  Production behaviour is unchanged.
- Deleted the stale 5.2 GB `.next` so the cache rebuilds lean.
- **Rewrote all 116 barrel imports to deep per-icon imports.** This is the part
  that does not depend on Next's optimizer behaving: `@phosphor-icons/react` →
  `@phosphor-icons/react/dist/csr/<Icon>`, and `@phosphor-icons/react/dist/ssr`
  (itself a 1513-module barrel) → `@phosphor-icons/react/dist/ssr/<Icon>`.
  Type-only imports (`Icon`, `IconProps`) point at
  `@phosphor-icons/react/dist/lib/types` — note `dist/lib` has **no**
  `index.es.js` despite the package's export map claiming one, so `dist/lib`
  itself is not a safe specifier.
- **Removed the two `import * as` namespace imports.** These were hard blockers:
  a namespace import pulls the entire barrel no matter what
  `optimizePackageImports` does. Both were dynamic icon-lookup-by-name:
  - `ItemsStatisticCard.tsx` did `(PhosphorIcons as any)[data.icon]`. The icon
    set turned out to be a closed, hardcoded list of 5 in `DashboardStats.tsx`,
    so `HomeItems.icon` now holds the component itself (typed `Icon`) instead of
    a name string — TypeScript now catches a missing icon.
  - `dialogStyled.tsx` did `Icons[icon]` with `icon?: keyof typeof Icons`. It has
    exactly one call site, so `DialogStyledTitle` now takes the icon component
    directly.
- **Dropped 9 unused dependencies and the `motion` wrapper** (see Changes).

## Changes
- `apps/dashboard/next.config.mjs` — added the `experimental.optimizePackageImports` block.
- `apps/dashboard/src/instrumentation-client.ts` — `isProd` guard; replay + tracing + logs off in dev.
- `apps/dashboard/sentry.server.config.ts` — `isProd` guard; tracing + logs off in dev.
- `apps/dashboard/sentry.edge.config.ts` — `isProd` guard; tracing + logs off in dev.
- 114 files across `apps/dashboard/src` and `packages/ui/src` — Phosphor barrel imports
  rewritten to deep per-icon imports (263 import lines).
- `apps/dashboard/src/components/Console/Dashboard/ItemsStatisticCard.tsx`,
  `DashboardStats.tsx` — icon passed as a component, not a name string.
- `packages/ui/src/components/ui-custom/dialogStyled.tsx`,
  `apps/dashboard/src/components/Contacts/ContactDetailsDialog.tsx` —
  `DialogStyledTitle`'s `icon` prop takes a component. **Breaking for that prop**,
  but it had only one call site, updated here.
- `packages/ui/src/components/ui/infinite-carousel.tsx` — `motion/react` → `framer-motion`.
- `apps/dashboard/package.json` — removed `@vidstack/react`, `draft-js`, `moment-jalaali`,
  `@types/moment-jalaali`, `date-fns-jalali`, `jalaali-react-date-picker`, `log4js`,
  `log4js-json-layout`, `jotai`, `motion`.
- `packages/ui/package.json` — removed `motion`.
- `apps/dashboard/.d.ts` — dropped the now-dead `declare module 'log4js-json-layout'`.

## Verification
**Static + typecheck passed, and dev timings measured (see below).**

Static:
- Every one of the 150 unique deep specifiers resolves to a real file on disk
  (`dist/<path>.es.js` or `.d.ts`) — 0 missing.
- All 264 import bindings were checked against the target module's actual export
  list — 0 mismatches.
- 0 barrel or namespace imports remain in `apps/dashboard/src` / `packages/ui/src`.
- The diff is import-only: of 286 added lines, 263 are Phosphor imports and the
  other 23 are the intentional edits listed above.

Typecheck (`npx tsc --noEmit` in `apps/dashboard`), compared against a true
baseline built in a throwaway worktree at the parent commit `327be292`:
- **211 errors before, 211 after.** Normalising away line/column numbers, the two
  error sets are identical — **0 introduced, 0 fixed**. The only textual
  differences are the worktree path inside two messages and TypeScript's
  non-deterministic key ordering when printing Zod object types.
- All 211 are pre-existing and unrelated (Zod v3/v4 resolver mismatches, `Badge`
  `children`/`className` props, `next/image` and `next/link` unresolved inside
  `packages/ui`, TS4111 index-signature access). `next.config.mjs` sets
  `typescript.ignoreBuildErrors: true`, so these do not block a build.
- Notably **no** `TS2307 Cannot find module '@phosphor-icons/react/dist/...'`,
  which is exactly what a mistyped deep import would produce.

Lockfile: `pnpm install` after the dep removal is purely subtractive — comparing
the full set of resolved `pkg@version` entries gives **0 newly added versions and
624 removed**, taking the graph from 1363 distinct packages to 739. The large
line count also comes from pnpm re-keying peer-dependency hashes across the file.

### Measured dev timings
Both sides run one at a time, `.next` deleted first, identical route order; the
baseline is a throwaway worktree at parent `327be292`. Console routes were
reached by sending a dummy `token` cookie, since `proxy.ts` only checks that the
cookie **exists** (it does not verify the JWT) — without it every console route
307s to `/auth` and the page never compiles.

| Route | Before | After | Change |
|---|---|---|---|
| Ready (server boot) | 2.8–3.0s | 3.1s | ~same |
| `/contacts` | **13.1–13.2s** | **1.69s** | **~7.8x faster** |
| `/directs` | 2.4–2.8s | 1.77s | ~30% faster |
| `/orders` | 1.59–1.60s | 1.38s | ~13% faster |
| `/products` | 1.63–1.65s | 1.52s | ~7% faster |
| `/automations` | 2.1–2.2s | 2.1s | noise |
| `/auth`, `/auth/otp`, `/auth/password`, `/learn`, `/support`, `/install` | — | — | within ±5% (noise) |

**Nearly all of the win comes from deleting the two `import * as` namespace
imports, not from the deep-import rewrite.** `/contacts` renders
`ContactDetailsDialog` → `dialogStyled.tsx`, which was the file doing
`import * as Icons from '@phosphor-icons/react'`. That single namespace import
cost ~11.5s of compile on that route. `/contacts` was re-measured twice on the
baseline (13.2s, then 13.1s) to confirm it reproduces.

Routes that only ever imported *named* icons barely moved. That is the honest
result: `optimizePackageImports` plus deep imports are close to noise on their
own here, because Turbopack already only pulls the named bindings it needs. The
real killer was the namespace import, which defeats that entirely.

No tests were changed.

## Gotchas found while doing this
- **`motion` is not a newer `framer-motion`.** `motion/react` is literally
  `export * from 'framer-motion'` and `motion` *depends on* `framer-motion`.
  Consolidating onto `motion` would have added a wrapper, not removed a library —
  so the branch standardises on `framer-motion` and drops `motion` instead.
- **The `/dist/ssr` barrel is easy to miss.** It is a separate 1513-module barrel
  from the root one, and its internal imports are relative to `dist/ssr/`, so a
  naive codemod emits `dist/<Icon>` (which does not resolve) instead of
  `dist/ssr/<Icon>`.
- **Do not run `prettier --write` broadly on this repo right now.** Many files on
  `merged-admin` already fail `prettier --check` because of
  `prettier-plugin-tailwindcss` class-order drift (verified on
  `NavMain.tsx`/`NavBottom.tsx` at HEAD, with the repo config). Formatting the
  touched files added ~289 lines of unrelated class-reorder churn, so it was
  reverted; only import lines are changed here. A repo-wide reformat is worth
  doing, but as its own branch.

## Lesson for future work
If a route feels disproportionately slow to compile, **look for
`import * as X from '<big package>'` first.** A namespace import forces the whole
barrel into the graph and no bundler config can undo it —
`optimizePackageImports` and per-icon deep imports are both powerless against it.
Two such imports were responsible for essentially the entire measured win here,
while rewriting 116 named imports moved the needle by only a few percent. Both
were also avoidable: each was doing dynamic icon-lookup-by-name over a set that
was actually closed and statically known.

## Follow-ups (not applied)
- **`apps/admin` is now done too** (commit `5b84540a`): 19 barrel imports across
  18 files rewritten, plus `optimizePackageImports` in its `next.config.ts`.
  Admin had no namespace imports, so by the finding above the gain there is
  expected to be small; it was not separately timed.
- **Disk pressure.** `pnpm store prune` was run: 421 packages / 15530 files
  removed, store 13 GB → 12 GB, free space 8.8 GB → 9.9 GB. The disk is still at
  98%, which is worth attention on its own — Turbopack's cache in the main
  checkout had grown to 3.8 GB. Also reclaimable: `Front/apps/admin/.next`
  (277 MB), `Site/.next` (210 MB).
- **`packages/ui/src/components/ui-custom/phosphore-icons.ts`** is a 4-line
  re-export with no consumers — dead code, left in place.
- **`node_modules` is partly tracked in git** — `git ls-files` shows 51 files
  under `packages/ui/node_modules/` (committed in `240fe94f`). `pnpm install`
  rewrites 5 of those symlinks, so they show as modified after any install.
  Left uncommitted here; worth `git rm --cached`-ing on its own branch.
- Deps verified **still used, do not remove**: `react-icons` (2 uses, via the
  efficient `/fa6` and `/im` subpaths), `@emoji-mart/*` (2), `jalaliday` (1).
