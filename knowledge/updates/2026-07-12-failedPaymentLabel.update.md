# 2026-07-12 Failed-Payment Label Field

Full reference: `Back/knowledge/admin/labels/labels.doc.md` (§3 per-field
sources table, §18 scale notes).

## Problem

Admins had no way to label or filter users by failed subscription-payment
attempts in the rule-based user-labeling engine.

## Solution

Added `failedPayments` as a new numeric labeling factor: an all-time count
of the user's `invoice` rows with `type = 'subscription'` and
`status = 'failed'`, read directly by `invoice.userId` (no workspace join).
Rules can now use e.g. `failedPayments >= 3`.

## Changes

- `Back/packages/common/src/domain/labelRule.ts` — new `LabelField`
  literal `'failedPayments'`.
- `Back/apps/admin/src/labels/labelFields.registry.ts` — new `FactSource`
  `'invoices'`; `failedPayments: num('invoices')`.
- `Back/apps/admin/src/labels/labelFacts.service.ts` — new
  `invoices` branch in `computeForUserIds`.
- `Front/apps/admin/src/messages/fa.json` — `Labels.fieldNames.failedPayments`.

## Verification

- `pnpm --filter admin test -- "src/labels/"` (Back) — all label suites pass.
- `nest build` (Back, admin app) — clean.
- Field appears in `GET /labels/fields` catalog and in the admin rule
  builder's field dropdown.
