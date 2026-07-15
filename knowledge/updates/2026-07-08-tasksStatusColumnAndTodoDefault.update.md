# Tasks page: status column, default "todo" filter, SMS fix — 2026-07-08

Admin front `/tasks` page. Full page code:
`Front/apps/admin/src/app/(main)/tasks/`.

## Problem

- The tasks table did not show each task's status (`todo` / `done`) as a
  column. You could filter by status, but not see it per row.
- The status filter defaulted to "all", so the page opened showing every task.
  Admins mostly care about the not-done (`todo`) tasks first.

## Solution

- Added a **Status** column to the tasks table, right after the *Actions*
  column, rendering the existing `TaskListItem.status` as a `Badge`:
  - `done` → `success` (green) variant, text `filters.done` ("انجام شده").
  - `todo` → `secondary` variant, text `filters.todo` ("انجام نشده").
- Changed the status filter **default** from `''` (all) to `'todo'`, so the page
  opens showing only not-done tasks. The user can still switch to "done" / "all".

No backend change: `status` is already on the list item and `&status=` is already
a supported `/actions` query param. No new i18n keys: `columns.status`,
`filters.todo`, `filters.done` already exist in `apps/admin/src/messages/fa.json`.

## Changes

- `apps/admin/src/app/(main)/tasks/columns.tsx` — import `Badge`; add the
  `status` column (badge) after `actions`.
- `apps/admin/src/app/(main)/tasks/client-page.tsx` — `useState('')` →
  `useState('todo')` for `taskStatus`.

## Bug fix: SMS from the mobile column did not open

- **Problem:** In the mobile column, `ContactOptions` shows a "پیامک" item that
  calls `openSmsDialog?.(...)`. On `/tasks` that prop was never passed, so the
  click no-opened and the SMS dialog never opened — while `/leads` and
  `/customers` wire it up.
- **Fix:** Thread `openSmsDialog` through the tasks page, exactly like the
  working `customers/client-page.tsx` (recipient is a real user):
  - `client-page.tsx` — add `smsDialogOpen` / `smsData` state + `openSmsDialog`,
    pass it to `TasksTable`, render `<SendSMSDialog recipientType="user" />`.
  - `tasks-table.tsx` — accept `openSmsDialog` prop, forward it to `taskColumns`.
  - `columns.tsx` — accept `openSmsDialog` in opts, pass it to `ContactOptions`.
- `recipientType="user"` (not `marketingLead`): the mobile column passes
  `row.original.user.id`, so the SMS goes to the user — same as `/customers`.

## Verification

- `tsc` on the admin app: the only error on the touched files is the known
  app-wide `Badge` children `TS2322` (pre-existing, shared by 9 other files;
  `next build` uses `ignoreBuildErrors`). Our `<Badge>` usage matches the exact
  convention in e.g. `plans/columns.tsx`. No other errors on the three touched
  tasks files.
