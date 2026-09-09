# 2026-09-09 — Print a postal label and invoice from the order details dialog

Backend counterpart: `Back/knowledge/updates/2026-09-09-orderPrintDocuments.update.md`
(`ShopAddress` entity + routes, widened `GET /orders`). Backend reference docs:
`Back/knowledge/core/instagrams/shopAddress.doc.md`,
`Back/knowledge/core/orders/orderPrintPayload.doc.md`. Spec:
`docs/superpowers/specs/2026-09-08-order-print-documents-design.md`. Plan:
`docs/superpowers/plans/2026-09-09-order-print-documents.md`.

## Problem

There was no way to print a shipping label or a sales invoice for an order — a merchant had
to hand-write the postal label and had no invoice document to give a buyer at all.

## Solution

- A settings dialog (`ShopAddressDialog`, opened from `InstagramAccounts.tsx`) lets a seller
  save one address/postal code/phone/city/shipping-method per Instagram account — this is the
  فرستنده (sender) block printed on the label and the فروشنده (seller) block on the invoice.
  Read-only for `instagram:view`-only users (dialog opens, every field and the save button are
  disabled); editable for `instagram:manage`.
- Two print buttons on the order details dialog (`orderDetails.tsx`) build an A5 postal label
  and an A4 invoice as standalone HTML strings and print them through a hidden same-origin
  `<iframe>` (`printDocument.ts`) — not `@media print` on the page itself, because the order
  details live inside a Radix dialog rendered through a portal, and fighting that portal's own
  CSS/scroll/transform stack breaks differently per browser. The iframe is a fresh document
  with only the print stylesheet in it.
- The invoice sums **every** line item (`orderTotals.ts`'s `calculateOrderTotals`). The
  existing `getOrderPrices` in `@/utils/getOrderPrices` only reads `orderProducts[0]` and is
  deliberately left untouched — the order card and the details header still use it for their
  single-line summary; the invoice needed the real per-line/subtotal/shipping/payable totals
  and got its own helper instead of changing a function other UI depends on.
- Money amounts print with Persian digits (`toPersianDigits.ts`) and the payable total also
  prints in Persian words (`numberToPersianWords.ts`), for the legally-expected "amount in
  words" line on the invoice.
- New i18n namespaces in `messages/fa.json`: `Settings.ShopAddress` (12 keys — dialog labels)
  and `Orders.Print` (33 keys — every label used inside the printed documents; kept in sync by
  hand with `orderDetails.tsx`'s `PRINT_KEYS` array, since next-intl's `t` is not enumerable).

## Changes

| File | Change |
|---|---|
| `src/utils/numberToPersianWords.ts` | Number → Persian words, for the invoice's amount-in-words line |
| `src/utils/toPersianDigits.ts` | Latin → Persian digit rendering for printed output |
| `src/components/Orders/print/orderTotals.ts` | `calculateOrderTotals` — sums every order line (subtotal, shipping, discount, payable) |
| `src/components/Orders/print/documentStyles.ts` | Shared print CSS shell + `esc()` HTML-escaping helper (every printed field is user-controlled) |
| `src/components/Orders/print/buildLabelDocument.ts` | Builds the A5 postal label HTML; `orderReference()` short order id |
| `src/components/Orders/print/buildInvoiceDocument.ts` | Builds the A4 sales invoice HTML, using `orderTotals.ts` |
| `src/components/Orders/print/printDocument.ts` | Hidden same-origin iframe + `window.print()` |
| `src/components/Settings/ShopAddressDialog.tsx` | Sender-address form per Instagram account |
| `src/components/Settings/InstagramAccounts.tsx` | Trigger + wiring for `ShopAddressDialog` |
| `src/app/(Console)/orders/components/orderDetails.tsx` | "چاپ برچسب" / "چاپ فاکتور" buttons, `PRINT_KEYS` |
| `src/messages/fa.json` | `Settings.ShopAddress` (12 keys), `Orders.Print` (33 keys) |
| `src/types/instagram/shopAddress.ts` | `IShopAddress` type |

## Verification

- Unit tests: `numberToPersianWords.test.ts`, `orderTotals.test.ts`,
  `buildLabelDocument.test.ts`, `buildInvoiceDocument.test.ts`, `ShopAddressDialog.test.tsx`.
- This documentation pass re-read every cited file against the current worktree: the print
  components, `orderTotals.ts`'s "sums every line" claim against `getOrderPrices`'s
  single-item read, `ShopAddressDialog.tsx`'s form/reset/submit logic and its `canManage` gate,
  `orderDetails.tsx`'s `PRINT_KEYS` (33 entries), and `messages/fa.json` (`Orders.Print`: 33
  keys, `Settings.ShopAddress`: 12 keys — both confirmed by direct count).
