# 2026-07-18 — Lock the CONSENT quick reply while a content follows it

Reference doc: `docs/superpowers/specs/2026-07-18-auto-consent-quickreply-design.md`
(this is a direct follow-up to that auto-insert feature)
Reference code: `packages/ui/src/automation-builder/Contents/ContentButtonsItem.tsx`

## Problem

`2026-07-18-autoConsentQuickReply.update.md` auto-inserts a `CONSENT` quick
reply ("مکث و ادامه") on a TEXT content whenever it has quick replies and is
no longer the last content — required so Instagram doesn't hide that
content's buttons once another content follows it. That auto-insert was
deliberately "add-only" (no auto-removal), on the assumption a user deleting
it manually was an acceptable trade-off.

That assumption changed: a user can delete the `CONSENT` button via the
normal remove (trash) control while the content still has something after
it, silently reintroducing the exact Instagram bug the auto-insert exists to
prevent, with no explanation of why.

## Solution

`ButtonContentItem` (the per-quick-reply/button row) now locks removal for
any `CONSENT` quick reply on a TEXT content that still has a following
content — regardless of whether that button was auto-added or added by the
user; the risk of removing it is identical either way. "Has a following
content" reuses the same array-position check as the auto-insert effect:
`useWatch` on the parent `contents` array (only in `mode === AUTOMATION`; the
`reminders` array is out of scope, same as the auto-insert feature) compared
against `contentIndex`.

Clicking remove on a locked button no longer calls `remove(index)` — it opens
an `AlertDialog` explaining why, with the exact copy the user specified:

> به دلیل قوانین اینستاگرام اگر در ادامه یک پیام حاوی پاسخ سریع، محتواهای
> دیگری بفرستید، دکمه‌های پاسخ سریع پیام شما نمایش داده نمیشود. با وجود یک
> پاسخ سریع از نوع مکث و ادامه جلوی این اتفاق گرفته میشود. با زدن کاربر روی
> دکمه مکث و ادامه، باقی محتواها ارسال میشود

Once the content becomes last again (e.g. the following content is deleted),
the same button becomes removable normally — the lock is a live computed
condition, not a stored flag.

Three new keys under `Automations.Contents.Button` in both dashboard and
admin `fa.json`: `consent_locked_title`, `consent_locked_description`,
`consent_locked_close`.

## Changes

- `packages/ui/src/automation-builder/Contents/ContentButtonsItem.tsx` —
  added the lock condition, a `removeHandler` that branches on it, and the
  `AlertDialog` (same pattern as `DelayBudgetExhaustedDialog.tsx`).
- `apps/dashboard/src/messages/fa.json`, `apps/admin/src/messages/fa.json` —
  3 new keys each.

## Verification

- New tests in `packages/ui/src/automation-builder/Contents/__tests__/ContentButtonsItem.test.tsx`
  (describe block "ButtonContentItem — locked CONSENT quick reply", 3 cases):
  shows the dialog and does not remove when a `CONSENT` button has a
  following content; removes normally when it's the last content; removes
  normally for a non-`CONSENT` button even with a following content.
- `pnpm vitest run src/automation-builder/Contents/__tests__/ContentButtonsItem.test.tsx`
  — 8/8 pass (5 pre-existing + 3 new).
- `pnpm vitest run src/automation-builder/Contents/__tests__/Contents.test.tsx`
  — 20/20 pass, unchanged (checked for regressions since it renders this
  component transitively and shares the same CONSENT logic).
- Not yet manually verified in a browser.
