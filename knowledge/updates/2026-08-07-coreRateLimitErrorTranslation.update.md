# TOO_MANY_REQUESTS Error Translation (2026-08-07)

Branch `feat/core-rate-limit` (worktree `Front/worktrees/core-rate-limit`), off
`merged-admin`. Paired with the Back branch of the same name
(`Back/knowledge/updates/2026-08-07-coreRateLimit.update.md`), which adds a global
per-IP rate limit to `core` and starts returning `429` responses shaped as
`{ code: 'TOO_MANY_REQUESTS', ... }`.

## Problem

`core`'s new 429 responses carry `code: 'TOO_MANY_REQUESTS'`, but no matching
translation key existed, so `t_ec('TOO_MANY_REQUESTS')` would return the raw key
instead of readable Persian text (per CLAUDE.md §10, callers fall back to
`errorMessage.message`, so this degrades gracefully — not a hard blocker — but should
ship together).

## Solution

Originally added `TOO_MANY_REQUESTS` under `ERROR_CODES` in
`apps/dashboard/src/messages/fa.json`. `apps/admin` was not touched — it talks to the
separate `admin` NestJS app, not `core`, so it never sees this error code.

**2026-08-26 fix — the key above was dead on arrival.** `apps/dashboard/src/i18n/request.ts`
builds the runtime message bag as
`{...fa.json, ...fa/Auth.json, ...fa/ErrorCodes.json, ...fa/Console.json}` — each spread
replaces the *entire* `ERROR_CODES` object (no deep merge), so `fa/ErrorCodes.json`'s
`ERROR_CODES` always wins over `fa.json`'s. `fa/ErrorCodes.json` already had its own
`TOO_MANY_REQUESTS` key (a leftover: `"بین هر درخواست کد باید 2 دقیقه فاصله باشد."` —
"must wait 2 minutes between code requests"), so every real 429 from the new global
limiter rendered that stale, unrelated OTP-cooldown message instead. Verified live: the
resolved messages baked into the SSR payload showed the stale string, confirmed via
browser JS reading the inline script's embedded translations.

Grepped the whole `Back` codebase for producers of `code: 'TOO_MANY_REQUESTS'` — only
`AppThrottlerGuard` throws it; the pre-existing OTP-send cooldown
(`otpService.checkRateLimit`) throws a bare `HttpException('You can request otp again in
2 min', 429)` with no `code` field at all, so `fa/ErrorCodes.json`'s old string was never
actually reachable for its original purpose either — replacing its value carries no
regression risk.

Fix: moved the new message into `apps/dashboard/src/messages/fa/ErrorCodes.json` (the
file that actually wins) and removed the now-fully-dead duplicate from `fa.json`. Two
other pre-existing keys in `fa.json`'s `ERROR_CODES`
(`POST_SCOPED_AUTOMATION_REQUIRES_SINGLE_INSTAGRAM`, `UPLOAD_SOURCE_IS_NOT_AN_IMAGE`) are
shadowed by the same bug but predate this PR — left untouched, out of scope here.

## Changes

- `apps/dashboard/src/messages/fa/ErrorCodes.json` — `TOO_MANY_REQUESTS` value replaced
  with the rate-limit message.
- `apps/dashboard/src/messages/fa.json` — the now-dead duplicate `TOO_MANY_REQUESTS` key
  removed from `ERROR_CODES`.

## Verification

- `python3 -c "import json; json.load(...)"` confirms both files are still valid JSON.
- Live browser check against a running `core` + `dashboard` (isolated test DB, see Back's
  update doc): triggered a real 429 from the authenticated session, read the SSR payload's
  embedded translations directly — confirmed the resolved `ERROR_CODES.TOO_MANY_REQUESTS`
  now matches the rate-limit message, not the old OTP-cooldown one.
- No test suite covers translation files in this repo; not applicable.

Back pairing doc: `Back/knowledge/updates/2026-08-07-coreRateLimit.update.md`.
