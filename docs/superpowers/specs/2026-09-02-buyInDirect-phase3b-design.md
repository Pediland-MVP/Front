# Buy in Direct — phase 3b: the merchant orders screen

**Date:** 2026-09-02
**Repo:** Front (`apps/dashboard`)
**Branch:** `feat/buy-in-direct-phase3b`, off Front phase 1 (`76f17a08`, PR #34)
**Predecessors:** phase 1 (Back PR #39 / Front PR #34), phase 2 (Back PR #40), phase 3a (Back PR #41)

---

## 1. What this is

Phase 3a gave the buyer a complete purchase inside the Instagram DM: pick products, answer the
checkout questions, get the seller's card details, send a receipt photo. It ends with the order
sitting in `awaiting_review` and the seller notified.

Phase 3b is the other half of that: **the screen where the seller actually works those orders.**
Without it, phase 3a produces orders nobody can see, approve, or ship.

Scope is Front only. The backend for every one of these actions already exists and shipped in
earlier phases — this phase adds no endpoint, no DTO, no migration.

### 1.1. Inherited constraints from phase 3a

These are not preferences. They follow from decisions already implemented and shipped:

| # | Constraint | Why |
|---|---|---|
| I1 | `reject` is **terminal**. Copy says the order was cancelled, never "rejected, try again". | `reject` moves `awaiting_review → cancelled` and sets `cancelReason = payment_rejected`. There is no path back. |
| I2 | **No "message the buyer" action.** | Phase 3a already DMs the buyer automatically on both approve and reject (`dmBuyerNotify.queue.ts`). A manual button would double-message. |
| I3 | The reject `reason` string **is shown to the buyer**. | Phase 3a sends it verbatim in the rejection DM. It is not an internal note. |
| I4 | An order can carry **several receipts**. | Receipts are append-only. A reject followed by a re-upload is the normal case, not an edge case. |

---

## 2. Decisions

Taken during brainstorming on 2026-09-02, all user-approved.

| # | Decision | Rejected alternative and why |
|---|---|---|
| D1 | New route `/products/orders`. Legacy `/orders` stays live and untouched; its retirement becomes a `before-prod-cutover.md` row. | Replacing `/orders` in place would couple this phase's release to the `CommerceOrderCoreData` backfill actually having run in production. A feature flag was rejected as a third code path to carry for no gain. |
| D2 | Ship **all seven** actions: approve, reject, ship, complete, cancel, mark-paid, Excel export. | A payment-review-only slice would need a second Front pass before cutover, since the legacy screen cannot fulfil a commerce order. |
| D3 | Show **all receipts, newest first**, each with its upload time. | Latest-only hides what the seller rejected the first time — exactly the context needed when reviewing attempt #2. |
| D4 | **Fresh components** under `components/Commerce/Orders/`. | The legacy components are shaped around the legacy `order` entity. Copying them drags that shape into the new module and makes the eventual legacy deletion a merge instead of a folder removal. |
| D5 | **Two routes**: list and a full detail page. | A drawer cannot deep-link, and cramps a receipt strip plus six actions. Intercepting routes would introduce a routing pattern nothing else in the dashboard uses. |

---

## 3. The backend contract

Everything below was read from the phase 1–3a source, not assumed.

### 3.1. Reads

```
GET  /commerce/orders          -> PaginatedResult<OrderView[]>       requires order:view
GET  /commerce/orders/:id      -> ResponseMessage{ data: OrderDetailView }   requires order:view
```

`readManyForWorkspace` query parameters:

| Param | Rules | Notes |
|---|---|---|
| `page` | required, min 1 | |
| `limit` | required, min 1, **max 200** | |
| `status` | optional, `CommerceOrderStatusEnum` | single value, not a list |
| `search` | optional, max 100 chars | matches `recipientName` **OR** `mobile` only |
| `from` | optional, date | filters `placedAt` |
| `to` | optional, date | filters `placedAt`, snapped to end of day |

Sorted `placedAt DESC`, matching `IDX_commerce_order_ws_status_placed`.

**The list returns full `OrderView` objects including `lines`, but never `receipts`.** Receipts
exist only on `OrderDetailView` from `readOne`. The list therefore cannot show receipt thumbnails,
and must not be written as though it could.

### 3.2. Writes

All require `order:manage`.

```
POST /commerce/orders/:id/approve
POST /commerce/orders/:id/reject      { reason: string }   1..500 chars, REQUIRED
POST /commerce/orders/:id/ship
POST /commerce/orders/:id/complete
POST /commerce/orders/:id/cancel      { reason: 'delivery_refused' }   only legal value
POST /commerce/orders/:id/mark-paid
POST /commerce/orders/excelExport     { email, filters }
```

### 3.3. View shapes

```ts
interface ViewLine {
  variantId: string; productId: string; title: string;
  options: Array<{ name: string; value: string }>;
  imageUrl: string | null;
  unitPrice: number; compareAtPrice: number | null;
  quantity: number; lineTotal: number;
}

interface OrderView {
  orderId: string;
  status: CommerceOrderStatusEnum;
  cancelReason: CommerceOrderCancelReasonEnum | null;
  kind: CommerceProductKindEnum;
  lines: ViewLine[];
  itemsTotal: number; shippingTotal: number; grandTotal: number;
  paymentMethod: string;
  recipientName: string | null; mobile: string | null;
  cityId: number | null; address: string | null;
  plate: string | null; unit: string | null; postalcode: string | null;
  placedAt: Date;
  shippingTitle: string | null;
  shippingKind: CommerceShippingKindEnum | null;
  shippingSettlement: CommerceShippingSettlementEnum | null;
  paidAt: Date | null;
  createDate: Date;
}

interface OrderReceiptView { id: string; url: string; createDate: Date; }
interface OrderDetailView extends OrderView { receipts: OrderReceiptView[]; }
```

Statuses: `awaiting_review`, `processing`, `sending`, `completed`, `cancelled`.

Cancel reasons: `payment_rejected` (a seller rejected the receipt), `delivery_refused` (COD refused
at the door), plus `superseded` and `legacy_cancelled`, which only the backfill migration writes.
All four must render, because after cutover the screen shows migrated legacy orders too.

### 3.4. The city name problem, and why it is already solved

`OrderView` carries `cityId: number | null` and no city name. There is **no `GET /cities/:id`** —
the cities module exposes only `GET /cities` and `GET /cities/provinces`.

The dashboard already solves this. `useShippingDestinations` fetches all ~1,100 cities once with
`useSWRImmutable` and exposes a `cityById` map, for precisely this reason (its docstring: "a saved
exception stores a bare `cityId`, so the screen needs the full table to turn ids back into names").

**Order detail reuses that hook.** No new hook, no backend change.

> Dependency worth knowing: this relies on `GET /cities` with no query returning every city. That
> was broken until 2026-09-01 — `provinceId` was `@IsNumber()` with no `@IsOptional()`, so the
> unfiltered call 400'd. Fixed in Back commit `955e2b44`. If city names render empty, check that
> fix is present before suspecting this screen.

---

## 4. Routes and navigation

```
app/(Console)/products/orders/page.tsx        the list
app/(Console)/products/orders/[id]/page.tsx   the detail
```

**Breadcrumbs need no new code.** `knownSegmentKey` already maps `orders → 'orders'`, and
`getLabel` already sends any UUID segment to `Breadcrumbs.detail`. The trail resolves to
«لیست کالاها › لیست سفارشات › جزئیات» unaided. This is the usual §18.5 trap and it is already
covered — do not add a hardcoded label.

**Sidebar:** add a fifth sub-item to the existing `products` group in `ConsoleSidebar.tsx`:

```ts
{ title: t('productsOrders'), url: '/products/orders' },
```

`ConsoleSidebar` reads `useTranslations('Console.Sidebar')`, so `productsOrders` goes in
**`src/messages/fa/Console.json`** — a different file from the screen copy in §10. Getting this
wrong makes the label silently fall back instead of erroring.

The legacy top-level `ordersList → /orders` entry **stays** until cutover. Two order entries
therefore coexist, so their labels must differ: legacy keeps its current «سفارشات»; the new one is
«سفارش‌های فروشگاه».

**Permissions:** `order:view` gates both screens, `order:manage` gates every action and the export
button — mirroring the controller exactly, the same way `ShippingSettings.tsx` does.

---

## 5. The action model

### 5.1. A mirrored transition table

The backend's `ORDER_TRANSITIONS` is the only truth about which action is legal from which status.
The UI mirrors it in one small table so it can never offer a button the API will reject:

```ts
// components/Commerce/Orders/orderTransitions.ts
// MIRRORS Back's apps/core/src/commerce/orders/order.state.ts ORDER_TRANSITIONS.
// Any change there must change here. orderTransitions.test.ts guards the mirror.
export const ACTIONS_BY_STATUS = {
  awaiting_review: ['approve', 'reject'],
  processing:      ['ship', 'complete', 'cancel'],
  sending:         ['complete', 'cancel'],
  completed:       [],
  cancelled:       [],
} as const;
```

Derived from, verbatim:

| Action | From | To |
|---|---|---|
| `approve` | `awaiting_review` | `processing` |
| `reject` | `awaiting_review` | `cancelled` |
| `ship` | `processing` | `sending` |
| `complete` | `processing`, `sending` | `completed` |
| `cancel` | `processing`, `sending` | `cancelled` |

### 5.1.1. A second dimension: product kind (added post-implementation, Task 10)

The table above is **status-only**, and that is an incomplete description of the backend. Back's
`FulfilmentService.ship` throws `COMMERCE_ORDER_STATUS_CHANGED` ("A digital order is never
shipped") for `kind === 'digital'`, **before** its conditional UPDATE runs — independent of status.
A digital order reaches `processing` the normal way (via `approve` or `submitFree`), so a UI that
only consulted `ACTIONS_BY_STATUS` rendered a `ship` button that could never succeed: clicking it
reported "status changed" (false), this page's own status-changed handler revalidated, found
nothing changed, and redrew the same button — an unbreakable retry loop. This was found during
Task 8's review (Ruling 8) and fixed in the same task.

`ACTIONS_BY_STATUS` stays exactly as documented above — a faithful, status-only mirror of Back's
`ORDER_TRANSITIONS`. The kind rule is **not** folded into that table. It lives one layer up, in
`actionsFor` (`components/Commerce/Orders/orderTransitions.ts`), which filters `ship` out of the
status-derived action list whenever `order.kind === 'digital'`:

```ts
export function actionsFor(order: OrderView): readonly OrderActionName[] {
  const actions = ACTIONS_BY_STATUS[order.status] ?? [];
  if (order.kind === 'digital') return actions.filter((action) => action !== 'ship');
  return actions;
}
```

Keeping the two concerns separate means `ACTIONS_BY_STATUS` can still be read side-by-side with
Back's `ORDER_TRANSITIONS` as a literal mirror, while the kind exception is documented and tested
(`orderTransitions.test.ts`) at the one place it actually applies.

### 5.2. `markPaid` is deliberately outside that table

`FulfilmentService.markPaid` has **no status guard whatsoever**. Its only condition is
`paidAt IS NULL`, and it is intentionally idempotent — a second call is a seller double-tapping,
not a conflict, so it succeeds rather than erroring.

The UI therefore gates it on **`order.paidAt === null`**, never on status. Putting it in the status
table would both hide it where it is legal and misrepresent the backend.

### 5.3. Dialogs

Three actions need one, each for a different reason:

**`reject`** — `reason` is required free text, 1–500 characters, and per I3 the buyer reads it
verbatim in a DM. The dialog offers preset chips that **fill the textarea**, which the seller may
then edit before sending. The dialog states plainly that the buyer will see this text. Submit is
blocked on empty and on >500 characters, matching `RejectPaymentDto`.

**`cancel`** — the API accepts exactly one value, `delivery_refused`. This is a **confirmation, not
a reason picker**. A dropdown holding a single option would misrepresent the domain. Copy names the
real situation: the buyer refused the parcel at the door, and stock goes back.

**`ship` / `complete`** — plain confirmations. Both are irreversible.

`approve` and `mark-paid` need no dialog. `approve` is recoverable in the sense that the order
continues forward, and `mark-paid` is idempotent.

---

## 6. The list screen

Header follows the existing page pattern — `useHeaderFeatures` for the search toggle and the export
button, as `app/(Console)/orders/page.tsx` does today.

**Filters:** status chips (همه / در انتظار تایید / در حال آماده‌سازی / در حال ارسال / تکمیل‌شده /
لغو شده) and a `placedAt` date range.

**Search** matches `recipientName` OR `mobile` and nothing else. The placeholder says exactly that,
so nobody expects it to find an order id or a product name.

**Filter state lives in the URL query string.** Not decoration: tapping an order navigates to
another route, and without URL state every "back" silently discards the seller's filters and page
position. It also makes a filtered list shareable.

**Cards** show recipient name, status badge, grand total, placed date and item count. No receipt
thumbnail — see §3.1.

**Pagination** is server-side; `limit` must never exceed 200.

**Empty states are two different things:** "no orders yet" and "nothing matches these filters". The
second needs a visible way to clear the filters.

---

## 7. The detail screen

Top to bottom:

1. **Header** — status badge, placed date, grand total.
2. **Payment** — method, `paidAt` (or "not yet marked paid"), then the receipt strip.
3. **Receipts** — see §8.
4. **Buyer and delivery** — recipient, mobile, city name (via `cityById`, §3.4), address, plate,
   unit, postal code, and the shipping method's title/kind/settlement.
5. **Lines** — image, title, options, unit price, quantity, line total.
6. **Totals** — items, shipping, grand.
7. **Actions** — §5. Sticky on mobile.

A cancelled order surfaces its `cancelReason` in words, covering all four values (§3.3).

Digital orders (`kind === 'digital'`) have no shipping and no address; those sections are omitted
rather than rendered empty.

---

## 8. Receipts

Per D3: **all receipts, newest first, each labelled with its upload time**, tapping to fullscreen.

The append-only design (I4) makes several receipts normal after a reject and re-upload. A seller
reviewing attempt #2 can see what they rejected first — which is the whole reason not to show only
the latest.

`OrderReceiptView.url` is already a resolved public URL (R2, `dl.befroosh.app`); no signing or
`urlByFileId` work happens on the client.

---

## 9. Errors

All error text goes through `t_ec(code)` per CLAUDE.md §10.

**`COMMERCE_ORDER_STATUS_CHANGED` is the important one.** It means someone else already acted, or
the buyer's DM moved the order underneath this screen. The handler does **not** just toast: it
**revalidates the detail**, so the action bar redraws against the true status instead of leaving
stale buttons that will fail on every retry.

**`COMMERCE_INSUFFICIENT_STOCK_ON_APPROVAL`** gets its own message. Stock fell between the buyer
submitting and the seller approving; `InventoryService.decrementMany`'s guard refused to go
negative. A human has to resolve it, so the copy must say what happened rather than "try again".

Other codes to translate: `COMMERCE_ORDER_NOT_FOUND`, `COMMERCE_OUT_OF_STOCK`,
`COMMERCE_VARIANT_NOT_FOUND`.

> **Keys go in `src/messages/fa/ErrorCodes.json`.** The `ERROR_CODES` object inside
> `src/messages/fa.json` is fully shadowed by the shallow spread in `i18n/request.ts` and is dead
> at runtime. Adding keys there produces no visible change and wastes a debugging session.

---

## 10. i18n

Screen copy goes in a new `Commerce.Orders` sub-namespace in `src/messages/fa.json`, joining the
existing `List` / `Taxonomy` / `Import` / `Editor` / `Shipping`.

Persian only — `en.json` is translated later (§8).

The sidebar key `productsOrders` is the one exception: it belongs to `Console.Sidebar` in
`src/messages/fa/Console.json`, not `fa.json` (§4). Three message files are in play on this screen
— `fa.json` for copy, `fa/Console.json` for the sidebar label, `fa/ErrorCodes.json` for error
codes — and putting a key in the wrong one fails silently.

Every user-facing string is a key. Money renders through `formatNumber` for thousand separators.

---

## 11. File structure

```
app/(Console)/products/orders/
  page.tsx                      list route
  [id]/page.tsx                 detail route

components/Commerce/Orders/
  OrdersList.tsx                filter bar + cards + pagination
  OrderCard.tsx                 one row
  OrderStatusBadge.tsx          status -> label + colour (list and detail)
  OrderDetail.tsx               detail body
  ReceiptStrip.tsx              all receipts, newest first
  ReceiptLightbox.tsx           fullscreen viewer
  OrderActions.tsx              action bar, driven by the transition table
  orderTransitions.ts           ACTIONS_BY_STATUS + the markPaid rule
  OrdersExportDrawer.tsx        Excel export
  dialogs/
    RejectPaymentDialog.tsx     presets + editable free text
    CancelOrderDialog.tsx       confirmation, sends delivery_refused
    ConfirmActionDialog.tsx     ship / complete

hooks/
  useCommerceOrders.ts          list, SWR keyed by the filter set
  useCommerceOrder.ts           detail by id + the seven writes

types/
  commerceOrders.ts             OrderView, OrderDetailView, OrderReceiptView, enums
```

**Data layer note.** `useShippingOptions` deliberately does *not* revalidate after its mutations,
because the shipping screen batches a whole screenful behind one save button. Order actions are the
opposite: single-shot, and each one changes what the seller may legally do next. So every order
mutation revalidates the detail and invalidates the list key.

---

## 12. Testing

Vitest (`pnpm --filter front test`, or from `apps/dashboard`).

| Test | What it protects |
|---|---|
| `orderTransitions.test.ts` | The mirrored table equals Back's `ORDER_TRANSITIONS`. **Highest value in the phase** — this mirror is the thing that silently drifts. |
| `OrderActions.test.tsx` | Correct buttons per status; `markPaid` shows on `paidAt === null` regardless of status, and hides once stamped. |
| `RejectPaymentDialog.test.tsx` | Preset fills the textarea; text stays editable; empty blocked; >500 blocked. |
| `CancelOrderDialog.test.tsx` | Sends `delivery_refused`; presents no reason choice. |
| `OrdersList.test.tsx` | Filters reach both the URL and the SWR key; the two empty states differ. |
| `ReceiptStrip.test.tsx` | All receipts render, newest first. |
| `OrderDetail.test.tsx` | City name resolves via `cityById`; digital orders omit shipping/address; all four cancel reasons render. |

A test must fail when its behaviour is removed. Phase 3a lost four tests to a vacuous pass (an enum
value that was `undefined` at runtime); assert against string literals, never against a possibly
undefined imported enum member.

---

## 13. Out of scope

- **Legacy `/orders` is untouched** and keeps serving live data. Deleting it, and redirecting the
  route, becomes a row in `before-prod-cutover.md` per §20 — it cannot happen until
  `CommerceOrderCoreData1786960000000` has run in production.
- **No "message the buyer" action** (I2).
- **No new backend work.** If something here appears to need an endpoint, that is a spec defect —
  raise it rather than widening the phase.
- **No order editing.** The commerce API exposes no mutation of lines, address or totals after
  placement, and this phase does not invent one.

---

## 14. Risks

| Risk | Mitigation |
|---|---|
| The mirrored transition table drifts from Back's. | `orderTransitions.test.ts`, plus a comment at both ends naming the other file. |
| Two order entries in the sidebar confuse sellers during coexistence. | Distinct labels (§4); the legacy entry disappears at cutover. |
| A seller works a stale detail page and every action fails. | `COMMERCE_ORDER_STATUS_CHANGED` revalidates rather than only toasting (§9). |
| City names render blank. | Depends on Back `955e2b44`; called out in §3.4 so it is diagnosed in seconds, not hours. |
| `limit` above 200 returns a validation error. | The list's page size is a constant well under the cap. |
