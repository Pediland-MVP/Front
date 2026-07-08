# Cron Job Management — Admin `/jobs` Page (2026-07-08)

> Full reference: `Back/knowledge/updates/2026-07-08-cronjobManagement.update.md` (backend
> side) and `docs/superpowers/specs/2026-07-08-cronjob-management-design.md` (design spec) in
> the outer repo.

## Problem

Backend cron jobs (12 total, across the `core` and `admin` NestJS apps) had no operational
surface. Operators could not see when a job last ran, whether it succeeded, when it runs
next, or trigger a job on demand — they had to ask an engineer to check logs or restart a
process.

## Solution

Added a super-admin-only **`/jobs`** page to the admin dashboard that lists every backend
cron job and lets a super-admin trigger any of them by click.

- `client-page.tsx` gates the whole page to non-`kam` users (`notFound()` for `KAM`) and
  fetches `GET /jobs` via `useSWR` with a 15-second `refreshInterval`, so a triggered job's
  status flips from `running` to `success`/`failed` in the table without a manual refresh.
- `jobs-table.tsx` renders one row per job: name + description, app badge (`core`/`admin`),
  cron schedule (+ a "prod only" note when set), next run and last run in jalali date/time,
  a colored status badge (`success`/`failed`/`skipped`/`running`), and a **Run now** button.
- **Run now** calls `POST /jobs/:name/run`; on success it toasts and re-fetches (`mutate()`);
  on failure it maps the backend's error `code` through `t_ec` (`ERROR_CODES` namespace),
  falling back to a generic message.
- The sidebar gained a **کران‌جاب‌ها** (cron jobs) nav entry, gated the same way as the page
  (`user?.role !== 'kam'`).
- All page text is i18n — new `"Jobs"` namespace in `fa.json` (title, column headers, button/
  status labels), plus `"Sidebar.jobs"` and `"ERROR_CODES.JOB_NOT_FOUND"`.

## Changes

- `apps/admin/src/app/(main)/jobs/page.tsx` — server entry, renders the client page.
- `apps/admin/src/app/(main)/jobs/client-page.tsx` — super-admin gate + `useSWR('/jobs', ...)`
  polling every 15s.
- `apps/admin/src/app/(main)/jobs/jobs-table.tsx` — the table itself: columns, status badges,
  **Run now** action (`POST /jobs/:name/run`), toasts.
- `apps/admin/src/messages/fa.json` — `"Jobs"` namespace (title, `colJob`/`colApp`/
  `colSchedule`/`colNextRun`/`colLastRun`/`colStatus`/`colAction`, `runNow`/`running`/
  `runTriggered`/`runError`/`prodOnly`, `status_running`/`status_success`/`status_failed`/
  `status_skipped`), `"Sidebar.jobs"`, and `"ERROR_CODES.JOB_NOT_FOUND"`.
- `apps/admin/src/components/app-sidebar.tsx` — added the `/jobs` nav entry, gated to
  `role !== 'kam'`.

### Backend endpoints consumed (admin app, super-admin only)

| Endpoint | Response | Notes |
|---|---|---|
| `GET /jobs` | `PaginatedResult<JobView[]>` | All 12 catalog jobs with computed `nextRunAt` (via `cron-parser`) and the latest `job_run` row per job (status/times/`rowsAffected`/`error`). |
| `POST /jobs/:name/run` | `ResponseMessage` code `JOB_RUN_TRIGGERED`, data `{ mode: 'local' \| 'queued' }` | Runs an admin-owned job in-process, or enqueues a core-owned job onto the shared `coreOps` queue for `core` to run. Unknown `name` → 400 `JOB_NOT_FOUND`. |

See `Back/knowledge/front-back-relations.md` for the full mapping and
`Back/knowledge/updates/2026-07-08-cronjobManagement.update.md` for the backend architecture.

## Verification

- `pnpm --filter admin lint` and `pnpm --filter admin build` succeed with the new page,
  i18n keys, and sidebar entry wired in.
- Manual full-stack check: as a super-admin, `/jobs` lists all 12 jobs with schedule/next-run;
  **Run now** on both an admin job (`metrics.reconcile`) and a core job (`orders.expire`)
  toasts success and the row's status updates to `success` within the 15s refresh window.
  As a `KAM`, the page 404s and the sidebar entry is hidden.
