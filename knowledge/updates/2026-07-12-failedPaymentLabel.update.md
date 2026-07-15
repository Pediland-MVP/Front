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

- `pnpm --filter admin test -- "src/labels/"` (Back) — 11/11 suites, 102/102
  tests pass.
- `nest build` (Back, admin app) — clean.
- `pnpm --filter admin exec tsc --noEmit` (Front) — 0 new errors.
- Statically traced end-to-end: `failedPayments` is in `LABEL_FIELDS`, has a
  registry entry, and `getFieldCatalog()` iterates `LABEL_FIELDS` so it will
  auto-surface in `GET /labels/fields` and the rule builder's field dropdown.
- **Not yet done — pending before release:** a live check (start the admin
  API against a real DB, confirm `failedPayments` in the `GET /labels/fields`
  response, save a `failedPayments >= 1` rule in the rule builder UI).
