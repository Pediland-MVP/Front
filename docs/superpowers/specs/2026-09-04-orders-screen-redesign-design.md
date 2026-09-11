# 2026-09-04 — Orders screen redesign (`/products/orders` + detail)

Branch: `feat/commerce-product-core` (worktrees in **both** `Front` and `Back`).
Supersedes the presentation pass in `knowledge/updates/2026-09-04-ordersPageRefactor.update.md`,
which turned this screen into a card **grid** one day earlier. The feature itself (data, URL
filters, state machine) is specified in `docs/superpowers/specs/2026-09-02-buyInDirect-phase3b-design.md`
and is **not** re-specified here.

## Problem

Two complaints, both about deciding fast.

**The list** is a card grid (`md:2 lg:3 2xl:4`). A grid is right for browsing a catalogue and wrong
for a work queue: an order is a row of facts a seller compares *across* orders — who, when, how
much, paid or not — and a grid puts every fact in a different place on screen. Worse, the one image
a seller actually has to **judge** (the کارت‌به‌کارت receipt) is not on the list at all, so
clearing a batch of `awaiting_review` orders means opening every one of them.

**The detail page** is one flat column of five `border-t` sections with no `bg-card`, no cards and
no colour — it reads as a single grey slab. The order of the sections is the order the data was
written, not the order a decision needs it: the action buttons sit at the **bottom**, so approving a
payment means scrolling past the address and every line item first.

**Status changes** are six sibling buttons (`approve`, `reject`, `ship`, `complete`, `cancel`,
`markPaid`). Two of them (`approve`, `markPaid`) fire on a single click with no confirmation.

## Decisions

Settled with the user before this document was written:

| # | Decision |
|---|---|
| D1 | Status becomes a **select of legal target statuses** + a «بروزرسانی» button that opens a confirmation dialog whose body is action-specific. `markPaid` stays a separate button — it is settlement, not status. |
| D2 | List rows carry **two** thumbnails: the first line's product image **and** the کارت‌به‌کارت receipt. Requires a Back change. |
| D3 | **Six columns, no id column**: کالا · گیرنده · تاریخ ثبت · مبلغ کل · پرداخت · وضعیت. |
| D4 | Detail page becomes a **sticky decision rail + detail column** from `lg` up; the rail stacks first below `lg`. |
| D5 | Table from `md` up, **row-cards below `md`** — no horizontal scroll, nothing hidden. |

Rejected: a «شناسه» column (`CommerceOrder` has only a UUID; a hex fragment is not something a
Persian-speaking seller reads aloud) and adding a real order-number column (a schema change well
past a UI pass).

## Part 1 — Back: expose the receipt on the list read

`toOrderView` is **not** touched. It is shared by the buyer-facing reads (`readOneForCustomer`,
`readManyForCustomer`) and by `CheckoutService`, none of which should carry a receipt URL.

**`apps/core/src/commerce/orders/orderView.mapper.ts`**

```ts
export interface OrderListView extends OrderView {
  /** Newest receipt only. `null` when none was sent, or when its file row is gone. */
  receiptUrl: string | null;
  /** All receipts, so the list can mark a re-upload without shipping every URL. */
  receiptCount: number;
}

export function toOrderListView(
  order: CommerceOrder,
  urlByFileId: Map<number, string>,
): OrderListView
```

Same newest-first sort and same drop-a-receipt-whose-file-is-missing rule `toOrderDetailView`
already applies — factored into one shared helper so the two cannot drift.

**`apps/core/src/commerce/orders/orderRead.service.ts`**

A `hydrateForSeller(ids)` beside the existing `hydrate(ids)`:

```ts
relations: ['lines', 'receipts']          // + one targeted fileRepo.find({ id: In(fileIds) })
```

`readManyForWorkspace` uses it and returns `PaginatedResult<OrderListView[]>`.
`readManyForCustomer` keeps plain `hydrate`, so **no receipt URL ever enters a buyer payload**.

> **Why this does not break pagination.** `hydrate`'s docstring warns that joining a to-many
> relation corrupts `skip`/`take`. That warning applies to the **id-selecting** query, which runs
> first and alone. `hydrate` itself is `id IN (:...ids)` with no `skip`/`take` at all — the page is
> already decided by the time it runs, which is exactly why it can already afford `lines`. Joining
> `receipts` there is safe for the same reason. `readOne` already loads `receipts` this way.

Cost: **two extra queries per page**, both id-bounded.

## Part 2 — Front: the list

`OrderCard.tsx` (the grid card) is **deleted**. Its test is replaced.

| File | Role |
|---|---|
| `OrdersTable.tsx` *(new)* | `md`+ — the six-column table, on `@/components/ui/table` |
| `OrderRowCard.tsx` *(new)* | below `md` — the compact row-card |
| `OrderThumbs.tsx` *(new)* | product + receipt thumbnails; receipt opens `ReceiptLightbox` **in place** |
| `orderRowFields.ts` *(new)* | shared derivation, so the two renderings cannot drift |
| `OrdersListPage.tsx` | swaps the grid for the two renderings; everything else untouched |
| ~~`OrderCard.tsx`~~ | deleted |

**`orderRowFields.ts`** computes once, from one `OrderListView`: `firstLine`, `extraLines`
(distinct lines beyond the first — **not** `itemCount`, which sums quantity), `itemCount`,
`paymentMethodLabel`, `isPaid`, `TypeIcon`. Both renderings consume it. This is the mitigation for
D5's one real cost: two renderings of the same row.

**Columns** (RTL — کالا is rightmost):

| Column | Content |
|---|---|
| کالا | `OrderThumbs` + first line title + `+N` chip |
| گیرنده | `recipientName ?? card.noName`, mobile beneath |
| تاریخ ثبت | `toJalaliDate(placedAt)`, time beneath |
| مبلغ کل | `formatNumber(grandTotal)` + تومان |
| پرداخت | method label + a paid/unpaid dot |
| وضعیت | `OrderStatusBadge` |

The whole row is the click target → `/products/orders/[id]`, **except** the receipt thumbnail,
which opens the lightbox and must `stopPropagation`. The row is a real `<tr>` with
`role="button"`, `tabIndex={0}` and an Enter/Space handler — the grid card's keyboard reachability
must not be lost.

Breakpoint switching is **CSS** (`hidden md:table` / `md:hidden`), not a media-query hook: a hook
paints the wrong layout on first render and flashes.

**Unchanged:** the three-band layout and its `md:min-h-0` chain, the URL-backed filters and all
four exported helpers (`filtersFromParams`, `dateFromIso`, `isoFromDate`, `DEFAULT_LIMIT`), the
`SearchInput`/`DateFilterCell`/status-chip bar, `ItemsPagination`, the export drawer, and the
error-beats-loading-beats-empty branch order.

## Part 3 — Front: the detail page

`OrderDetail.tsx` becomes `lg:grid-cols-[1fr_320px]`. Below `lg` it is one column with the **rail
first**, so the decision is the first thing on screen at every width.

| File | Role |
|---|---|
| `OrderSummaryRail.tsx` *(new)* | sticky: status badge, grand total, payment method + paid state, receipt thumbnail, the status select, «بروزرسانی», «ثبت پرداخت» |
| `OrderBuyerCard.tsx` *(new)* | recipient, mobile, city, address, plate, unit, postcode, shipping method/kind/settlement |
| `OrderItemsCard.tsx` *(new)* | line items |
| `OrderTotalsCard.tsx` *(new)* | items / shipping / grand |
| `OrderStatusUpdater.tsx` *(new)* | the select + update button + dialog orchestration |
| `OrderDetail.tsx` | reduced to layout + composition |
| ~~`OrderActions.tsx`~~ | deleted |

Each card is a real `Card` with `bg-card` and a border — this is what fixes "no background colour".
The mobile sticky action bar (`data-testid="order-actions-bar"`) is **removed**: the rail is now
first on a phone, so pinning it to the bottom as well would show the same control twice.

### The status select

`orderTransitions.ts` gains two exports beside the untouched `ACTIONS_BY_STATUS` mirror:

```ts
export function targetStatusesFor(order: OrderView): readonly CommerceOrderStatus[]
export function actionForTransition(
  from: CommerceOrderStatus,
  to: CommerceOrderStatus,
): OrderActionName | null
```

`targetStatusesFor` derives from `actionsFor(order)`, so the existing digital-order `ship` filter
(and the loop it prevents) keeps working with no second rule to maintain.

| from → to | action | dialog |
|---|---|---|
| `awaiting_review` → `processing` | `approve` | `ConfirmActionDialog` |
| `awaiting_review` → `cancelled` | `reject` | `RejectPaymentDialog` (reason required, ≤500) |
| `processing` → `sending` | `ship` | `ConfirmActionDialog` |
| `processing`/`sending` → `completed` | `complete` | `ConfirmActionDialog` |
| `processing`/`sending` → `cancelled` | `cancel` | `CancelOrderDialog` (restock warning) |

The select's value is **local draft state**, initialised to the order's current status. «بروزرسانی»
is disabled while the draft equals the current status. On success the draft resets from the
revalidated order; on failure the draft is **kept**, matching the existing rule that a failed write
must not destroy what the seller chose. On a terminal order (`completed`, `cancelled`)
`targetStatusesFor` is empty and the select renders disabled at its current value.

`onAction`'s `(name, reason?) => Promise<boolean>` contract and every `COMMERCE_ORDER_STATUS_CHANGED`
revalidation behaviour in `OrderDetailPage` are unchanged.

### Two deliberate behaviour changes

1. **`approve` now requires confirmation.** It previously fired on one click. It is the money
   decision on this screen; routing it through the same select → confirm path as every other
   transition is the point of D1.
2. **`markPaid` gains a confirm dialog.** It is irreversible — there is no un-mark endpoint — and
   today a single click settles an order. It stays outside the select (it is not a status, and its
   only backend guard is `paidAt IS NULL`, so gating it on status would hide it where it is legal),
   but it gets a `ConfirmActionDialog`. **Flagged for the user; revert to one-click on request.**

## Part 4 — Supporting changes

- `types/commerceOrders.ts` — add `OrderListView`; `useCommerceOrders` returns it.
- `messages/fa.json` — new keys under `Commerce.Orders`: `table.*` (six headers), `statusUpdate.*`
  (label, update button, per-transition dialog copy, terminal note), `payment.paid` / `payment.unpaid`,
  `receipts.thumbAlt`, `dialogs.markPaid.*`. **`fa.json` only** (CLAUDE.md §8).
- Tests: `OrderCard.test.tsx` → `OrdersTable.test.tsx` + `OrderRowCard.test.tsx`;
  `OrderActions.test.tsx` → `OrderStatusUpdater.test.tsx`; `OrderDetail.test.tsx` and
  `OrdersListPage.test.tsx` updated. Back: `orderView.mapper.spec.ts` and `orderRead.service.spec.ts`
  extended for `toOrderListView` / `hydrateForSeller`, including the assertion that
  `readManyForCustomer` emits **no** `receiptUrl`.
- Docs (CLAUDE.md §4): an update doc in each repo, both `knowledgeMap.doc.md` files, and
  `knowledge/front-back-relations.md` for the `OrderListView` API change.

**Untouched:** the legacy `/orders` screen, `OrdersExportDrawer`, `ReceiptStrip`/`ReceiptLightbox`,
`CheckoutService`/`FulfilmentService`, `order.state.ts`, and everything under `packages/`.

## Open item — a pickup order cannot say where to collect

Surfaced by the `commerce-direct` merge that landed «تحویل حضوری» on this branch, and **not fixed
here**.

`pickupAddress` lives only on `commerce_shipping_option` — the live, mutable merchant config.
`commerce_order` freezes `shippingTitle`, `shippingKind` and `shippingSettlement` at promotion but
stores **no `shippingOptionId`**, so there is no path from an order back to its pickup address —
not even a live lookup. A `pickup` order therefore renders kind = «تحویل حضوری» beside the buyer's
**home address**, which for pickup is not a delivery destination at all and reads as one.

- **In scope here:** `OrderBuyerCard` special-cases `shippingKind === 'pickup'` — it does not
  present the buyer's postal address as a delivery address, and states that the collection point is
  not recorded on the order.
- **Out of scope:** freezing `shippingPickupAddress` onto `commerce_order` (new column + migration
  + backfill). Recommended as a separate task.

## Verification plan

- Back: `orderView.mapper.spec.ts`, `orderRead.service.spec.ts` (scoped jest, `--runInBand`).
- Front: `vitest run src/components/Commerce/` — currently **397 tests / 35 files** green on this
  branch; every replaced suite rewritten, new behaviour written test-first and confirmed red.
- `tsc --noEmit` scoped to each touched app; the dashboard's app-wide baseline (204 pre-existing
  errors) must not grow.
- `eslint` + `prettier --check` on touched files.
- Manual browser pass at three widths (phone, `md`, `lg`+) — the previous refactor shipped
  explicitly **unverified in a browser**, and this one must not.
