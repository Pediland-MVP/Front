# Automation Fixes: Delay Step Order + mp3 Upload (2026-08-03)

Linear: [BEF-164](https://linear.app/befrooshapp/issue/BEF-164/aslahat-atwmyshn).

## Problem

Two of the ticket's three items:

1. The delay/wait step in the Automation builder shows a time-unit picker
   (hour/day/minute) and a number picker. The unit picker rendered first in
   the DOM, and since the dashboard UI is RTL, "first in DOM" renders
   rightmost — so it read right-to-left as "hour 1" ("ساعت ۱") instead of
   the intended "1 hour" ("۱ ساعت").
2. `mp3` was missing from the audio-upload accepted-format allowlist, so a
   plain `.mp3` file could be rejected by the dropzone (some browsers/OSes
   report `.mp3` as `audio/mp3` rather than the technically-correct
   `audio/mpeg`).

The ticket's 3rd item (form-builder postal-code/photo field options not
appearing) was reported separately resolved already — not part of this fix.

## Solution

Both source files live in `packages/ui`; `apps/dashboard`'s copies are
either a thin `export *` re-export (`DelayContent.tsx`) or the identical
file via a filesystem symlink (`MediaUploader.tsx`), so editing the
`packages/ui` source was sufficient — no separate dashboard-side edit
needed.

## Changes

- `packages/ui/src/automation-builder/Contents/DelayContent.tsx` — swapped
  the JSX order of the two `FormField` blocks so the numeric-magnitude
  `Select` renders before the time-unit `Select`. Pure block move, no
  logic/prop changes.
- `packages/ui/src/components/ui-custom/MediaUploader.tsx` — added
  `audio/mp3` to `acceptedFormats.audio` (alongside the existing `aac, m4a,
  wav, mp4, mpeg`).
- `apps/dashboard/src/messages/fa.json` and `en.json`, and
  `apps/admin/src/messages/fa.json` — updated the audio uploader's
  `formats` help text to include `mp3` (admin has no `en.json` entry for
  this key yet, per the standing convention that English is added later).

## Out of scope

- No change to image/video accepted formats.
- No change to the form-builder postal-code/photo item (already resolved).
- No backend/API changes.

## Verification

- Targeted `vitest run`, all passing:
  - `packages/ui/src/automation-builder/Contents/__tests__/DelayContent.test.tsx` (6 tests)
  - `packages/ui/src/automation-builder/Contents/__tests__/MediaContent.test.tsx` (1 test)
  - `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx` (28 tests)
  - `apps/dashboard/src/components/Automations/AutomationForm.test.tsx` (2 tests)
- No test asserted field DOM order or the accepted-formats string, so no
  test changes were needed.
- No manual browser verification performed yet.
