# BEF-164 automation fixes — design

Date: 2026-08-03

[BEF-164](https://linear.app/befrooshapp/issue/BEF-164/aslahat-atwmyshn) —
"اصلاحات اتومیشن". Two of the ticket's three items are in scope here (the
third, form-builder postal-code/photo options, was reported separately
resolved already).

## Context

Both source files live in `Front/packages/ui`; the matching files under
`Front/apps/dashboard/src/components/...` are `export *` re-exports of the
same source, so only the `packages/ui` copies need editing.

### 1. Delay step reads "hour 1" instead of "1 hour"

`Front/packages/ui/src/automation-builder/Contents/DelayContent.tsx` renders
one `flex` row containing two `FormField`s: the time-unit `Select`
(hour/day/minute, `delayUnitNameKey`) first, then the numeric-magnitude
`Select` (`delayMsNameKey`) second. The app is RTL, so DOM-first renders
visually rightmost — reading right-to-left that's "ساعت ۱" (unit, then
number) instead of the wanted "۱ ساعت" (number, then unit).

### 2. mp3 rejected on audio upload

`Front/packages/ui/src/components/ui-custom/MediaUploader.tsx`'s
`acceptedFormats.audio` (used as the dropzone's `accept` attr) lists
`aac, m4a, wav, mp4, mpeg` but not `mp3`. Some browsers/OSes report a
`.mp3` file's MIME type as `audio/mp3` rather than the technically-correct
`audio/mpeg`, so a plain mp3 can be rejected by the dropzone.

The Persian help text shown next to the audio uploader
(`Front/apps/dashboard/src/messages/fa.json`, `Automations...audio.formats`)
already lists `aac, m4a, wav, mp4` — out of sync with the code (missing
`mpeg` too) even before this fix.

## Change

Frontend-only, no backend changes.

1. **`DelayContent.tsx`**: swap the JSX order of the two `FormField` blocks
   so the numeric-magnitude field renders first, the unit field second.
   Pure reorder — no new props, no CSS `flex-row-reverse` hack.
2. **`MediaUploader.tsx`**: add `audio/mp3` to the `acceptedFormats.audio`
   string (alongside the existing `aac, m4a, wav, mp4, mpeg`).
3. **i18n**: update the audio uploader's `formats` help text key in
   `fa.json` (dashboard app, and admin app's copy if the same component/key
   is used there) to mention `mp3`, and check `en.json` for the same key
   since it's an existing key being edited, not a new one.

## Testing

Check existing tests covering `DelayContent.tsx` and `MediaUploader.tsx`
(e.g. `Contents.test.tsx`, `AutomationBuilder.test.tsx`) for any assertions
tied to field order or the accepted-formats string; update them if so, and
run the scoped test files after the change per repo convention (no
project-wide test run).

## Out of scope

- No change to video/image accepted formats.
- No change to the form-builder postal-code/photo item (ticket's 3rd item,
  already resolved).
- No backend/API changes.
