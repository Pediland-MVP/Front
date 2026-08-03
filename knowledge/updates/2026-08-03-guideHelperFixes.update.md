# 2026-08-03 — Guide (راهنما) Dialog Fixes (BEF-140)

Reference: `apps/dashboard/src/components/Global/HelpMeDialog.tsx`, `packages/ui/src/automation-builder/`

## Problem
The in-app guide dialog had several usability bugs (Linear BEF-140): its close button
lived at the bottom instead of a familiar top X; on iPhone the guide video auto-entered
fullscreen; several UI sections (per-content-type, the automated message name field) had
no guide at all; the "start request message" guide rendered absolutely-positioned and
overlapped the delete button instead of sitting next to its label; and newly added guide
locations had no way to be managed from the Admin CMS.

## Solution
- Moved the close control to a `DialogClose` + `X` icon in the dialog's top-left corner
  (matching this RTL dialog's layout — the header already reserved that space via `pl-6`
  on the title column); removed the old bottom "بستن" button.
- Added `playsInline` to the guide's `<video>` element — iOS Safari auto-fullscreens any
  `<video>` without it.
- Extended the shared `AutomationBuilder` package's slot system: `TitleAndEnabled` and
  `ContentItem` now accept a `helpSlot`/`contentTypeHelpSlots`, letting the dashboard
  inject a `HelpMeDialog` per content type and for the automated-message-name field.
  These new guides are purely CMS-driven (`helpId` only, no hardcoded `videoSrc`) —
  content/video must be added via the Admin guides page.
- Fixed the "start request message" guide's positioning by passing `noAbsolute` (it was
  rendering `position: 'left'` → `absolute`, overlapping the header's delete button).
- Registered all new `helpId`s (`automation_title`, `automation_content_<type>` × 10) in
  the Admin guides page's `helpId` dropdown.

## Changes
- `apps/dashboard/src/components/Global/HelpMeDialog.tsx`
- `packages/ui/src/automation-builder/Form/TitleAndEnabled.tsx`
- `packages/ui/src/automation-builder/AutomationBuilder.types.ts`
- `packages/ui/src/automation-builder/AutomationBuilder.tsx`
- `packages/ui/src/automation-builder/Contents/Contents.tsx`
- `packages/ui/src/automation-builder/Contents/ContentItem.tsx`
- `apps/dashboard/src/components/Automations/AutomationForm.tsx`
- `apps/dashboard/src/messages/fa.json`
- `apps/admin/src/app/(main)/guides/guides-table.tsx`

## Verification
- `apps/dashboard/src/components/Global/__tests__/HelpMeDialog.test.tsx` (new)
- `packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx`
- `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx`
- `apps/dashboard/src/components/Automations/AutomationForm*.test.tsx`
- Not covered by automated tests: slow video playback (BEF-140 item 2 — explicitly out of
  scope), and actually publishing guide content/video for the new `helpId`s via the Admin
  CMS (a content task, not a code task — the dialogs render title-only until an admin adds
  content).
