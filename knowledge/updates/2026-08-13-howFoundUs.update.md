# How-Found-Us dialog + admin filter (frontend) — 2026-08-13

Full design: `docs/superpowers/specs/2026-08-13-howFoundUs-design.md` (outer repo)
Plan: `docs/superpowers/plans/2026-08-13-howFoundUs.md` (outer repo)
Backend side: `Back/knowledge/updates/2026-08-13-howFoundUs.update.md`

Branch `feat/how-found-us` (worktree `Front/worktrees/how-found-us`, off `merged-admin`).

## Problem

We needed to ask each user «چطور با بفروش آشنا شدید؟» exactly once, without hurting
signup conversion and without relying on anyone visiting `/settings/profile`.

## Solution

Ask on the way into creating an automation — the user is already committed at that point,
so a one-question dialog is acceptable. The dialog appears only while the field is empty,
and never again once answered. It is deliberately **absent** from `/settings/profile`.

Admins get the answer as a users-list filter, an excel-export column, and a read-only row
on the user detail page.

## Changes

### dashboard

- `src/constants/howFoundUs.constant.ts` — `HOW_FOUND_US_ENUM` + ordered
  `HOW_FOUND_US_VALUES`, mirroring the backend enum. Persian labels live in `fa.json`.
- `src/lib/stores/useBusinessInfoGateStore.ts` — zustand store
  `{ isOpen, pendingHref, open(href), close() }`. `pendingHref` is where to continue once
  the answer is saved.
- `src/hooks/useBusinessInfoGate.ts` — `{ needsBusinessInfo, startAutomationCreate(href) }`.
  **A half-loaded or errored `/users/me` never gates** — the user goes straight through.
  Blocking on an answer we do not have would trap them for a reason that is our fault, and
  the only cost of guessing wrong is asking on their next create.
- `src/components/Console/BusinessInfoDialog.tsx` — mounted once in `(Console)/layout.tsx`
  beside `WorkspaceCategoryGuard`. **Closable on purpose**, unlike that guard: a workspace
  without a category is broken, whereas here the user has not committed to creating
  anything yet.
- `src/types/user.ts` — `howFoundUs: HOW_FOUND_US_ENUM | null` on `GET /users/me`.
- `src/messages/fa.json` — new `Automations.BusinessInfo` namespace (title, description,
  label, placeholder, save, saving, error, and one key per option). `en.json` later.

**SWR gotcha worth remembering:** `useUser` keys `GET /users/me` as `'/users/me'` while
`ProfileForm` keys it as `` `${API_URL}/users/me` `` — two cache entries for one endpoint,
pre-existing. The dialog mutates **both** after saving; revalidating only one leaves the
gate reading a stale `null` and re-firing on the next create.

**All six create entry points** now call `startAutomationCreate` instead of navigating:

| File | Entry point |
|---|---|
| `app/(Console)/automations/page.tsx` | header افزودن button |
| `components/Console/Dashboard/DashboardStats.tsx` | dashboard card |
| `components/Automations/contentCycleTable.wizard.tsx` | empty-state CTA (needed `'use client'`) |
| `components/Layout/NavBottom.tsx` | mobile bottom-nav `+` (new `gated` flag on the nav items) |
| `components/Automations/CreateAutomationTemplateDialog.tsx` | template pick + "start from scratch" |
| `components/Automations/AutomationCard.tsx` | duplicate automation |

For the `<Link>`-based ones the real `href` stays and `onClick` calls `preventDefault()`
only when the gate must open, so right-click / open-in-new-tab keep working. A middle-click
still slips past — true of any client-side gate, and acceptable for a data-quality prompt.

`NavBottom`'s `gated` flag is spelled out as `false` on the other items too, so the
inferred array element type stays uniform and `item.gated` is always safe to read.

### admin

- `src/constants/howFoundUs.constant.ts` — same enum, duplicated per app (the two Next.js
  apps are separate builds with no shared constants package, same as `p2eNumber`).
- `src/components/table/filter-how-found-us.tsx` — multi-select shaped after
  `filter-category.tsx`, but the options are a fixed enum rather than a fetched list.
- `users/client-page.tsx` + `users/customer-table.tsx` — `howFoundUs` state lifted like
  `categories`, appended to the query as `&howFoundUs=a,b`, and spread into the
  `POST /users/excelExport` body so the export matches what the admin is looking at.
- `users/[id]/page.tsx` — read-only row in the profile sidebar, above the subscription
  card. Renders `ندارد` when null.
- `src/messages/fa.json` — new `Users` namespace.

## Verification

- `useBusinessInfoGate.test.ts` — 4 cases: set → navigate, empty → open with the href,
  loading → navigate, errored → navigate.
- `BusinessInfoDialog.test.tsx` — 4 cases: closed renders nothing; save posts, revalidates
  both SWR keys and continues to `pendingHref`; a failed save keeps the dialog open, toasts
  and does not navigate; the button is disabled with nothing chosen.
  Radix `Select` never opens under jsdom, so the test swaps in a native `<select>` — the
  repo's other Select tests sidestep it the same way.
- `automations/page.test.tsx` rewritten: it used to assert a direct
  `push('/automations/add')`; now it asserts the gate is asked **and** that `push` is never
  called. `CreateAutomationTemplateDialog.test.tsx` likewise — its blanket `swr` mock would
  otherwise feed the real hook's `useUser` a bogus shape, so it mocks the gate.
- Full dashboard suite: **33 files / 193 tests green.**
- `filter-how-found-us.test.tsx` — 4 cases. Needed `ResizeObserver` and pointer-capture
  stubs; jsdom implements neither and Radix Popover wants both.
- Admin suite: 2 pre-existing `TemplateForm` failures, confirmed identical on the untouched
  `merged-admin` checkout.
- `tsc --noEmit`: no new errors. The admin app shows ~18 extra `TS2769` (zod v3/v4
  `zodResolver` overloads) versus the main checkout, spread across 16 files nobody touched
  — a fresh-worktree `node_modules` artifact. Proven by stashing: **168** errors with the
  changes stashed vs **135** with them applied.

## Not done

- The field is not on `/settings/profile` and must not be added there.
- No free-text input for «سایر».
- `en.json` untranslated (per convention).

## Pre-existing issues found on this branch — now fixed

Both were spotted while doing the work above and fixed in a follow-up commit on the same
branch (`fix(admin-fe): drop duplicate Jobs key and untrack pnpm node_modules symlinks`).

- **Duplicate top-level `Jobs` key in `apps/admin/src/messages/fa.json`** (lines 125 and
  1449). JSON keeps the last one, so the first 53-line block was dead — no lookup ever
  reached it. The two blocks were byte-identical (23 keys each, same values), so deleting
  the dead one leaves the parsed messages exactly the same; verified by diffing the parsed
  objects before and after. Only the position of `Jobs` in the key order moved, which is
  not semantically meaningful.
  **The trap this left is worth remembering:** editing that file by round-tripping it
  through a JSON parser silently collapses the duplicate and takes ~50 unrelated lines
  with it. It happened during this work and had to be reverted. Edit message files as
  text, or check for duplicate keys first with an `object_pairs_hook`.
- **51 tracked entries under `packages/ui/node_modules`** (47 pnpm symlinks + 4 `.bin`
  shims). They point into content-hashed `node_modules/.pnpm/<hash>` paths, so they are
  broken on a fresh clone, regenerated by `pnpm install`, and rewritten by any dependency
  bump — which is why every worktree showed them as modified. `.gitignore` already listed
  the directory; gitignore simply does not apply to files already in the index. Removed
  with `git rm -r --cached`, so nothing left the disk. The Back repo was already clean.

A third, larger one — `@ValidateIf(validateIfString)` never running, disabling 38
validators across 8 core DTOs — is recorded on the backend side in
`Back/knowledge/updates/2026-08-13-validateIfStringSignature.update.md`.
