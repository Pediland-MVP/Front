# Task done-note + completion metadata UI (2026-07-08)

> Full reference: `docs/superpowers/specs/2026-07-08-task-done-note-and-completion-metadata-design.md`
> Backend side: `Back/knowledge/updates/2026-07-08-taskDoneNoteAndCompletionMeta.update.md`

Shared component: `apps/admin/src/components/tasks/task-management-panel.tsx`
(`TaskManagementPanel`), used by both the `/tasks` drawer
(`apps/admin/src/app/(main)/tasks/task-drawer.tsx`) and the customer timeline
(`apps/admin/src/app/(main)/customers/[id]/page.tsx`).

## Problem

- Marking a task "done" was a plain checkbox toggle. There was no way for the
  admin to leave a short note saying **how** the task was closed (e.g. "called,
  customer will pay next week").
- The task list showed only the task **assignee**. It did not show who
  **created** the task or who actually **marked it done** — useful when a task
  gets handed from one admin/KAM to another.
- The task list had no visible "done date" / "done by" info, so an admin
  reopening an old done task had no way to see its completion history.

## Solution

- Checking the "done" checkbox now opens a confirm dialog with an optional
  note field (`doneNoteLabel` / `doneNotePlaceholder` / `markDoneTitle` /
  `confirm` / `cancel` under `Tasks.panel` i18n keys). Confirming sends
  `POST /actions/status/:id` with `{ status: 'done', doneNote? }` — the note
  is only included if the admin typed something (trimmed, non-empty).
  Un-checking (marking a task back to `todo`) skips the dialog and sends
  `{ status: 'todo' }` directly, same as before.
- The panel now reads `createdByAdmin`, `doneByAdmin`, `doneNote`, and
  `doneDate` from each `Action` item returned by
  `GET /actions/user/:userId` (already updated in `apps/admin/src/types/actions.ts`):
  - Header line: "Created by" now uses `action.createdByAdmin ?? action.admin`
    (falls back to the assignee if the task predates this feature and has no
    `createdByAdmin`).
  - For **done** tasks only, a footer block shows Done date
    (`formatTaskDate(action.doneDate)`), Done by
    (`doneByAdmin.firstname/lastname`), and Done note (`doneNote`) — each line
    renders only if that field is present.
- The backend now returns the list ordered `createDate DESC` (newest task
  first). The frontend keeps its existing client-side sort by `createDate` as
  a safety net — no frontend change was needed there, it already sorted the
  same way.

## Changes

- `apps/admin/src/types/actions.ts` — `Action` gained `doneNote?`,
  `createdByAdmin?`, `doneByAdmin?` (all optional/nullable, `AdminRef` shape).
- `apps/admin/src/messages/fa.json` — new keys under
  `Tasks.panel`: `markDoneTitle`, `doneNoteLabel`, `doneNotePlaceholder`,
  `confirm`, `cancel`, `doneDateLabel`, `doneBy`, `doneNoteShown`. (`en.json`
  was not touched — English translations get added later, per convention.)
- `apps/admin/src/components/tasks/task-management-panel.tsx`:
  - Added `doneTarget` / `doneNote` local state and a confirm `Dialog`
    (shadcn `Dialog` + `Textarea`) shown when checking a task done.
  - `handleStatusChange` now branches: checked → open the dialog
    (`setDoneTarget`), unchecked → call `setTodo` directly (unchanged path).
  - `confirmDone` — the new handler that calls
    `POST /actions/status/:id` with the optional `doneNote`.
  - Header "Created by" now reads `action.createdByAdmin ?? action.admin`.
  - New done-only block rendering `doneDate` / `doneByAdmin` / `doneNote`.
- `Front/knowledge/front-back-relations.md` — documented the changed
  `POST /actions/status/:id` body and the enriched/ordered
  `GET /actions/user/:userId` response.

## Verification

- Feature code (`task-management-panel.tsx`, `actions.ts` types, i18n keys)
  was already implemented and committed on `merged-admin` in prior commits
  (`d34bb100`, `acad2bd1`, `1204d49e`, `c3a867e3`); this update is docs-only.
- Read `task-management-panel.tsx` end to end and checked the doc claims
  against the actual code: the `doneNote` conditional in `confirmDone`, the
  `handleStatusChange` branch (dialog only on check, direct `setTodo` on
  uncheck), the `createdByAdmin ?? action.admin` fallback, and the
  `isDone && (...)` block for `doneDate`/`doneByAdmin`/`doneNote` all match
  what is documented above.
- Confirmed `apps/admin/src/types/actions.ts` has the three new optional
  fields on `Action` matching what the panel reads.
