# 2026-08-31 — Buy-in-Direct automation content (Task 12)

Full detail: `Back/.superpowers/sdd/2026-08-31-buyInDirect-phase1/task-12-report.md`.

## Problem

The Instagram-DM "Buy in Direct" shopping flow (Tasks 1-11, Back) needed a dashboard
authoring surface: a merchant picks which commerce products an automation content step
shows, in order, before the automation can be saved.

## Solution

Added `AutomationContentTypesEnum.BUY_IN_DIRECT = 'buy_in_direct'` and a new
`BuyInDirectContent` editor in `packages/ui/src/automation-builder/Contents/`, following
the same `{ mode, index, apiClient }` + `useFieldArray` convention every other
content-type editor in that folder uses (`ProductContentComp` is the closest sibling) —
not a controlled `value`/`onChange` leaf, since that isn't how this codebase's
content-type editors are wired into the shared `react-hook-form` instance.

- Picker: `GET /commerce/products` via the existing `apiClient.get` contract, cards use
  `coverMediaUrl`.
- Picked list: dnd-kit reorder (same idiom as `ProductContentComp`/the commerce media
  pool's `5e7bfe96`/`a2ea355e`), remove button, empty-state hint.
- Card-to-card warning: reuses `Commerce.List.NoCardToCard` copy/tokens from
  `ProductListPage.tsx` (`00b3f887`/`b78f6ab4`), not new wording.
- Validation ("at least one product"): added to `AutomationFormSchema`'s `superRefine`
  in `packages/ui/src/automation-builder/schemas/automationForm.ts`, mirroring the
  legacy PRODUCT branch — this is the actual gate (not `AutomationForm.tsx`), and it is
  the ONLY gate: the backend DTO does not validate `buyInDirectProducts` non-empty
  (unlike legacy `productIds`).
- `remapTemplateContents.ts` now also strips `buyInDirectProducts` when inserting a
  template's contents into another automation — same workspace-scoped-product-ref class
  of bug the existing `products`/`productIds`/`contentProducts` strip exists for.

## Changes

See the task-12 report for the full file list, reasoning, and deviations from the
original brief (enum/test-runner/component-API corrections, verified against the real
codebase).

## Verification

`packages/ui/src/automation-builder`: 117 -> 126 tests pass (9 new, 0 regressions).
`apps/dashboard/src/components/Automations`: 26/26 pass, unchanged.
`apps/dashboard` `tsc --noEmit`: 204 pre-existing errors, unchanged (none touch new/edited
files).
