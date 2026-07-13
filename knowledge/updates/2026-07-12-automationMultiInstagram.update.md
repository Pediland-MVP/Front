# Automation Multi-Instagram (Dashboard) — 2026-07-12

> Backend side: `Back/knowledge/updates/2026-07-12-automationWorkspaceOwnership.update.md`
> Backend reference: `Back/knowledge/core/contentCycle/contentCycle.doc.md`
> `front-back-relations.md`'s "Automations (Content Cycles)" section was already fully rewritten in the prior task (commit `1b86249d`, same branch) — not touched again here.

Branch `feat/automation-ownership`, HEAD `1b86249d` (7 commits on `apps/dashboard`, all reviewed and approved).

## Problem

The backend moved Automation (`ContentCycle`) ownership from a single Instagram account to the Workspace, with a new join table letting one automation attach to zero or more Instagram accounts. The dashboard's automation UI was built entirely around a single, immutable `instagramId`: a single-select picker locked after creation, a `PATCH /contentCycle/:instagramId/:contentCycleId` URL shape, and a card that resolved one username via a separate `/instagram/accounts` fetch keyed on that one ID. None of this could represent "this automation runs on 3 pages" or "this automation currently runs on 0 pages" (dormant, after a disconnect).

## Solution

Reshaped the automation form, schema, and card around `instagramIds: string[]` / `instagramLinks[]`, matching the backend's new multi-instagram, workspace-scoped shape.

- **`InstagramSelectField.tsx`** — converted from a single-select to a multi-select, bound to the form's `instagramIds` array. It is now editable in edit mode too — the old `disabled={!!id}` lock (single instagram could never be changed after creation) is removed, since `AutomationForm.tsx` no longer passes a `disabled` prop.
- **`schemas/automationForm.ts`** — `instagramId: z.string().uuid()` → `instagramIds: z.array(z.string().uuid()).min(1, 'حداقل یک اکانت اینستاگرام انتخاب کنید')`. New `superRefine` rule: if `isCommentContentTargetEnabled` (post-targeted automation) and `instagramIds.length > 1`, adds a validation issue on the `instagramIds` path — this is the schema-level backstop mirroring the backend's `assertPostScopeSingleInstagram` guard.
- **`AutomationForm.tsx`** — default value is now `instagramIds: filterSelectedIds.length ? filterSelectedIds : []` (was a single string); prefill on edit maps `automation.instagramLinks?.map(l => l.instagramId)` into `instagramIds`; submit no longer destructures `instagramId` out of the payload and builds a `/contentCycle?instagramId=` URL — it now posts the whole `values` object (including `instagramIds`) to `POST /contentCycle` (create) or `PATCH /contentCycle/${id}` (update), matching the backend's reshaped routes exactly.
- **`TargetPostComment.tsx`** — before allowing "target specific post" to be enabled, checks `getValues('instagramIds')`; if more than one instagram is selected, shows `toast.error(t_err('specific_post_requires_single_instagram'))` and aborts instead of enabling the toggle. This is the exact end-user-requested UX rule (block, don't silently truncate the selection).
- **`InstagramPostSelectDialog.tsx`** — the post-picker's `GET /posts/pure` call now appends `?instagramId=<selected>` (reading `getValues('instagramIds')?.[0]`), using the backend's newly-added optional param so post search is scoped to the automation's actual selected page instead of an arbitrary workspace instagram.
- **`Contents.tsx`** — `isPromotion` was derived from a single `selectedInstagramId`; now watches `instagramIds: string[]` and is `true` if **any** selected instagram is a promotion page (`.some(...)`).
- **`AutomationCard.tsx`** — dropped the separate `useSWRImmutable('/instagram/accounts')` fetch + single-ID lookup that resolved one username. Now reads `item.instagramLinks?.map(l => l.instagram?.username)` directly off the automation response and joins them (`@user1, @user2`); shows `t('no_instagram_assigned')` when the array is empty (a dormant, zero-link automation).
- **`schemas/automation.ts` / `types/contentCycles/contentCycle.ts`** — response-shape types updated: `instagramId: string` → `instagramLinks: { instagramId, instagram: { id, username, name } | null }[]`.
- **i18n** — real keys added to `fa.json` first (canonical), then `en.json`: `Automations.select_instagrams`, `Automations.select_at_least_one_instagram`, `Automations.select_account_placeholder`, `Automations.TargetPostComment.Errors.specific_post_requires_single_instagram`, `Automations.Card.no_instagram_assigned`, and `ERROR_CODES.POST_SCOPED_AUTOMATION_REQUIRES_SINGLE_INSTAGRAM`.

## Changes

- `apps/dashboard/src/components/Automations/Form/InstagramSelectField.tsx`
- `apps/dashboard/src/components/Automations/AutomationForm.tsx`
- `apps/dashboard/src/components/Automations/AutomationCard.tsx`
- `apps/dashboard/src/components/Automations/Form/TargetPostComment.tsx`
- `apps/dashboard/src/components/Automations/Form/InstagramPostSelectDialog.tsx`
- `apps/dashboard/src/components/Automations/Form/Contents/Contents.tsx`
- `apps/dashboard/src/schemas/automation.ts`
- `apps/dashboard/src/schemas/automationForm.ts`
- `apps/dashboard/src/types/contentCycles/contentCycle.ts`
- `apps/dashboard/src/types/exceptionMessage.ts`
- `apps/dashboard/src/messages/fa.json`, `apps/dashboard/src/messages/en.json`

## Verification

- `npx tsc --noEmit` (dashboard) — no new type errors introduced by these files; the schema/type changes (`instagramLinks`, `instagramIds`) type-check across every call site that read the old `instagramId`.
- Each of the 7 commits was independently reviewed and approved against the backend's actual reshaped `contentCycle` request/response shapes (verified against `Back`'s `ContentCycleController`/`ContentCycleService`, not just assumed).
- **NOT yet done — manual end-to-end smoke test.** No interactive browser session was available during implementation. Before release: run `core` + `dashboard` together locally with a workspace that has 2+ connected Instagram pages, create an automation with multiple pages selected, verify the card shows all usernames joined; edit it down to 0 pages, verify the card falls back to "no instagram assigned" and the automation still exists (dormant, not deleted, matching the backend's disconnect-keeps-automation behavior); try enabling "target specific post" with 2+ pages selected and confirm the toast blocks it; disconnect a linked page from Settings and confirm the automation survives as dormant. See `Back/knowledge/updates/2026-07-12-automationWorkspaceOwnership.update.md` for the backend-side verification (119 core + 38 admin unit tests, migration up/down).

### Task 22 — end-to-end verification (2026-07-13)

- `pnpm --filter front exec tsc --noEmit` → 177 pre-existing errors project-wide, none
  caused by or worsened by this feature. The 4 that keyword-matched "instagram"/
  "contentcycle" were individually checked via `git blame` and confirmed pre-existing/
  unrelated (a stale `likeDirect` field name in `LikeDirect.tsx`, a `bordered`/
  `no-border` prop typo, a missing `LoadingLogo` barrel export, and an unrelated `Lead`
  mapper gap in `contact.ts`) — none touch `instagramIds`/`instagramLinks`. Clean w.r.t.
  this feature.
- **Manual smoke test: still NOT performed, and this time for a concrete, verifiable
  reason** — `apps/core` (the backend `dashboard` talks to) currently fails to build
  (`npx nest build` in `Back/worktrees/automation-ownership/apps/core` → 11 errors). The
  root cause is unrelated to this frontend work: 3 backend files
  (`contentCycleContent.service.ts`, `contentCycleVitrin.service.ts`,
  `vitrins.service.ts`) still query `ContentCycle` via a relation (`instagram`) that the
  backend's own Task 2 removed. See
  `Back/knowledge/updates/2026-07-12-automationWorkspaceOwnership.update.md`'s Task 22
  entry and `Back/.superpowers/sdd/task-22-report.md` for the full finding. Until that
  backend regression is fixed, no one can run `core` to smoke-test any dashboard flow,
  automation-related or not.

## Pre-Existing Gap Noticed (Not Part of This Change)

`fa.json`'s `ERROR_CODES` namespace was nearly empty before this change (this feature's key is effectively the first real entry) versus `en.json`'s ~40 existing entries — a pre-existing i18n backfill gap, unrelated to and out of scope for this feature.
