# Product Price Max Bound (2026-08-13)

Frontend half of the backend `bigint` money-column fix. Backend note:
`Back/knowledge/updates/2026-08-13-moneyColumnsToBigint.update.md`. API contract:
`Back/knowledge/front-back-relations.md` → "Product Money Bounds".

## Problem

Saving a product with a price above ~2.1 billion Toman failed with a **generic** error. The
backend column was Postgres `integer`, so the value overflowed at the database and came back
as a raw `QueryFailedError` — which has no `code` field. `toast.error(t_ec(errorMessage?.code))`
therefore had nothing to translate, so the user got no idea what was wrong with their input.

The form had no upper bound of its own either: `price` and `discountPrice` were
`z.union([z.number().int().nonnegative(), z.nan()])`, with `superRefine` checks only for the
**lower** bound (`< 1000`) and discount-vs-price.

## Solution

The backend now accepts prices up to 999,999,999,999 Toman and rejects anything larger with
a proper coded error. On this side:

1. Add the three new error-code translations so a server-side rejection is readable.
2. Mirror the cap in the form's `superRefine`, so the user gets inline feedback while typing
   instead of losing a round-trip.

## Changes

| File | Change |
|---|---|
| `apps/dashboard/src/constants/money.constant.ts` | **New.** `MAX_MONEY_AMOUNT = 999_999_999_999`, documented as needing to stay in sync with `Back/apps/core/src/common/constants/money.const.ts`. |
| `apps/dashboard/src/components/Products/ProductForm.tsx` | Two new `superRefine` issues: `price > MAX_MONEY_AMOUNT` and `discountPrice > MAX_MONEY_AMOUNT`, each with an i18n message carrying the formatted cap. |
| `apps/dashboard/src/messages/fa.json` | New `Products.Form.price.errors.tooLarge` and `Products.Form.discountPrice.errors.tooLarge`, both interpolating `{max}`. |
| `apps/dashboard/src/messages/fa/ErrorCodes.json` | New `ERROR_CODES`: `PRODUCT_PRICE_TOO_LARGE`, `PRODUCT_PRICE_SHOULD_BE_POSITIVE`, `PRODUCT_DISCOUNT_PRICE_TOO_LARGE`, and `ORDER_QUANTITY_INVALID` (see below). |

`fa/ErrorCodes.json` is the **authoritative** file for `ERROR_CODES`: `i18n/request.ts`
shallow-spreads it over `fa.json` (`{...fa.json, ...fa/ErrorCodes.json}`), so its `ERROR_CODES`
key fully **replaces** the one in `fa.json` instead of deep-merging. Adding a code only to
`fa.json` would leave it untranslated in the running app.

## Order quantity bounds (same branch)

The paired Back branch also closed a hole in `createOrder.dto.ts`: `quantity` on the public
`POST /orders/:shopId` had no minimum, maximum, or integer check, and a negative value passed
the stock gate too — producing a negative order total. It now requires a whole number between
1 and `MAX_PRODUCT_IN_ORDER` (10).

- Added `ORDER_QUANTITY_INVALID` (non-integer or below 1) to `fa/ErrorCodes.json`.
- Over-cap reuses the existing `ORDER_QUANTITY_IS_MAX`, which was already translated.

No payload change was needed — `(Shop)/[shopId]/[productId]/order/hooks/useOrder.ts` already
posts a single line item with the stepper's quantity.

**Open follow-up:** the checkout's +/− stepper does not stop at `MAX_PRODUCT_IN_ORDER`, so a
buyer can still submit a quantity the API will now reject. The backend `canQuantityUp`
endpoint exists to answer exactly this and should gate the stepper.

Per CLAUDE.md §8 only `fa.json` gets the new keys; `en.json` is translated later.

### Note on `formatNumber`

The cap is interpolated with `MAX_MONEY_AMOUNT.toLocaleString('en-US')` rather than the
project's `formatNumber` helper. `formatNumber` is declared as returning
`string | number | null`, and next-intl's message values do not accept `null`, so passing it
directly would be a type error even though the runtime value is always a string here.

## Verification

- Both edited JSON files parse (`json.load`).
- Existing lower-bound and discount-vs-price rules are untouched — only two new checks were
  appended inside the same `superRefine`.
- Backend side verified separately: 29 unit tests pass, including the exact 3,423,421,415
  price from the original bug report.

## Follow-up

`GET /stats/overall`'s `sales.total` still arrives as a JSON number — the backend changed its
SQL cast to `::bigint` but parses it back with `Number(...)`, so no frontend change was needed
there. If that field ever starts arriving as a string, this is the reason to check.
