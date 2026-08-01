# Start-Request Message — Copy, Help-Icon Position, Delete Guard (2026-08-01)

Linear: [BEF-162](https://linear.app/befrooshapp/issue/BEF-162/pyam-drkhwast-shrwa).

## Problem

The Instagram-mandated "start request message" step (`StartAutomationMessage.tsx`,
auto-inserted before comment-triggered automations with more than one message) had four
small UX issues:

1. Its title/description copy was unclear about *why* the step exists.
2. Its help ("؟") icon rendered in the wrong spot on both desktop and mobile.
3. It had no delete icon at all, unlike every other step in the builder — users didn't
   know this step is required and can't just be removed.

## Solution

- **Copy**: `Automations.CommentConsent.start_request_message` and `.system_description`
  reworded per the reporter's supplied text (both `fa.json` and, deviating from the usual
  "fa-only for now" convention, `en.json` too — the English text was straightforward to
  translate alongside).
- **Help-icon position**: root cause was that `HelpMeDialog` renders its trigger with
  `absolute` CSS unless `noAbsolute` is passed, and `StartAutomationMessage`'s header `div`
  had no `relative` ancestor — so the icon escaped to whatever distant positioned ancestor
  happened to exist. Every other `helpSlot` consumer (`JustFollowers.tsx`, `Triggers.tsx`,
  `Conditions.tsx`) already wraps its slot in a `relative` container for this exact reason.
  Added `relative` to `StartAutomationMessage`'s `_header` div, matching that pattern.
- **Delete guard**: added a `TrashIcon` button to the header (`ms-auto`, same
  `variant="link" size="icon" text-destructive` styling as other delete buttons in this
  builder) that opens an `AlertDialog` instead of deleting anything — copying the existing
  "can't delete, here's why" pattern from `ContentButtonsItem.tsx`'s locked-CONSENT-button
  dialog. New i18n keys: `delete_locked_title`, `delete_locked_description`,
  `delete_locked_close` under `Automations.CommentConsent`.

## Changes

- `packages/ui/src/automation-builder/Contents/StartAutomationMessage.tsx` — `relative` on
  the header div; new `TrashIcon` button + `isDeleteLockedDialogOpen` state; new
  `AlertDialog` block at the end of the component.
- `apps/dashboard/src/messages/fa.json` / `en.json` — `CommentConsent.start_request_message`
  and `.system_description` reworded; new `CommentConsent.delete_locked_title` /
  `.delete_locked_description` / `.delete_locked_close` keys.
- `apps/admin/src/messages/fa.json` — same `CommentConsent` key changes, mirrored. Admin
  renders `StartAutomationMessage` too (via `TemplateForm.tsx`, same shared `packages/ui`
  component) and keeps its own copy of these keys. Admin's `en.json` has no `Automations`
  namespace at all (unused/stub), so left untouched.

## Out of scope

Everything past the ticket's "do now vs backlog" line — the smarter auto-disable logic for
this step (skip it when the first message already has a quick reply or mandatory-follow is
on) — was explicitly excluded per the reporter and needs its own follow-up ticket.

## Verification

- Targeted `vitest run`, all passing (33/33):
  - `packages/ui/src/automation-builder/Contents/__tests__/Contents.test.tsx` (25 tests)
  - `packages/ui/src/automation-builder/__tests__/AutomationBuilder.test.tsx` (6 tests)
  - `apps/dashboard/src/components/Automations/AutomationForm.test.tsx` (2 tests)
- `apps/admin/src/app/(main)/templates/__tests__/TemplateForm.test.tsx` re-run after the
  admin `fa.json` edit: 5/7 pass, same 2 pre-existing failures documented in
  `2026-08-01-contentTypePickerGrid.update.md` (confirmed identical on unmodified
  `merged-admin`) — no new regression from this change.
- **Manual browser verification done**, via a temp harness route (`dev-harness-bef162`,
  mounted `AutomationBuilder` directly with `isComment:true` + 2 text contents, removed
  before commit) against the dashboard dev server on port 3311: new title/description text
  render correctly; DOM measurement confirmed the help-icon `<span>` and delete `<button>`
  both render within the (now `relative`) header's bounds, not escaping elsewhere; clicking
  the new delete icon opens the "این پیام قابل حذف نیست" dialog with the exact requested
  title/description/close text.
