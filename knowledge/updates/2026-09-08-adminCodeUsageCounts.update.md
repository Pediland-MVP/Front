# 2026-09-08 — Admin referral/discount code tables show user counts

Related: `Back/knowledge/front-back-relations.md` (section "Usage counts on the
admin list endpoints") for the backend side of this change.

## Problem

The admin `کدهای رفرال` (referral codes) and `کدهای تخفیف` (discount codes)
tables had no way to tell whether a code was ever used, or by how many people —
an admin had to query the database directly to check.

## Solution

Both `GET /referral-codes` and `GET /discount-codes` now return extra count
fields (see the Back doc above for how they're computed), so this change is
purely two new columns:

- `(main)/referral-codes/columns.tsx` — one new "تعداد کاربران" column
  reading `userCount` (distinct users who signed up with the code).
- `(main)/discount-codes/columns.tsx` — two new columns, "تعداد کاربران"
  (`userCount`, distinct users) and "تعداد استفاده" (`usageCount`, total
  redemptions). They can differ because `maxUsagePerUser` can let one user
  redeem more than once.

Both new fields are typed as required `number` on their row types since the
backend always sets them (defaulting to `0`), matching how every other numeric
column in these tables is handled; the cell renderers still fall back to `0`
defensively.

## Changes

| File | Change |
|---|---|
| `apps/admin/src/app/(main)/referral-codes/columns.tsx` | `userCount` field on the `ReferralCode` type + new column |
| `apps/admin/src/app/(main)/discount-codes/columns.tsx` | `userCount`/`usageCount` fields on the `DiscountCode` type + two new columns |

No API client changes — both tables already fetch their list via `useSWR` with
no field allowlist, so the new response fields pass straight through.

## Verification

- **Types**: `tsc --noEmit` on `apps/admin` shows no new errors on either
  touched file (the one pre-existing `Badge` type error on
  `discount-codes/columns.tsx` predates this change — see
  `packages/ui/src/components/ui/badge.tsx`, a known baseline issue).
- **Unit**: the only existing test under `referral-codes/` (
  `referral-code-form-schema.test.ts`, 9 tests) still passes — it doesn't touch
  `columns.tsx`. Neither directory has column-level test coverage to update.
- **Not verified in a running browser** — the user opted to skip spinning up
  the dev servers for this pass; verify visually before merging.
