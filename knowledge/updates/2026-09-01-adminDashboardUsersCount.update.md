# 2026-09-01 — Admin dashboard: users count metric

Full reference: `Back/knowledge/core/metrics/metrics.doc.md` §5.6 (paired backend change).

## Problem

The admin dashboard's platform-metrics widget (`(main)/_components/metrics-overview.tsx`)
showed 5 metrics but no users count, with no way to filter it by the dashboard's
date-range control.

## Solution

Added `users` as a 6th entry to `METRICS` in `metrics.constants.ts` (`type: 6`,
mirroring the backend's `USERS_METRIC_TYPE` sentinel — not a real CQRS `MetricType`).
Every consumer of `METRICS` (`MetricMultiSelect`, `MetricCard`, `MetricChart`/
`CombinedChart`, `CustomizationBar`'s templates, `PRESET_VIEWS`/`ALL_METRIC_TYPES`)
is already generic over that array, so the new card gets full parity — total,
period delta, and chart — with the existing 5 with no other code changes.

## Changes

- `app/(main)/_components/metrics.constants.ts`: `users` metric entry, `usersCount`
  totalsField.
- `hooks/use-platform-metrics.ts`: `PlatformTotals` type gains `usersCount`.
- `messages/fa.json`: `Dashboard.users` label ("کاربران").

## Verification

- `pnpm --filter admin exec tsc --noEmit`: no new errors traced to any touched
  file (repo-wide pre-existing baseline errors elsewhere — admin frontend has no
  general test runner, per `project_admin_frontend_tsc` memory).
- **Live browser smoke test skipped**: dev servers (Back admin :3002, Front admin
  :4102, both stopped again after) were started and ready, but there's no known
  password for the local dev super-admin account (`sina.pirani-xgi30q9399dsk35`) to
  log in with. Verify visually before merging.
