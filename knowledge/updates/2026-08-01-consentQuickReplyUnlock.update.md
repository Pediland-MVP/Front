# 2026-08-01 — Unlock the CONSENT quick reply once nothing is left to protect (BEF-142)

Linear issue: [BEF-142 — quick replay](https://linear.app/befrooshapp/issue/BEF-142/quick-replay)
Reference docs: `2026-07-18-autoConsentQuickReply.update.md` (the auto-insert),
`2026-07-18-lockConsentQuickReply.update.md` (the lock this fixes)
Reference code: `packages/ui/src/automation-builder/Contents/ContentButtonsItem.tsx`

## Problem

Two rules added on 2026-07-18 could trap the user with a quick reply they were
never able to delete:

- **Auto-add** (`Contents.tsx`) — a TEXT content that is not last and has **at
  least one** quick reply gets a `CONSENT` ("مکث و ادامه") button prepended, so
  Instagram doesn't hide that content's buttons. It never removes one.
- **Lock** (`ContentButtonsItem.tsx`) — a `CONSENT` quick reply on a TEXT
  content with a following content could not be removed at all; the trash
  control opened the `consent_locked_*` explanation dialog instead.

The lock only looked at the content's **position** in the array. It never
checked whether the quick replies it exists to protect were still there:

1. `contents = [TEXT #1, <any> #2]`.
2. On #1 the user adds a quick reply of type **"اجرای یک پیام خودکار"**
   (`START_AUTOMATION`) → auto-add fires → `[CONSENT, START_AUTOMATION]`.
3. The user deletes the `START_AUTOMATION` row → `[CONSENT]`. Auto-add does not
   re-add (a `CONSENT` is already there) and never removes.
4. The user clicks trash on the leftover `CONSENT` → still locked, because #2
   still follows. **Dead end.**

The only escape was: delete content #2 → the lock lifts → delete the `CONSENT`
→ re-add content #2.

This was not only a UI annoyance. A lone `CONSENT` still drives
`shouldPauseForConsent` at send time
(`Back/apps/core/src/contentCycle/contentCycle.service.ts`), so the user was
forced to publish an automation that stops mid-flow and waits for the customer
to tap "ادامه".

## Solution

`isLockedConsentButton` gains one more condition: the content must still have
**at least one non-`CONSENT` quick reply**. That is the only situation where
Instagram's hide-the-buttons behaviour can bite, so it is the only situation
worth locking for.

```ts
const hasProtectedQuickReply = (parentContents?.[contentIndex]?.quickReplies ?? []).some(
  (quickReply) => quickReply?.postbackPayloadType !== ButtonTypeEnum.CONSENT,
);

const isLockedConsentButton =
  contentType === 'text' &&
  postbackPayloadType === ButtonTypeEnum.CONSENT &&
  hasNextContent &&
  hasProtectedQuickReply;
```

Notes on the details:

- It reads the **already-watched** `parentContents` array (`useWatch` on
  `contents`) instead of adding a second subscription, so the "is there a next
  content" and "is there anything to protect" halves always come from the same
  render snapshot.
- `contentType === 'text'` always maps to `contents.N.quickReplies` — the only
  caller that passes `fieldNameOverride` is `VitrinContent`, and it passes
  `contentType="vitrin"`, which this lock never applies to.
- A quick reply with **no `postbackPayloadType` yet** is a row the user just
  added via "add button" and has not typed. It counts as something to protect,
  so the lock stays on. "Nothing left to protect" means an empty list, not
  "no typed buttons".

No add/delete fight loop: after the last quick reply is deleted the array is
empty, and the auto-add effect's first guard is
`if (quickReplies.length === 0 || quickReplies.length >= 13) return;`.

No backend change, and no new dead end at submit time — an empty
`quickReplies` is valid on both sides: `z.array(ButtonSchema).optional().nullable()`
in `schemas/automationForm.ts` (the "at least one" rule is scoped to
`validationType === Selectbox` question contents), and `@IsOptional()` +
`@ArrayMaxSize(13)` with no minimum on `ContentCycleContentDto.quickReplies`.

## Changes

- `packages/ui/src/automation-builder/Contents/ContentButtonsItem.tsx` — typed
  the `parentContents` `useWatch` result, added `hasProtectedQuickReply`, and
  added it to `isLockedConsentButton`.

## Verification

`packages/ui/src/automation-builder/Contents/__tests__/ContentButtonsItem.test.tsx`:

- **Updated** the existing lock test — it asserted the lock on a content whose
  **only** quick reply was the `CONSENT` one, which is exactly the case this
  fix makes removable. It now carries a second `START_AUTOMATION` quick reply,
  so it still covers a genuine lock.
- **New** — removes the `CONSENT` quick reply when it is the only one left even
  though another content follows it (the BEF-142 regression).
- **New** — keeps the lock when the only other quick reply has no type picked
  yet.

Red/green confirmed: with the `ContentButtonsItem.tsx` change stashed, only the
new BEF-142 test fails (9/10 pass) — the two lock-preserving tests pass without
the fix, so they are not passing by accident.

`pnpm vitest run src/automation-builder/Contents/__tests__/ContentButtonsItem.test.tsx src/automation-builder/Contents/__tests__/Contents.test.tsx`
(from `packages/ui`) — **35/35 pass** (10 + 25).

Not yet verified in a browser.
