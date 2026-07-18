# 2026-07-18 — Fix sizing/alignment of buttonTemplate content buttons in the automation builder

Reference code: `packages/ui/src/automation-builder/Contents/ContentButtonsItem.tsx`
(shared by the dashboard `AutomationForm` and the admin templates builder — see
`automation-builder/` entry in `knowledgeMap.doc.md`).

## Problem

The per-button row in the "buttonTemplate" content editor (and the same shared
row used by `text` quick-replies, `question`, and `vitrin` buttons) looked
visually broken:

- The button-type `<Select>` used `w-full sm:w-auto`, so on wider screens it
  shrank to whatever its current label happened to measure, jumping to a
  different width per row/button-type instead of lining up as a column.
- The title `<Input>` used `flex w-full flex-1` while every sibling field was
  `w-full` — since `flex-wrap` children with `w-full` always force their own
  line, the type select and title never actually sat side by side despite the
  container being `flex flex-wrap`.
- `CardHeader` had a `-mt-2` negative-margin hack (to compensate for the
  removed `Card` gap) that pulled the drag/delete icon row up further than
  the card's own `p-3` top padding, leaving asymmetric padding (top ~4px vs
  12px on the other three sides).
- Non-first button cards got an extra `pt-4` (index !== 0) on top of the
  list's own `gap-y-3`, so cards had inconsistent internal top padding down
  the list.
- The Instagram-post icon-only picker button next to the URL input used the
  default icon size (`size-9`/36px) beside a 40px (`h-10`) input, a visible
  height mismatch.

## Solution

- Extracted the repeated `Object.values(ButtonTypeEnum).filter(isButtonTypeAllowed)`
  into one `allowedButtonTypes` value, reused for both the `.length > 1` gate
  and the option list.
- Type select: fixed width `sm:w-52 sm:shrink-0` when it actually renders
  (`allowedButtonTypes.length > 1`), otherwise kept `sm:w-auto` so it stays
  invisible/zero-width exactly like before for single-type content (e.g.
  `question`, which only ever allows `text`).
- Title input: `w-full sm:w-auto sm:flex-1 min-w-0`, so it now shares a row
  with the type select on `sm+` and fills the remaining space; dropped the
  redundant inner wrapper `<div>` (the `FormItem` itself now carries
  `space-y-1`, same pattern as the URL field).
- `Card`: uniform `p-4` + `gap-3` for every item (removed the index-based
  `pt-4` special case and the `gap-0` override).
- `CardHeader`: removed the `-mt-2` hack, now plain `p-0` inside the card's
  own consistent `gap-3`; added `min-h-5` to the icon row so it doesn't
  collapse when both icons are hidden (question type, first item).
- URL row: bumped `gap-1` → `gap-2`, and the Instagram-post icon-only button
  now forces `size-10!` to match the `h-10` input beside it.
- `CardContent` gap bumped from `gap-2` → `gap-3` to match the card's new
  rhythm.

No field names, validation, submit payloads, or conditional show/hide logic
changed — purely Tailwind class/layout edits.

## Verification

- Existing test suite `automation-builder/Contents/__tests__/ContentButtonsItem.test.tsx`
  (5 tests) passes unchanged.
- `pnpm --filter @befroosh/ui exec tsc --noEmit -p .` shows only pre-existing,
  unrelated errors (present across the whole package before this change —
  missing `@types/react` resolution when running `tsc` standalone outside
  the real build pipeline); none reference the edited layout.
- Not visually verified in-browser per user request — user will test after
  merge.
