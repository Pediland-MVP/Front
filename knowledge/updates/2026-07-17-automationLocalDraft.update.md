# Automation Local Draft (Auto-Save) — 2026-07-17

Full design: `docs/superpowers/specs/2026-07-17-automation-local-draft-design.md`

## Problem

Starting a new automation on `/automations/add` and navigating away (or crashing/closing
the tab) lost all in-progress work with no recovery.

## Solution

Auto-save the create-new automation form to `localStorage`, scoped per workspace
(`automation-draft:${workspaceId}`), debounced while the form is dirty. On the
automations list page, clicking "create automation" checks for a stored draft first and,
if found, offers to resume it or discard it and start fresh, instead of jumping straight
into the template picker.

## Changes

- `apps/dashboard/src/utils/jwt.ts` (new) — JWT payload decode, extracted out of
  `usePermissions.ts` so non-hook code (the draft utils) can read the current
  `workspaceId` without triggering a permissions fetch.
- `apps/dashboard/src/utils/automationDraft.ts` (new) — read/write/clear/exists for the
  workspace-scoped draft.
- `apps/dashboard/src/components/Automations/AutomationDraftWatcher.tsx` (new) —
  headerSlot component (same pattern as `InstagramPromotionWatcher`), debounce-persists
  the form while `formState.isDirty`.
- `apps/dashboard/src/components/Automations/AutomationDraftDialog.tsx` (new) —
  resume/discard `AlertDialog`.
- `apps/dashboard/src/components/Automations/AutomationForm.tsx` — mounts the watcher
  (create-new only); `initialValue` now checks a stored draft for the blank-create case;
  clears the draft in `submitAutomation`'s success branch.
- `apps/dashboard/src/app/(Console)/automations/page.tsx` — the "create automation"
  button now checks for a draft before opening the template picker.
- `apps/dashboard/src/messages/fa.json` — new `Automations.DraftDialog` keys.

## Verification

- Unit tests: `jwt.test.ts`, `automationDraft.test.ts`, `AutomationDraftWatcher.test.tsx`,
  `AutomationDraftDialog.test.tsx`, `AutomationForm.draft.test.tsx`, `page.test.tsx` (all
  under `apps/dashboard/src`) — 28 tests total, all passing, each task independently
  reviewed clean (spec compliance + code quality) during implementation.
- Manual walkthrough of the full resume/discard/clear-on-save/workspace-isolation flow in
  a running dashboard instance.
