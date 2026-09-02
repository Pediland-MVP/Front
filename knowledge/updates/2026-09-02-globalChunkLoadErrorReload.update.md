# 2026-09-02 — Auto-reload on stale chunk load error (dashboard root)

Sentry issue: `MY-8` — https://befroosh.sentry.io/issues/85366692/

## Problem

`Error: Failed to load chunk /_next/static/chunks/<hash>.js from module <id>`
fired 407 times / 75 users since 2025-12-28, culprit `/`. Users hit a dead
error page instead of the app.

## Root cause

`global-error.tsx` is the only error boundary above the root layout (no
`app/error.tsx` exists), and it just called `Sentry.captureException` — no
recovery. A browser tab left open across a deploy still references the old
build's chunk file names. Once the previous build's static files are gone from
the CDN, the next dynamic-import/navigation 404s on that chunk and Next/webpack
throws this specific error. It's a stale-client problem, not a real bug: a
fresh page load (new HTML → new chunk manifest) fixes it.

## Solution

In `global-error.tsx`, detect the chunk-load error by name/message and, on
first occurrence per tab session, call `window.location.reload()` instead of
just showing the error page. A `sessionStorage` timestamp guard (10s window)
stops a genuinely broken/offline client from reload-looping. Still call
`Sentry.captureException` either way, tagged `chunkLoadAutoReload` so we can
tell in Sentry whether the auto-reload fired.

## Changes

- `apps/dashboard/src/app/global-error.tsx`: added `isChunkLoadError` /
  `reloadOnceForChunkError`, wired into the existing `useEffect`.
- `apps/dashboard/src/app/__tests__/global-error.test.tsx`: new — covers
  reload-on-chunk-error, guard-window skip on repeat, and no-reload for a
  non-chunk error.

## Verification

- `pnpm --filter front exec tsc --noEmit`: no new errors in either touched
  file (pre-existing repo-wide baseline errors elsewhere, unrelated).
- `eslint src/app/global-error.tsx src/app/__tests__/global-error.test.tsx`:
  clean.
- `vitest run src/app/__tests__/global-error.test.tsx`: 3/3 pass.
- Built on branch `fix/chunk-load-error-reload` in worktree
  `Front/worktrees/chunk-load-error-reload`, not merged/deployed yet.
- Not manually reproduced in a browser (requires a real stale-chunk 404 —
  a new deploy replacing an already-loaded tab's chunk hashes — hard to
  simulate locally); covered instead by the unit test above.
