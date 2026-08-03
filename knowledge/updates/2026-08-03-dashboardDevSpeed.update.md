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

## Changes
- `apps/dashboard/next.config.mjs` — added the `experimental.optimizePackageImports` block.
- `apps/dashboard/src/instrumentation-client.ts` — `isProd` guard; replay + tracing + logs off in dev.
- `apps/dashboard/sentry.server.config.ts` — `isProd` guard; tracing + logs off in dev.
- `apps/dashboard/sentry.edge.config.ts` — `isProd` guard; tracing + logs off in dev.

## Verification
**Not yet measured.** Worktrees carry no `node_modules`, so timing this needs a
`pnpm install` inside the worktree, or applying the diff in the main checkout.
The intended check is to compare cold-start and HMR times before/after, plus the
resulting `.next` size.

No tests were changed — these are config-only edits with no runtime behaviour
change in production.

## Follow-ups (not applied)
- **Deep-import codemod.** Rewrite `@phosphor-icons/react` →
  `@phosphor-icons/react/dist/csr/<Icon>` across the 119 sites. This is the
  guaranteed fix if `optimizePackageImports` underdelivers: Phosphor's barrel
  re-exports through renamed aliases plus an `import * as` of the SSR barrel,
  which may defeat Next's barrel optimizer.
- **Drop unused deps.** Zero imports across `apps/dashboard/src`,
  `apps/dashboard/e2e` and `packages/ui/src`: `@vidstack/react`, `draft-js`,
  `moment-jalaali` (+ `@types/moment-jalaali`), `date-fns-jalali`,
  `jalaali-react-date-picker`, `log4js` (+ `log4js-json-layout`), `jotai`.
  Also consolidate `framer-motion` (13 uses) onto `motion` (1 use) — two
  generations of the same library are installed.
  Verified **still used, do not remove**: `react-icons` (2 uses, via the
  efficient `/fa6` and `/im` subpaths), `@emoji-mart/*` (2), `jalaliday` (1).
- **Disk pressure.** The disk sits at 98% (9 GB free after the 5.2 GB reclaim)
  and the pnpm store is 13 GB. Low free space makes Turbopack's multi-GB cache
  writes thrash, so `pnpm store prune` is worth running.
