# Dashboard stuck on the loading spinner — 2026-09-11

Reference code: `apps/dashboard/src/hooks/swr/api-client.tsx`, `apps/dashboard/src/utils/chunkReload.ts`,
`apps/dashboard/src/components/Providers/AuthProvider.tsx`, `apps/dashboard/src/app/global-error.tsx`.
Supersedes `2026-09-02-globalChunkLoadErrorReload.update.md` (that commit is included, then reworked).

## Problem

Some users never got past the full-screen spinner on `my.befroosh.app`.

- `AuthProvider` starts with `isAllowed=false`, so the **server HTML of every Console/Auth/Connect page
  is only the spinner**. It clears only after ~33 JS chunks load, React hydrates, and `/users/me`
  resolves.
- **No timeout, no retry.** The axios client had no timeout and SWR runs with
  `shouldRetryOnError:false`, so a hung `/users/me` kept the spinner up until the browser gave up.
  Sentry (7 days): `/users/me` never finished for 635 calls / **443 users**, failed at network level
  for 135 calls / 103 users.
- **Three serial round trips on every hard load.** The access token lives in memory only, so each full
  load did `/users/me` → 401 → `/auth/refresh-token` → `/users/me` (6,173 × 401 vs 6,377 refreshes
  in 7 days).
- **Chunk downloads fail with no recovery** (Sentry `MY-8`, 69 users). Every chunk named in the last
  14 days exists in the live build and is a Cloudflare cache HIT, so these are user-side network drops,
  not stale deploys. Worse: Turbopack's runtime only attaches an `error` listener to `<script>` tags
  already in the page, so a script that failed before that leaves its chunk promise pending forever —
  spinner forever, nothing in Sentry.
- A `timeout`/`ECONNABORTED` on `/users/me` was not treated as a network error, so AuthProvider routed
  on a missing user and bounced to `/connect`.

## Solution

1. **Reads time out and retry transient failures** (`fetcher`): 20s timeout; up to 2 retries (1s, 3s)
   only for no-response errors (`ERR_NETWORK`, `ECONNABORTED`, `ETIMEDOUT`) and 502/503/504. A 4xx or
   500 is returned at once. Direct `api.post/get` calls (uploads) keep no timeout. The refresh call
   has its own 20s timeout.
2. **Session bootstrap**: when there is no access token, the first request refreshes up front and
   concurrent requests share that one refresh (single-flight `refreshAccessToken`). Runs at most once
   per page load; a failed bootstrap falls back to the old 401 → refresh → retry path. **Opt-in** —
   `AuthProvider` calls `enableSessionBootstrap()` — because the `(Shop)` checkout renders without
   AuthProvider and must never get a logged-in merchant's token. A caller-set `Authorization` header is
   never replaced and never triggers a refresh. A 401 that comes back after another refresh already
   finished is resent with the new token instead of refreshing again.
3. **AuthProvider** treats `ECONNABORTED`/`ETIMEDOUT` like `ERR_NETWORK` (→ `/not-found?status=network`).
4. **Chunk-load recovery** (`utils/chunkReload.ts`): an inline `<head>` script, rendered by the root
   layout before any chunk, reloads the page when one of our `/_next/static/chunks/` scripts or
   stylesheets fails to load, or on an unhandled chunk-load rejection. `global-error.tsx` reloads
   through the same function. Loop guard: at most 2 reloads per 60s per tab (sessionStorage; no
   storage → no reload). Third-party scripts, fonts and preload hints are ignored. The reason is
   reported to Sentry on the next load (`instrumentation-client.ts`, message "Chunk load auto-reload").
5. **No-JS fallback**: the server-rendered spinner has a plain link back to the same URL, hidden by
   pure CSS (`.reveal-after-delay` in `globals.css`) for 15s, so a user whose JS never ran can still
   reload. Label `Error.reload_page` (`fa.json`), passed from the server layouts because AuthProvider
   renders above `NextIntlClientProvider`.

Paired infra change (not in this repo): prod nginx `mybefroosh.conf` gives `/_next/image` and
`/monitoring` their own upstream with `max_fails=0`, so slow image resizes can no longer mark both
dashboard containers dead and 502 every page (2026-09-09 and 2026-09-10 bursts).

## Changes

- `src/hooks/swr/api-client.tsx` — timeouts, fetcher retry, single-flight refresh, session bootstrap,
  caller-auth respect. All previous exports kept.
- `src/utils/chunkReload.ts` (new) — inline script, `isChunkLoadError`, `reloadForChunkError`,
  `takeChunkReloadReason`.
- `src/app/layout.tsx` — inline script in `<head>`.
- `src/app/global-error.tsx` — uses the shared helper.
- `src/instrumentation-client.ts` — reports the previous auto-reload.
- `src/components/Providers/AuthProvider.tsx` — `reloadLabel` prop + link, bootstrap switch, timeout codes.
- `src/app/(Console)/layout.tsx`, `(Auth)/layout.tsx`, `(Connect)/connect/layout.tsx` — pass `reloadLabel`.
- `src/styles/globals.css` — `.reveal-after-delay`.
- `src/messages/fa.json` — `Error.reload_page`.

## Verification

- `vitest`: `api-client.test.ts` (16, new), `chunkReload.test.ts` (18, new — runs the exact inlined
  script string in jsdom), `global-error.test.tsx` (4), `AuthProvider.test.tsx` (16, 6 new) — 54 pass.
- `tsc --noEmit`: no errors in touched files (app-wide pre-existing errors elsewhere unchanged).
- `eslint` on touched files: 0 errors.
- **Not yet verified in a real browser** (needs a running dashboard: block a chunk with Playwright
  `page.route` and confirm the reload; hang `/users/me` and confirm the network page).
