# 2026-08-23 — /connect no longer treats a token relogin as "add another Instagram"

Branch: `fix/instagram-reconnect-redirect` (worktree, off `main`). Backend counterpart:
`Back/knowledge/updates/2026-08-23-instagramReconnectRedirect.update.md`.

## Problem

Every "relogin" surface for an expired Instagram token — the invalid-token banner
(`InstagramInvalid.tsx`, shown on the subscription page) and the settings reconnect dialog
(`InstagramReconnectDialog.tsx`) — sends the user through Instagram OAuth with
`redirect_uri=<backend>/instagram/redirectToFrontend`. That backend route always redirects the
browser to `/connect?code=...`, with no way to tell a token refresh apart from a brand-new
connect.

`/connect`'s own UI only asks "does this workspace have any Instagram accounts, and how many"
(`useAddInstagramGate`, `atInstagramLimit`) — logic built purely for "add another account". So a
relogin landing on `/connect` could show:
- "شما به حداکثر تعداد ۵ اکانت اینستاگرام رسیده‌اید" (instagram limit) if the expired account
  itself already fills the 5-account cap (it's still counted — it isn't deleted, just invalid).
- "تنظیم اشتراک برای اتصال اکانت جدید" (setup second instagram CTA + paid-plan wizard) if the
  workspace's subscription slot is already consumed by the very account being reconnected.

The code is still submitted in the background (`useEffect` → `callbackIG`) and the backend
already special-cases a reconnect past the account limit, so the reconnect usually still
succeeds — but the visible UI told the user they were adding a second account the whole time.

## Solution

- `redirectToFrontend` (backend) now accepts an optional `state` query param and forwards
  `reconnect=1` to `/connect` when it equals the literal `'reconnect'` — see the paired Back doc.
- `utils/instagramOAuthUrl.ts`: added `IG_RECONNECT_OAUTH_URL` (`IG_OAUTH_URL` + `&state=reconnect`).
- `InstagramReconnectDialog.tsx` and `InstagramInvalid.tsx`: both relogin buttons (and the
  reconnect dialog's "copy link" button) now build their URL from `IG_RECONNECT_OAUTH_URL`
  instead of a hand-rolled string, so the two can't drift from each other or from the shared
  reconnect flag.
- `connect/page.tsx`: reads `reconnect=1` from the URL. When present alongside a `code` (i.e. a
  reconnect round-trip is actually in flight), the page shows a plain "در حال تمدید اتصال اکانت
  اینستاگرام شما ..." spinner state instead of the instagram-limit/permission/setup-dialog gates.
  Falls back to the normal gates if `reconnect=1` shows up without a `code` (defensive — should
  not happen in practice). The `hasInstagram && <back_to_home>` button below stays visible either
  way, so a failed reconnect never traps the user on the page.
- `fa.json`: new `Connect.reconnecting_account` key.

## Changes

- `src/utils/instagramOAuthUrl.ts` — new `IG_RECONNECT_OAUTH_URL` export.
- `src/components/Settings/InstagramReconnectDialog.tsx` — uses the shared reconnect URL for both
  the relogin button and the manual copy-link button; removed the now-redundant local
  `API_URL`/`INSTAGRAM_CLIENT_ID`/`MANUAL_CONNECT_LINK`.
- `src/components/Console/InstagramInvalid.tsx` — uses the shared reconnect URL; removed the local
  `API_URL`/`INSTAGRAM_CLIENT_ID` consts.
- `src/app/(Connect)/connect/page.tsx` — `isReconnect` derived from `searchParams`; new top-priority
  branch in the button-area render.
- `src/app/(Connect)/connect/page.test.tsx` — 4 new tests (`ConnectPage — reconnect mode`).
- `src/messages/fa.json` — new `Connect.reconnecting_account` key (`en.json` left for later, per
  the project's i18n convention).

## Verification

- `pnpm --filter front exec tsc --noEmit`: zero errors in any touched file (pre-existing app-wide
  baseline errors, unrelated to this change, still present elsewhere — confirmed by grepping the
  output for the touched file names).
- `npx vitest run "src/app/(Connect)/connect/page.test.tsx"`: 11/11 pass (7 pre-existing + 4 new).
- `npx vitest run "src/components/Connect/SetupInstagramDialog.test.tsx"`: 20/20 pass (also
  references the OAuth URL util; confirms no drift from the new export).
- Mutation-checked: forcing `isReconnect = false` fails exactly the 2 new tests that assert the
  reconnecting message replaces the limit/setup-CTA gates, and nothing else — confirms the new
  tests actually guard this fix.
- Not browser-smoke-tested (would need a real Instagram OAuth round-trip with an already-expired
  token, which needs a live account and is deploy-coupled with the Back worktree above).
