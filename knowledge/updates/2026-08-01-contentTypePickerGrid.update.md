# Content-Type Picker — Revert to Grid, Refresh Copy (2026-08-01)

Linear: [BEF-138](https://linear.app/befrooshapp/issue/BEF-138/antkhab-nwa-mhtway-atwmyshn).

## Problem

`ChooseAutomationType.tsx` (the picker shown when adding a new automation content
step/type) had been rewritten as a responsive `Dialog`/`Drawer` (bottom sheet on mobile) —
each option rendered as a full-width row with icon, title, and description. The reporter
asked for this to go back to the earlier design: a plain inline grid of icon+title
buttons, no dialog/bottom-sheet wrapper, no description inside each button (descriptions
stay only in the per-content-item header in `ContentItem.tsx`, which already reads the
same `buttons.descriptions.*` keys). They also supplied corrected title/description copy
for each type.

## Solution

`ChooseAutomationType.tsx` was reverted to the pre-`ff24c801` grid layout (an `Alert`
header + a `grid-cols-5` grid of icon+title buttons), while keeping the two capabilities
added since that original version: the `options` prop (used to filter out `'template'` in
`mode="template"`) and the `open`/`onOpenChange` prop contract `Contents.tsx` already
relies on. Since there's no more `Dialog`/`Drawer` to control visibility, the component
just returns `null` when `open` is `false`.

`buttons.titles.*`/`buttons.descriptions.*` under `Automations.Contents.Types` were
updated in both apps' `fa.json` to the reporter's supplied copy.

## Changes

- `packages/ui/src/automation-builder/Contents/ChooseAutomationType.tsx` — dropped
  `Dialog`/`Drawer`/`useMediaQuery`/`useLocale`; renders inline as an `Alert` title +
  `grid grid-cols-5` of icon+title `Button`s (no description per button); returns `null`
  when `!open`.
- `packages/ui/src/automation-builder/Contents/Contents.tsx` — one-line fix found during
  review: the zero-contents empty state (`no_content_title`/`add_step` CTA) had no
  `!isChoosingType` gate, unlike the populated-list "add content" button just below it.
  That gap was invisible while the picker was a `Dialog`/`Drawer` (the modal covered the
  page behind it) but became a visible glitch once the picker went back to rendering
  inline — clicking "add_step" on an empty automation would stack the "no content yet"
  text directly above the newly-revealed type grid instead of replacing it. Added
  `contents.length === 0 && !isChoosingType && (...)`, mirroring the existing pattern.
  No other prop/contract changes to `Contents.tsx` — same `open`/`onOpenChange`/`onSelect`/
  `options` passed to `ChooseAutomationType`.
- `apps/dashboard/src/messages/fa.json` and `apps/admin/src/messages/fa.json` —
  `Automations.Contents.Types.buttons.titles`: `text` "پیام متنی"→"متن", `button_template`
  "دکمه و لینک"→"دکمه", `audio` "پیام صوتی"→"صوت", `instagram_post` "پست اینستاگرام"→"پست",
  `product` "فروش در دایرکت"→"فروش", `delay` "پیام زمان‌دار"→"زمان‌بندی" (`image`, `video`,
  `question`, `vitrin`, `template` titles unchanged). `buttons.descriptions`: all 11 (12 in
  dashboard, which also has `template`) keys reworded to the reporter's supplied copy —
  see the diff for exact text. `media` (an unused legacy sentinel, not in the reporter's
  list) was left as-is.
- `apps/admin/src/app/(main)/templates/__tests__/TemplateForm.test.tsx` — `addTextContent`
  helper clicked the picker option by its old literal title `'پیام متنی'`; updated to the
  new `'متن'`.

## Out of scope

- **`برچسب` (Label)** — the reporter's copy list includes a "Label" content type
  ("دسته‌بندی و علامت‌گذاری مخاطبان") that has **no corresponding value** in
  `AutomationContentTypesEnum`/`ContentTypeOptions.tsx` and no backend support. Not added —
  needs its own design/backend work, flagged back to the reporter.
- No change to `ContentItem.tsx`'s per-content-item description header — it already reads
  `buttons.descriptions.${typeKey}`, so it picks up the new copy automatically.
- `en.json` untouched, per the standing convention (English translations added later).

## Verification

- Targeted `vitest run`, all passing:
  - `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx` (25 tests)
  - `packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx` (6 tests)
  - `apps/dashboard/src/components/Automations/AutomationForm.test.tsx` (2 tests)
  - `apps/admin/src/app/(main)/templates/__tests__/TemplateForm.test.tsx` — 2 of 7 tests
    fail on **both** this branch and unmodified `merged-admin` (confirmed by running the
    same file against the untouched checkout) — pre-existing, unrelated to this change.
- No manual browser verification performed yet.
