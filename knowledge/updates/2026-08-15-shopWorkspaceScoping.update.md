# Shop checkout — `shop.user` → `shop.workspace` (2026-08-15)

Reference docs: `knowledge/front-back-relations.md` (Shop / Orders sections).
Back side: `Back/knowledge/updates/2026-08-15-shopWorkspaceScoping.update.md`.

Branch: `fix/shop-workspace-scoping` (Back + Front, same branch name).
**Ship both together** — this is a payload shape change.

## Problem

The backend user → workspace refactor changed the `GET /shops/:shopId` payload:
payment details moved from `shop.user.paymentDetail` to
`shop.workspace.paymentDetail`. The dashboard was never updated, so it still
read `shop.user.paymentDetail`.

On its own this made the checkout payment step show no payment methods. In
practice the page failed earlier — `GET /shops/:shopId` itself threw on the
backend (see the Back update doc), so the shop never loaded at all.

`IShop` still declared `user`, so TypeScript agreed with the stale reads and
flagged nothing.

## Solution

Rename the field on the type and at every read site. No logic change — the
shape is identical, only the parent key differs.

## Changes

| File | Change |
| --- | --- |
| `apps/dashboard/src/types/shops/shop.ts` | `IShop.user: User` → `IShop.workspace: Workspace`; interface `User` renamed to `Workspace` |
| `apps/dashboard/src/app/(Shop)/[shopId]/[productId]/order/components/payment.tsx` | 6 reads `shop?.user…` → `shop?.workspace…` (card-to-card block, Zarinpal block, disabled states) |
| `apps/dashboard/src/components/Shop/CheckoutPage.tsx` | 2 reads in the payment-method auto-select branch |
| `apps/dashboard/src/messages/fa.json` | added `ERROR_CODES.EXCEL_EXPORT_WORKSPACE_REQUIRED` for the new backend error code |

## Verification

- `pnpm --filter front exec tsc --noEmit` — the three edited files report no
  errors. Remaining errors are pre-existing (`packages/ui` typing, `Badge`
  children, `components/index.ts` barrel) and also present on `merged-admin`.
- `fa.json` re-parsed as valid JSON.

## Notes

- Per repo rule §8 only `fa.json` gets the new key; `en.json` is translated later.
- The dashboard also calls `GET/POST/PUT /vitrin` from
  `(Console)/products/[id]/product.tsx` and `components/Products/ProductForm.tsx`.
  Those routes had been deleted backend-side and are restored on the Back branch
  — no frontend change was needed, but they only work once Back ships.
