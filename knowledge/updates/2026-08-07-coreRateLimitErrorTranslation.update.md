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

Added `TOO_MANY_REQUESTS` under `ERROR_CODES` in
`apps/dashboard/src/messages/fa.json`. `apps/admin` was not touched — it talks to the
separate `admin` NestJS app, not `core`, so it never sees this error code.

## Changes

- `apps/dashboard/src/messages/fa.json` — one new key under `ERROR_CODES`.

## Verification

- `node -e "JSON.parse(...)"` confirms the file is still valid JSON.
- No test suite covers translation files in this repo; not applicable.

Back pairing doc: `Back/knowledge/updates/2026-08-07-coreRateLimit.update.md`.
