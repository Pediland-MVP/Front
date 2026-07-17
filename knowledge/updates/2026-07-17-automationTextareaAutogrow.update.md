# Auto-growing Textareas in Automation Builder (2026-07-17)

See design: `docs/superpowers/specs/2026-07-17-automation-textarea-autogrow-design.md` (in the outer repo root).

## Problem

Every long-text field in the automation contents editor is a fixed-height box controlled only by hardcoded `rows` attributes, with inconsistent values across fields (`rows={4}`, `rows={1}`, `rows={2}`, `rows={3}`, or none). A user writing a 1000-character message types into a 1-4 line window and cannot see what they are composing. The same kind of field also renders a different size depending on which content block it sits in.

## Solution

Replaced fixed `rows` attributes with a new `AutoResizeTextarea` component that measures its content via JavaScript, starts at 4 rows, grows as the user types, and caps at 12 rows (after which it scrolls internally by design, to keep a content list with several open blocks from becoming unreasonably tall). All 7 affected call sites now use the same component, ensuring consistent behavior.

## Design decisions

### Why not CSS `field-sizing`

Tailwind v4 includes `field-sizing-content`, which would be a one-class change. It was rejected on browser support: Safari (desktop and iOS) require 26.2, Firefox requires 152. The dashboard's users are Persian-first Instagram marketers heavily on iPhone, and every iOS browser below Safari 26.2 would get no growth at all — silently, with nothing in the console to reveal it. A hybrid CSS + JS fallback was also rejected: two code paths to maintain, with no user-visible gain over pure JavaScript, which works everywhere.

### Why the resize effect keys on `value`, not `onChange`

The component measures in a `useLayoutEffect` keyed on the `value` prop. An `onChange`-only implementation would fail when a user opens an existing saved automation for editing: react-hook-form's `reset()` and the edit-load path both change `value` without firing `onChange`, so the field would render a long message in a 4-row box until the user types.

## Changes

- `packages/ui/src/components/ui-custom/AutoResizeTextarea.tsx` (new): wraps the shadcn `Textarea`, reads `lineHeight` and padding/borders from computed style, sets height to `scrollHeight` clamped between `minRows * lineHeight` and `maxRows * lineHeight`, sets `overflow-y: hidden` under the cap and `overflow-y: auto` at the cap, and merges the ref so react-hook-form's focus-on-error still works. Props: `minRows = 4`, `maxRows = 12`.
- `packages/ui/src/automation-builder/Contents/TextContent.tsx`: swapped `Textarea` for `AutoResizeTextarea`, dropped `rows={4}`.
- `packages/ui/src/automation-builder/Contents/ButtonContent.tsx`: swapped `Textarea` for `AutoResizeTextarea`, dropped `rows={4}`.
- `packages/ui/src/automation-builder/Contents/QuestionContent.tsx`: swapped `Textarea` for `AutoResizeTextarea` on the question prompt field (line 95) and the validation error message field (line 140), dropped hardcoded `rows`.
- `packages/ui/src/automation-builder/Contents/VitrinContent.tsx`: swapped `Textarea` for `AutoResizeTextarea`, dropped `rows={4}`.
- `packages/ui/src/automation-builder/Form/JustFollowers.tsx`: swapped `Textarea` for `AutoResizeTextarea`, dropped `rows={2}`.
- `packages/ui/src/automation-builder/Form/CommentTriggerInputs.tsx`: swapped `Textarea` for `AutoResizeTextarea` on the comment consent start text field (line 64), dropped `rows={1}`. (Note: the `commentStartTitle` button label on line 81 remains a plain `Input` by design.)

Total: 80 unit tests passing (73 pre-existing + 7 new in `AutoResizeTextarea.tsx`).

## Explicitly out of scope

- `Form/CommentTriggerInputs.tsx:81` (`commentStartTitle`) — the start button's label, a short one-line field. Not auto-resizing.
- `Contents/ContentPromotion.tsx:136` — read-only (disabled) promo block, not form-bound. Not changed.
- The hardcoded-Persian i18n bug at `QuestionContent.tsx:140` — a known separate defect. This work changes that field's height only.

## Verification

The unit tests stub `scrollHeight` and `window.getComputedStyle`, so they verify the clamp arithmetic only. They prove nothing about real browser font metrics or layout.

**Before this branch is merged, a manual browser check is required:**

- [ ] An empty automation text content renders 4 rows tall.
- [ ] Typing past 4 lines grows the field smoothly, with no scrollbar and no visible jump.
- [ ] A ~1000-character Persian message stops growing at 12 rows and scrolls inside.
- [ ] Opening an existing saved automation with a long message renders it already expanded (the react-hook-form `reset()`/edit-load path).
- [ ] RTL Persian text lays out correctly in the grown field.
- [ ] A content list with several blocks open stays reasonably compact.

Green tests do not guarantee these outcomes; only real browser testing does.
