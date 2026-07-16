# Delay Content Select-Box — Shared 23h Delay Budget (2026-07-16)

See design: `docs/superpowers/specs/2026-07-16-delay-content-selectbox-design.md`.
See plan: `docs/superpowers/plans/2026-07-16-delay-content-selectbox.md`.

## Problem

`DelayContent.tsx` let a user type a free-form number for a delay step's magnitude
(hour/min/sec). There was no shared budget across the DELAY items in one automation's
`contents` array — a user could add several delay steps whose total was nonsensical (e.g.
two 20-hour delays), and only the backend's existing **per-item** 23h cap would catch it
(and only per item, never the sum) at submit time.

## Solution

Each automation's `contents` array now has a **shared 23-hour delay budget**. The
free-text magnitude input on a DELAY content item was replaced with a `<Select>` whose
options are dynamically computed from the budget still remaining across the *other* DELAY
items in the same `contents` array, so a user can only ever pick values that keep the
automation's total DELAY time at or under 23 hours. Adding a brand-new delay step is
blocked (with an explanatory dialog) once the budget is already fully used.

This is a **frontend-only** change. No backend/DTO changes were made — the backend's
existing per-item-only `@Max(23h)` cap on `delayMs` is unchanged; the shared-budget rule
is enforced entirely in `Front`.

## Changes

- `packages/ui/src/automation-builder/utils/delayBudget.ts` (new) — pure helper module:
  `TOTAL_DELAY_BUDGET_MS` (23h in ms), `DELAY_UNIT_MS`, `sumOtherDelaysMs(contents,
  excludeIndex)`, `remainingDelayBudgetMs(contents, excludeIndex)`, and
  `delayUnitOptionsCount(remainingMs, unit)` (hour uncapped beyond the budget itself;
  min/sec capped at 60). `schemas/automationForm.ts` gained a `ContentItemType` type
  export (`z.infer<typeof ContentItemSchema>`) that this helper and the components below
  consume.
- `packages/ui/src/automation-builder/Contents/DelayBudgetExhaustedDialog.tsx` (new) — a
  small `AlertDialog` explaining the 23h delay budget is fully used, with a single
  acknowledge/close action. Added matching copy under the existing
  `Automations.Contents.Delay` namespace (`selectValue`, `budget_exhausted_title`,
  `budget_exhausted_description`, `close`) in **both** `apps/dashboard/src/messages/fa.json`
  and `apps/admin/src/messages/fa.json` (the automation-builder is shared code rendered in
  both apps).
- `packages/ui/src/automation-builder/Contents/DelayContent.tsx` — rewritten: the
  free-text, `p2eNumbers`-converting `<Input>` magnitude field is gone; the magnitude is
  now a `<Select>` populated from `delayUnitOptionsCount`/`remainingDelayBudgetMs`.
  Switching the time unit (`delayUnitChangeHandler`) keeps its original "clamp to at
  least 1" behavior and now also clamps down to the new unit's remaining-budget max.
  Opening the magnitude select while no budget remains (`maxOptions < 1`) shows
  `DelayBudgetExhaustedDialog` instead of an empty dropdown. Public props
  (`DelayContent({ index })`) are unchanged, so the `ContentItem.tsx` call site needed no
  changes.
- `packages/ui/src/automation-builder/Contents/Contents.tsx` — `selectAutomationTypeHandler`
  now checks the remaining DELAY budget (only for the `contents` array, never
  `reminders` — reminders cannot contain DELAY items) before appending a new DELAY item.
  If the budget is exhausted it closes the type picker and opens
  `DelayBudgetExhaustedDialog` instead of appending.
- `apps/admin/src/app/(main)/templates/TemplateForm.tsx` — added a `handleBeforeSubmit`
  guard wired via `AutomationBuilder`'s existing `beforeSubmit` prop, summing `delayMs`
  across `values.contents` for `type === DELAY` and blocking submit (toast, reusing the
  already-existing-but-previously-unused `Contents.Errors.totalDelayMsShouldBeUnder23Hour`
  translation key) if the sum exceeds 23h. This closes a **pre-existing parity gap**:
  dashboard's `AutomationForm.tsx` (`handleBeforeSubmit`) already had this exact
  submit-time 23h-sum safety net; admin's template form did not, even though templates can
  contain DELAY content items. No new Zod `superRefine` was added to
  `AutomationFormSchema` — both apps rely on this imperative pre-submit check.

## Verification

- TDD unit/component tests added per task, all passing at commit time:
  - `packages/ui/src/automation-builder/utils/__tests__/delayBudget.test.ts` — budget math
    for hour/min/sec option counts, exclusion of the item's own value, capping min/sec at
    60, zero/negative remaining.
  - `packages/ui/src/automation-builder/Contents/__tests__/DelayContent.test.tsx` (new) —
    renders cleanly with full and fully-consumed budgets, unit selector still renders.
  - `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx` (extended) —
    "Add Delay" appends normally with budget remaining, shows the exhausted-budget dialog
    instead of appending when existing DELAY items already sum to 23h, and confirms the
    dialog never fires in `mode=REMINDER` (the budget only applies to `contents`).
  - Admin's `TemplateForm.tsx` change has no dedicated test file (none existed before this
    change either, matching dashboard's untested `handleBeforeSubmit`); it was scope-limited
    type-checked instead (`tsc --noEmit` filtered to `TemplateForm.tsx`, no new errors).
- **Manual end-to-end verification in the running dashboard/admin apps (adding several
  delay steps and watching the select ranges narrow, and confirming the exhausted-budget
  dialog and the admin submit-time toast in a live browser) is still pending** — it was not
  performed as part of these 5 commits and should happen before this branch is considered
  fully verified.

## Out of scope / known limitations

- No change to the `reminders` array/flow — the shared budget only applies to `contents`.
- No change to already-saved automations whose existing DELAY sum might already exceed 23h
  (pre-dating this feature); they are only affected once a user opens and edits them.
