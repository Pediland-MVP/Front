# Restore Read-Only Comment-Start Preview Card — 2026-07-19

## Problem

The automation builder used to show a system-added, read-only "start message" card as
item 0 of an automation's `contents` list, whenever the automation is comment-triggered
(`isComment`), doesn't require following (`!justFollowers`), and has more than one
content (or a single `PRODUCT` content). It let the merchant see and edit the
Instagram-mandated opt-in message (`commentStartText`/`commentStartTitle`) in place,
styled like a real content step.

It was added in `4946edea` (2026-07-15) as `apps/dashboard/.../StartAutomationMessage.tsx`,
but merge commit `91fbafa6` (2026-07-16, merging `merged-admin` into `feat/template-system`)
dropped it, keeping only the plain-fields `CommentTriggerInputs` form section (moved to
`packages/ui/src/automation-builder/Form/`) instead. The merge message reasoned the two were
"functionally identical" — same underlying fields — but the inline read-only-card preview
inside the contents list was in fact lost, leaving only a separate form section with no
"this shows here" preview.

## Solution

Ported the original component into the shared automation-builder package (used by both
dashboard and admin) as `StartAutomationMessage`, and render it as the first item in
`Contents` for `mode === AUTOMATION`, replacing `CommentTriggerInputs` (which offered the
same fields but not the inline preview).

## Changes

- New: `Front/packages/ui/src/automation-builder/Contents/StartAutomationMessage.tsx` —
  ported from the original dashboard-only component; same activation rule
  (`isComment && !justFollowers && (contents[0].type === PRODUCT || contents.length > 1)`),
  now accepts an optional `helpSlot` (replacing the dashboard's hardcoded `HelpMeDialog`).
- `Front/packages/ui/src/automation-builder/Contents/Contents.tsx` — renders
  `<StartAutomationMessage helpSlot={commentTriggerHelpSlot} />` as the first child, gated
  on `mode === AutomationContentModeEnum.AUTOMATION`; added the `commentTriggerHelpSlot`
  prop.
- `Front/packages/ui/src/automation-builder/AutomationBuilder.tsx` — removed
  `CommentTriggerInputs`; passes `helpSlots?.commentTrigger` into `Contents` as
  `commentTriggerHelpSlot` instead.
- Removed now-unused `Front/packages/ui/src/automation-builder/Form/CommentTriggerInputs.tsx`
  and its barrel export, and the orphaned dead shim
  `Front/apps/dashboard/src/components/Automations/Form/Contents/StartAutomationMessage.tsx`
  (re-exported the removed component; nothing imported it).
- `Front/apps/admin/src/messages/fa.json` — added the missing `message_text` and
  `system_description` keys under `Automations.CommentConsent` (dashboard's `fa.json`/`en.json`
  already had them; admin's `CommentConsent` block was missing both).

## Verification

Added 5 new tests in `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx`
covering the activation rule (shows/hides by `isComment`/`justFollowers`/content count/PRODUCT
exception). Full `packages/ui` vitest suite: 126/126 passing (was 121; +5 new), including
`AutomationBuilder.test.tsx` and `Contents.test.tsx`. `tsc --noEmit` on `packages/ui` is
unreliable outside the Next.js build pipeline (no dedicated typecheck script; bare `tsc`
reports pre-existing `@types/react` resolution errors across the whole package, unrelated to
this change) — the touched lines introduce no new logic errors beyond that pre-existing noise.
