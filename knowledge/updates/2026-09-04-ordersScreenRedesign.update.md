# 2026-09-04 — Orders screen redesign (`/products/orders` + detail)

Full design reasoning: `docs/superpowers/specs/2026-09-04-orders-screen-redesign-design.md`.

**Supersedes `knowledge/updates/2026-09-04-ordersPageRefactor.update.md`.** That doc — written
**one day earlier**, the same day as this one's predecessor commit — turned `/products/orders`
into a `md:2 lg:3 2xl:4` card **grid**. This pass replaces the grid entirely; the presentation
lessons that doc recorded (three fixed bands, `md:overflow-hidden`/`md:min-h-0`, the loading/error
state ordering, the phone-safe filter bar) are unchanged and not repeated here.

## Problem

Two complaints, both about deciding fast, from the design spec:

- **The list was a card grid.** A grid is right for browsing a catalogue and wrong for a work
  queue: an order is a row of facts a seller compares *across* orders — who, when, how much, paid
  or not — and a grid puts every fact in a different place on screen. Worse, the one image a
  seller actually has to **judge** (the کارت‌به‌کارت receipt) was not on the list at all, so
  clearing a batch of `awaiting_review` orders meant opening every one of them.
- **The detail page was one flat grey column** of five `border-t` sections in the order the data
  was written, not the order a decision needs it — the action buttons sat at the bottom, so
  approving a payment meant scrolling past the address and every line item first. Status changes
  were six sibling buttons, two of which (`approve`, `markPaid`) fired on a single click with no
  confirmation.

## Solution

### Back: expose the receipt on the list read

`GET /commerce/orders` now returns `OrderListView` (`OrderView` + `receiptUrl`/`receiptCount`) —
see the paired Back doc, `Back/knowledge/updates/2026-09-04-orderListViewReceipts.update.md`, for
the mapper/service side. `toOrderView` itself is untouched; buyer-facing reads and
`CheckoutService` still never see a receipt url.

### Front: the list — grid to table

`OrderCard.tsx` is deleted. Two new renderings replace it, both consuming the same order:

- **`OrdersTable.tsx`** (`md` and up) — a real six-column `<table>`: کالا · گیرنده · تاریخ ثبت ·
  مبلغ کل · پرداخت · وضعیت. No id column — `CommerceOrder` has only a UUID, and a hex fragment is
  not something a Persian-speaking seller reads aloud; a real order-number column was rejected as
  a schema change past the scope of a UI pass.
- **`OrderRowCard.tsx`** (below `md`) — the compact row-card equivalent, same fields, stacked.

Switching between the two is **CSS** (`hidden md:table` / `md:hidden`), not a `useMediaQuery`
hook. A hook reads `window` after mount, so the very first render (server-rendered, then
hydrated) paints the wrong layout for that viewport and visibly flashes into the right one; a CSS
media query has no such first-paint state — both trees exist in the DOM and the browser picks the
visible one before anything is painted.

**`orderRowFields.ts`** is the single place that derives `firstLine`, `extraLines` (distinct lines
beyond the first — deliberately **not** `itemCount`, which sums quantity, so three of the same
shirt is one line and shows no `+N`), `itemCount`, `paymentMethodKey`, `isPaid`, `isPickup` from
one `OrderView`. Both `OrdersTable` and `OrderRowCard` call it instead of each computing its own
copy — the reason the two renderings cannot drift apart from each other over time.

Both thumbnails (product image + the newest کارت‌به‌کارت receipt) render via `OrderThumbs.tsx`.
The receipt thumbnail opens `ReceiptLightbox` in place (`stopPropagation`, since the row itself is
the `/products/orders/[id]` click target) — a seller can now judge and clear a batch of
`awaiting_review` orders straight from the list.

### Front: the detail page — rail-first layout

`OrderDetail.tsx` becomes `lg:grid-cols-[1fr_320px]`. The rail (`OrderSummaryRail.tsx`) is
declared **first** in the DOM and pushed to the second (right) column on `lg`+ via `lg:order-2`.
Below `lg` there is no reordering, so the rail — status, totals, receipt, the status select and
the update/mark-paid buttons — is the first thing on the page at every width. This is deliberate:
**source order is what a phone and a screen reader follow; visual order (`order-2`) is what
desktop's wider viewport can afford to override.** Getting this backwards (rail last in the DOM,
positioned first only via CSS) would give a phone user and a screen-reader user the same
bottom-of-page action bar the old flat-column layout had.

Three new reference cards sit beside the rail: `OrderBuyerCard.tsx` (recipient/address/shipping
method), `OrderItemsCard.tsx` (line items), `OrderTotalsCard.tsx` (items/shipping/grand). Each is
a real `Card` with `bg-card` and a border — this is what fixes "reads as a single grey slab."
`OrderActions.tsx` is deleted; the mobile sticky action bar (`data-testid="order-actions-bar"`) is
removed too, since the rail is now first on a phone and pinning the same control to the bottom as
well would show it twice.

### The status select

Six sibling buttons become one `<Select>` of legal target **statuses** plus a «بروزرسانی» button
that opens a transition-specific confirmation dialog. Two new `orderTransitions.ts` exports carry
this:

- **`targetStatusesFor(order)`** — the statuses this order may legally move to, derived from the
  existing `actionsFor(order)` (not from `ACTIONS_BY_STATUS` directly), so the digital-order
  `ship` filter — and the unbreakable retry loop its docstring describes — keeps working with no
  second rule to maintain.
- **`actionForTransition(from, to)`** — the inverse: turns the `(from, to)` pair the select
  produces back into the action name and, from that, the right dialog. Returns `null` for
  `from === to`, which is what disables «بروزرسانی».

**«لغو شده» is reachable by two different actions depending on where the order is now**, and the
select has to resolve which: `reject` from `awaiting_review` (no money has been accepted yet; the
buyer is told why, via `RejectPaymentDialog`, reason required, ≤500 chars) versus `cancel` from
`processing`/`sending` (the courier came back with the goods, so `CancelOrderDialog` warns that
stock is restocked). Picking the wrong one would fire the wrong endpoint with the wrong prompt.

On a terminal order (`completed`, `cancelled`), `targetStatusesFor` is empty and the select renders
disabled at its current value.

### Two deliberate behaviour changes

1. **`approve` now requires confirmation.** It used to fire on a single click. It is the money
   decision on this screen, and routing it through the same select → confirm path as every other
   transition — rather than special-casing it as the one silent one — is the point of the select
   redesign.
2. **`markPaid` gained a confirmation dialog.** It stays outside the select (it is settlement, not
   status — its only backend guard is `paidAt IS NULL`, and gating it on status would hide it where
   it is legal), but it is now irreversible-by-mistake-proof: there is no un-mark endpoint, so a
   stray tap used to permanently settle an order with no way back. Flagged for the user; revert to
   one-click on request if it turns out to slow sellers down more than it protects them.

## Known limitation — a pickup order cannot say where to collect

Surfaced by the `commerce-direct` merge that landed «تحویل حضوری» on this branch; **not fixed
here**, and not new to this pass.

`pickupAddress` lives only on `commerce_shipping_option` — the live, mutable merchant config.
`commerce_order` freezes `shippingTitle`/`shippingKind`/`shippingSettlement` at promotion but
stores **no `shippingOptionId`**, so there is no path from a placed order back to its collection
address — not even a live lookup, since the option that generated it may since have been renamed,
re-priced or deleted. Rendering the buyer's home postal address under a pickup order would be
actively misleading: for pickup it is not a delivery destination at all.

`OrderBuyerCard.tsx` special-cases `shippingKind === 'pickup'`: it never shows the buyer's address
as though it were the collection point, and states plainly that the collection point is not
recorded on the order. **Real fix, out of scope here:** freeze `shippingPickupAddress` onto
`commerce_order` at promotion time — a new column + migration + backfill, tracked as a separate
follow-up task.

## Changes

| File | Change |
|---|---|
| `apps/core/src/commerce/orders/orderView.mapper.ts` (Back) | `OrderListView` + `toOrderListView`, sharing `mapReceipts` with `toOrderDetailView` |
| `apps/core/src/commerce/orders/orderRead.service.ts` (Back) | `hydrateForSeller` (`SELLER_LIST_RELATIONS = ['lines', 'receipts']`), used by `readManyForWorkspace` |
| `apps/dashboard/src/components/Commerce/Orders/OrdersTable.tsx` *(new)* | `md`+ six-column table |
| `apps/dashboard/src/components/Commerce/Orders/OrderRowCard.tsx` *(new)* | below-`md` row-card |
| `apps/dashboard/src/components/Commerce/Orders/OrderThumbs.tsx` *(new)* | product + receipt thumbnails, receipt opens `ReceiptLightbox` in place |
| `apps/dashboard/src/components/Commerce/Orders/orderRowFields.ts` *(new)* | shared derivation for both renderings |
| `apps/dashboard/src/components/Commerce/Orders/OrdersListPage.tsx` | swaps the grid for the two renderings; three-band layout/filters/pagination untouched |
| ~~`OrderCard.tsx`~~ | deleted |
| `apps/dashboard/src/components/Commerce/Orders/OrderSummaryRail.tsx` *(new)* | sticky rail: status, totals, receipt, status select, «بروزرسانی», «ثبت پرداخت» |
| `apps/dashboard/src/components/Commerce/Orders/OrderBuyerCard.tsx` *(new)* | recipient/address/shipping method, pickup special-case |
| `apps/dashboard/src/components/Commerce/Orders/OrderItemsCard.tsx` *(new)* | line items |
| `apps/dashboard/src/components/Commerce/Orders/OrderTotalsCard.tsx` *(new)* | items/shipping/grand |
| `apps/dashboard/src/components/Commerce/Orders/OrderStatusUpdater.tsx` *(new)* | select + update button + dialog orchestration |
| `apps/dashboard/src/components/Commerce/Orders/OrderDetail.tsx` | reduced to `lg:grid-cols-[1fr_320px]` layout + composition |
| ~~`OrderActions.tsx`~~ | deleted |
| `apps/dashboard/src/components/Commerce/Orders/orderTransitions.ts` | + `targetStatusesFor`, `actionForTransition` |
| `apps/dashboard/src/types/commerceOrders.ts` | + `OrderListView` |
| `apps/dashboard/src/messages/fa.json` | new `Commerce.Orders` keys: `table.*`, `statusUpdate.*`, `payment.paid`/`payment.unpaid`, `receipts.thumbAlt`, `dialogs.markPaid.*` (fa.json only, per CLAUDE.md §8) |

**Orphaned key left in `fa.json`:** `Commerce.Orders.detail.notPaid` (`"هنوز پرداخت تایید نشده"`,
line ~3045) is no longer read anywhere in the component tree — `OrderSummaryRail`/`OrderBuyerCard`
render paid state through `orderRowFields.isPaid` and the new `payment.paid`/`payment.unpaid` pair
instead. Left in place rather than deleted, since a dead translation key costs nothing to keep and
this pass did not go looking for other orphans.

Unchanged: `OrderStatusBadge`, `ReceiptStrip`, `ReceiptLightbox`, `dialogs/*`
(`ConfirmActionDialog`, `RejectPaymentDialog`, `CancelOrderDialog`), `OrdersExportDrawer`, the
legacy `/orders` screen, `orderTransitions.ts`'s existing `ACTIONS_BY_STATUS`/`actionsFor`/
`canMarkPaid`/`hasAnyAction`, the URL-backed filters and `filtersFromParams`/`dateFromIso`/
`isoFromDate`/`DEFAULT_LIMIT`, and everything under `packages/`.

## Verification

- Back: `npx jest src/commerce/orders --runInBand` — **12 suites / 188 tests pass**.
- Back: `pnpm --filter core exec tsc --noEmit` — **63 errors**, the app's existing baseline
  (matches the "steady at the 63-error baseline" note already carried in `WORKTREES.md`); zero of
  them touch any `commerce/orders` file.
- Front: `npx vitest run src/components/Commerce/` — **40 files / 434 tests pass**.
- Front: `npx tsc --noEmit 2>&1 | grep -cE 'error TS'` — **206**, exactly at the measured baseline
  ceiling this task was told not to exceed; zero of them touch any `Commerce/Orders` file.
- **Not yet verified in a browser at any width.** Per the task brief, a manual pass is needed at
  phone/`md`/`lg`+ covering: the receipt lightbox opening from a list row without navigating to
  the detail page; the table→row-card switch exactly at `md`; the rail sticking on desktop and
  sitting first (above the reference cards) on a phone; and a «لغو شده» selection asking for a
  reason from `awaiting_review` but warning about restock from `processing`/`sending`.
