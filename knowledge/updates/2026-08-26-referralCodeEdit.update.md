# Admin Referral Codes — Edit Dialog + Gift Plan Column (2026-08-26)

Follows `2026-08-26-referralPlanGift.update.md`. Full reference:
`Back/knowledge/updates/2026-08-26-referralCodeEdit.update.md` and
`Back/knowledge/front-back-relations.md`.

## Problem

1. **A referral code could not be edited at all** — the page only had a create dialog, and the
   backend had no update route. A typo'd code, a wrong owner, or a gift pointing at the wrong
   plan duration needed a manual DB write.
2. The gifted plan was rendered inside the discount column, so a `PLAN` row showed
   `حرفه‌ای — ۳ ماهه` under a header reading "تخفیف".

## Solution

The create form was extracted into one dialog used for **both** create and edit, so the two are
identical by construction rather than by copy. The table gained a dedicated gift column and a
per-row edit button.

Edit prefills from the row already loaded in the list, so no `GET /referral-codes/:id` endpoint
was needed — only the new `PATCH /referral-codes/:id`.

## Changes

- `app/(main)/referral-codes/referral-code-form-dialog.tsx` **(new)** — the whole form, with
  `isEdit = !!referralCode`. Same fields, same validation, same PLAN plan→duration cascade as
  create; submits `POST` or `PATCH` accordingly and swaps the title/button label. `FormSchema`
  moved here from `referral-codes-table.tsx` (the vitest spec's import was updated).
- `app/(main)/referral-codes/referral-codes-table.tsx` — reduced to the table plus dialog
  wiring. Holds `editing: ReferralCode | undefined`; the create button clears it first, so
  create never opens with a previous row's values still in the form.
- `app/(main)/referral-codes/columns.tsx` — `columns` const became a `makeColumns({ onEdit })`
  factory so rows can reach the dialog. New `پلن هدیه` column showing `plan — duration`; the
  discount column shows only the discount again (`—` for `PLAN`, which stores `discount 0`);
  new trailing actions column with a pencil button.
- `messages/fa.json` — `ERROR_CODES.REFERRALCODE_NOTFOUND`.

### Gotcha: the prefilled plan vs. the reset-on-plan-change effect

Create clears `planDurationId` whenever `planId` changes, because a duration belongs to exactly
one plan. On edit that effect fires on first render and would wipe the duration just prefilled
from the row. It now tracks a `seededPlanId`, skips the first run after the dialog opens, and
resets that tracker on close.

### Note on scope

Everything is editable including `code` and the owner's `mobile`, and a code people have already
redeemed can be edited with no warning — both explicit product decisions. Nothing is
retroactive: already-granted gifts and existing referral links are untouched, so an edit only
affects future signups.

## Verification

- `npx vitest run 'src/app/(main)/referral-codes'` — **9/9 passing** (schema spec, re-pointed at
  the new module).
- `npx tsc --noEmit` (apps/admin) — **118 errors, byte-identical to the pre-change baseline**;
  none in `referral-codes`.
- `npx eslint 'src/app/(main)/referral-codes'` — clean.

## Not covered

- No manual/browser smoke test of the edit dialog.
- No used-count shown when editing a redeemed code (deliberate).
- The page still hardcodes its Persian strings (predates CLAUDE.md §8); only the error path uses
  `t_ec`.
