# Admin Referral Codes — Gift a Subscription (`PLAN` type) (2026-08-26)

Full reference: `Back/knowledge/front-back-relations.md` §"Referral Codes —
gift-a-subscription (`PLAN` type)" and `Back/knowledge/updates/2026-08-26-referralPlanGift.update.md`.

## Problem

The admin `/referral-codes` create dialog only offered `درصدی` (PERCENTAGE) and
`مبلغ ثابت` (FIXED). A third type — `PLAN`, which gifts a subscription to the referred user —
existed in the backend enum, in the `referral_code` table, and was fully honoured by core at
signup, but there was no way to create such a code from the panel. The list already showed a
`پلن` type label, yet rendered that row's (always-zero) discount number beside it.

## Solution

Added `PLAN` to the create dialog with a cascading plan → duration picker, and made the list
show which subscription a `PLAN` code gifts.

When `PLAN` is selected the dialog hides `discount`, `سقف تخفیف`, `حداقل تخفیف` and
`حداکثر دفعات استفاده` — the backend forces those to `0 / null / 1` — and submits only
`{ code, mobile, type, planDurationId }`. A short note under the picker explains that the
referred user receives the subscription at signup and it activates once they connect their
Instagram page.

## Changes

- `apps/admin/src/app/(main)/referral-codes/referral-codes-table.tsx`
  - `PLAN` added to the type select as `پلن (هدیه)`.
  - Plan and duration selects driven by `useSWR('/plans')` and
    `useSWR('/plans/planDurations?planId=…')`, the same cascade as
    `components/customer/AddSubscriptionDialog.tsx`. Both are conditional keys, so nothing is
    fetched until the admin actually picks `PLAN`.
  - A `useEffect` clears `planDurationId` when the selected plan changes — a duration belongs
    to exactly one plan, so a stale selection must not survive the switch.
  - Money fields hidden for `PLAN`; payload built per type.
  - Error toast now uses `t_ec` (`useTranslations('ERROR_CODES')`) instead of hardcoded
    per-code strings (CLAUDE.md §10).
  - `FormSchema` exported so it can be unit-tested.
- `apps/admin/src/app/(main)/referral-codes/columns.tsx`
  - `ReferralCode` type gained an optional `planDuration` (with nested `plan`), which
    `GET /referral-codes` now returns.
  - The discount column renders the gifted plan + duration name for `PLAN` rows (`—` when the
    relation is missing) and is retitled `تخفیف / هدیه`. Type label refined to `پلن (هدیه)`.
- `apps/admin/src/messages/fa.json` — added `ERROR_CODES.REFERRALCODE_ALREADY_EXISTS`.
  `PLAN_DURATION_NOT_FOUND` was already there.
- `apps/admin/src/app/(main)/referral-codes/__tests__/referral-code-form-schema.test.ts` — new.

### Zod gotcha worth remembering

`discount` is `z.number().optional()` with the "must be positive" rule in `superRefine`, not
`z.number().positive().optional()`. A field-level failure aborts the object parse before
`superRefine` runs, so the form's default `discount: 0` would have failed validation on an
input that is *hidden* for `PLAN` — an unsubmittable form showing no error. There is a
regression test named for this.

## Verification

- `npx vitest run src/app/(main)/referral-codes` — **9/9 passing** (4 `PLAN` cases, 5 discount
  cases). The zero-discount regression test was confirmed to fail when `.positive()` is put
  back on the field, and to pass again once reverted.
- `npx tsc --noEmit` (apps/admin) — no errors in `referral-codes`. The 118 reported errors are
  this app's known pre-existing baseline; `next build` runs with `ignoreBuildErrors`.
- `npx eslint` on both changed `referral-codes` files — clean.

## Not covered

- No manual/browser smoke test of the dialog was run.
- The rest of this page still hardcodes its Persian strings (it predates CLAUDE.md §8); only
  the error path moved onto `t_ec`. Migrating the whole page to i18n is a separate follow-up.
