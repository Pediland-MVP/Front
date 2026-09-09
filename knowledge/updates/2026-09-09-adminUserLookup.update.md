# Webhook test-event user picker → `/users/lookup` — 2026-09-09

Full reference: `Back/knowledge/updates/2026-09-09-adminUserLookup.update.md` and
`Back/knowledge/front-back-relations.md` (row *Admin webhook test-event dialog — user picker*).

## Problem

The user dropdown in the analytics-webhook **test-event dialog**
(`apps/admin/src/app/(main)/webhooks/test-event-dialog.tsx`) was very slow and often stuck on
"pending".

It fetched `GET /users?limit=20&page=1[&search=…]` — the same endpoint that powers the full
customers table. That endpoint defaults to `panelMode: 'pro'`, which on the backend aggregates
lead / session / order / subscription stats for **every** matching user and only paginates
afterwards, then runs four more queries. The dialog needs none of it: `UserOption` declares just
`id`, `firstname`, `lastname`, `mobile`.

## Solution

Point the picker at the new lightweight `GET /users/lookup?limit&page&search`, which returns the
same `{ items, meta }` shape with only those four fields.

One line changed, plus a comment recording *why* it must not drift back to `/users`.

## Changes

- `apps/admin/src/app/(main)/webhooks/test-event-dialog.tsx` — the `useSWR` key becomes
  `/users/lookup?…`. Response type, `usersLoading`, the `useMemo` over `items` and the rendered
  options are all unchanged, because the response shape is unchanged.

No i18n keys, no new error codes, no component or type changes.

## Verification

- `pnpm --filter admin exec tsc --noEmit` → **120 errors, byte-identical to the `origin/main`
  baseline** (verified by re-running with the change stashed), including the one pre-existing
  `Badge` error that already lives inside this file. This change adds none.
- The admin frontend has no test runner, so there is no unit test to add here; the behaviour is
  covered by the backend's 10 `lookupUsers` tests.
- **Not exercised in a browser.** No dev server was run and the dialog was not clicked through.

## Deploy note

**Deploy-coupled**: the Back `feat/admin-user-lookup` branch must ship first or with this, or the
picker 404s.
