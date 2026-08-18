# 2026-08-18 — Destination-automation picker always 400s: missing `instagramIds`

Branch: `fix/automation-search-select-instagram-ids` (worktree, off `main`). NOT merged.

## Problem

Found while manually testing the Back PR for nested-automation start (`fix/automation-nested-trigger-guard`, Back repo): the "انتخاب یک پیام خودکار" (select an automatic message) destination-automation picker, used when a `quickReply`/`buttonTemplate` button's type is `START_AUTOMATION`, was permanently empty. Its network call always 400'd:

```
GET /v1/contentCycle/conditions?page=1&limit=30
→ 400 {"message": ["each value in instagramIds must be a UUID", "instagramIds should not be empty", "instagramIds must be an array"]}
```

`AutomationSearchSelect.tsx` (`packages/ui/src/automation-builder/Contents/AutomationSearchSelect.tsx`) never sent `instagramIds` at all. The backend (`InstagramIdsQueryDto`, Back `apps/core/src/common/dto/instagram-ids-query.dto.ts`) has required a non-empty array of UUIDs on this endpoint since **2026-05-05** — this component (first written 2026-06-05, forked into `packages/ui` on 2026-07-15) was never wired up correctly and this code path has likely never worked.

## Solution

`instagramIds` is already a required, top-level field of the same `AutomationFormType` form this component always renders inside (`AutomationBuilder.tsx` wraps everything in `<Form {...form}>`; `ContentButtonsItem` only mounts this picker for `mode === 'automation'`, where the field is required/non-empty by schema). No prop-drilling needed — read it via `useFormContext<AutomationFormType>().watch('instagramIds')`, same pattern as the sibling `InstagramPostSelectDialog.tsx` already uses for the same problem (post picker → `instagramId`). Send it as repeated query keys (`instagramIds=<uuid>&instagramIds=<uuid2>`), matching the backend's `@Transform` (single-vs-array normalization, not comma-splitting) and matching `AutomationsCardList.tsx`'s working call to the sibling `GET /contentCycle` route. Also gate the fetch on `instagramIds.length > 0` so it can never fire the guaranteed-400 empty-array request.

## Changes

- `packages/ui/src/automation-builder/Contents/AutomationSearchSelect.tsx` — reads `instagramIds` from the form via `useFormContext`, appends it to the SWR key as repeated `instagramIds` query params, gates the fetch on a non-empty array.
- Tests: new `Contents/__tests__/AutomationSearchSelect.test.tsx` (3 tests) — sends `instagramIds` as repeated keys when the form has them; does NOT call the API when the form has none yet; selection still works once results load.

## Not in scope (found, reported, left as-is)

- `apps/dashboard/src/components/Products/AutomationSearchSelect.tsx` — the pre-extraction sibling this was forked from — has the **exact same bug** (never sends `instagramIds` either) and is still live, consumed by `SortableButtonItem.tsx` → `FormVitrinButtons.tsx` (the Vitrin/shop button picker, a different page/feature from the Automations builder). `SortableButtonItem.tsx` already has `useFormContext()` in scope, so the same fix pattern applies — just not done here since it's a different page than the one the user was testing.

## Verification

- TDD: wrote 3 tests against the unfixed component first — 2 failed (no `instagramIds` sent; fetched even with an empty array) matching the reported bug exactly, 1 passed (selection logic itself was already fine). All 3 pass after the fix.
- `pnpm exec vitest run src/automation-builder/` (packages/ui) → **14 suites, 143 tests passing**, no regressions.
- `pnpm --filter front exec tsc --noEmit` (apps/dashboard, which type-checks `packages/ui` source) — 210 pre-existing errors, none touching `AutomationSearchSelect.tsx` or any file this change touched (confirmed via `grep`).
