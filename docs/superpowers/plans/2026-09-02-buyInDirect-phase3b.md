# Buy in Direct — phase 3b Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the merchant orders screen — list, detail, receipt viewer and all seven lifecycle actions — so the orders phase 3a creates can actually be worked.

**Architecture:** Two routes under `/products/orders`, backed by two SWR hooks. Every visual component is **pure and takes props**; the page-level components own the hooks. The action bar is driven by a table that mirrors the backend's `ORDER_TRANSITIONS`, with `markPaid` deliberately outside it.

**Tech Stack:** Next.js App Router (client components), SWR, axios (`@/hooks/swr/api-client`), next-intl, sonner, vitest + @testing-library/react, Tailwind + `@befroosh/ui` primitives.

**Spec:** `docs/superpowers/specs/2026-09-02-buyInDirect-phase3b-design.md`

## Global Constraints

- **Repo/worktree:** work only in `Front/worktrees/commerce-product-core`. Absolute paths, `git -C`.
- **Never `git add -A` or `git add .`** — this worktree holds 5 files belonging to another session (`RateOverrideEditor.tsx`, `RateOverrideEditor.test.tsx`, `knowledge/knowledgeMap.doc.md`, `knowledge/updates/2026-08-27-commerceShippingMethods.update.md`, and untracked `knowledge/updates/2026-08-31-rateOverrideEditorMultiPick.update.md`). Stage named paths only. Never revert, stash or absorb them.
- **Never `git checkout` / `git switch`.** The local branch is `feat/commerce-product-core`; phase branches are created by pushing an explicit refspec.
- **i18n:** all user-facing text via keys. Screen copy → `src/messages/fa.json` under `Commerce.Orders`. Sidebar label → `src/messages/fa/Console.json` under `Console.Sidebar`. Error codes → `src/messages/fa/ErrorCodes.json`. **`fa.json`'s `ERROR_CODES` is dead at runtime** (shadowed by the shallow spread in `i18n/request.ts`). Persian only; never touch `en.json`.
- **Permissions:** `can('order:view')` for reads, `can('order:manage')` for every write and the export button.
- **Money** renders through `formatNumber` from `@/utils/formatNumber`.
- **No new backend work.** If a step seems to need an endpoint, that is a plan defect — report it.
- **Tests must fail when the behaviour is removed.** Assert against **string literals**, never against an imported enum member that could be `undefined` at runtime (phase 3a lost four tests to exactly that).
- **Test command:** `cd apps/dashboard && npx vitest run <path>`. The dashboard package is named **`front`**, not `dashboard` — `pnpm --filter dashboard` fails.
- **Type-check:** `pnpm --filter front exec tsc --noEmit`. Record the baseline error count **before** Task 1 and never increase it.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/types/commerceOrders.ts` | View shapes + status/reason literal unions |
| `src/components/Commerce/Orders/orderTransitions.ts` | Which action is legal from which status; the `markPaid` rule |
| `src/hooks/useCommerceOrders.ts` | List read, SWR key built from the filter set |
| `src/hooks/useCommerceOrder.ts` | Detail read + the seven writes |
| `src/components/Commerce/Orders/OrderStatusBadge.tsx` | status → label + colour |
| `src/components/Commerce/Orders/OrderCard.tsx` | One list row |
| `src/components/Commerce/Orders/OrdersListPage.tsx` | Filters, URL state, paging, empty states (owns the list hook) |
| `src/components/Commerce/Orders/ReceiptStrip.tsx` | All receipts, newest first |
| `src/components/Commerce/Orders/ReceiptLightbox.tsx` | Fullscreen viewer |
| `src/components/Commerce/Orders/OrderDetail.tsx` | Pure detail body |
| `src/components/Commerce/Orders/OrderDetailPage.tsx` | Owns the detail hook, error handling, action wiring |
| `src/components/Commerce/Orders/OrderActions.tsx` | Action bar from the transition table |
| `src/components/Commerce/Orders/dialogs/RejectPaymentDialog.tsx` | Presets + editable free text |
| `src/components/Commerce/Orders/dialogs/CancelOrderDialog.tsx` | Confirmation; sends `delivery_refused` |
| `src/components/Commerce/Orders/dialogs/ConfirmActionDialog.tsx` | ship / complete |
| `src/components/Commerce/Orders/OrdersExportDrawer.tsx` | Excel export |
| `src/app/(Console)/products/orders/page.tsx` | List route shell |
| `src/app/(Console)/products/orders/[id]/page.tsx` | Detail route shell |

**Deliberate deviation:** `ProductListPage.tsx` keeps its filters in `useState`. This screen puts them in the **URL query** instead, because tapping an order navigates to another route and local state would silently discard the seller's filters and page on every "back". Do not "fix" this to match ProductList.

---

## Task 1: Types and the transition table

**Files:**
- Create: `src/types/commerceOrders.ts`
- Create: `src/components/Commerce/Orders/orderTransitions.ts`
- Test: `src/components/Commerce/Orders/orderTransitions.test.ts`

**Interfaces:**
- Produces: `OrderView`, `OrderDetailView`, `OrderReceiptView`, `ViewLine`, `CommerceOrderStatus`, `CommerceOrderCancelReason`, `OrderActionName`, `ACTIONS_BY_STATUS`, `actionsFor(order)`, `canMarkPaid(order)`.

- [ ] **Step 1: Record the tsc baseline**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core
pnpm --filter front exec tsc --noEmit 2>&1 | grep -c "error TS"
```

Write the number down. It must not increase in any later task.

- [ ] **Step 2: Create the types file**

`src/types/commerceOrders.ts`:

```ts
/**
 * Mirrors the shapes returned by Back's `apps/core/src/commerce/orders/orderView.mapper.ts`.
 *
 * Statuses and cancel reasons are string-literal unions rather than TS enums on purpose: they
 * arrive from JSON as plain strings, and a literal union compares correctly without importing a
 * runtime value that could be undefined.
 */

export type CommerceOrderStatus =
  | 'awaiting_review'
  | 'processing'
  | 'sending'
  | 'completed'
  | 'cancelled';

/**
 * `superseded` and `legacy_cancelled` are written only by the `CommerceOrderCoreData` backfill,
 * but they MUST render: after cutover this screen shows migrated legacy orders too.
 */
export type CommerceOrderCancelReason =
  | 'payment_rejected'
  | 'delivery_refused'
  | 'superseded'
  | 'legacy_cancelled';

export type CommerceProductKind = 'physical' | 'digital';

export interface ViewLine {
  variantId: string;
  productId: string;
  title: string;
  options: Array<{ name: string; value: string }>;
  imageUrl: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
}

export interface OrderView {
  orderId: string;
  status: CommerceOrderStatus;
  cancelReason: CommerceOrderCancelReason | null;
  kind: CommerceProductKind;
  lines: ViewLine[];
  itemsTotal: number;
  shippingTotal: number;
  grandTotal: number;
  paymentMethod: string;
  recipientName: string | null;
  mobile: string | null;
  cityId: number | null;
  address: string | null;
  plate: string | null;
  unit: string | null;
  postalcode: string | null;
  placedAt: string;
  shippingTitle: string | null;
  shippingKind: string | null;
  shippingSettlement: string | null;
  paidAt: string | null;
  createDate: string;
}

export interface OrderReceiptView {
  id: string;
  url: string;
  createDate: string;
}

/** Only `GET /commerce/orders/:id` returns receipts. The list never does. */
export interface OrderDetailView extends OrderView {
  receipts: OrderReceiptView[];
}

export interface OrdersFilters {
  page: number;
  limit: number;
  status?: CommerceOrderStatus;
  search?: string;
  from?: string;
  to?: string;
}
```

- [ ] **Step 3: Write the failing test**

`src/components/Commerce/Orders/orderTransitions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

import { ACTIONS_BY_STATUS, actionsFor, canMarkPaid } from './orderTransitions';
import type { OrderView } from '@/types/commerceOrders';

const order = (patch: Partial<OrderView>): OrderView =>
  ({
    orderId: 'o1',
    status: 'processing',
    cancelReason: null,
    kind: 'physical',
    lines: [],
    itemsTotal: 0,
    shippingTotal: 0,
    grandTotal: 0,
    paymentMethod: 'card_to_card',
    recipientName: null,
    mobile: null,
    cityId: null,
    address: null,
    plate: null,
    unit: null,
    postalcode: null,
    placedAt: '2026-09-02T10:00:00.000Z',
    shippingTitle: null,
    shippingKind: null,
    shippingSettlement: null,
    paidAt: null,
    createDate: '2026-09-02T10:00:00.000Z',
    ...patch,
  }) as OrderView;

/**
 * Transcribed from Back `apps/core/src/commerce/orders/order.state.ts` ORDER_TRANSITIONS.
 * This guards the table against accidental edits on this side. It cannot detect a change made
 * in Back -- that is what the cross-reference comments in both files are for.
 */
describe('ACTIONS_BY_STATUS mirrors Back ORDER_TRANSITIONS', () => {
  it('offers approve and reject only while awaiting review', () => {
    expect(ACTIONS_BY_STATUS.awaiting_review).toEqual(['approve', 'reject']);
  });

  it('offers ship, complete and cancel while processing', () => {
    expect(ACTIONS_BY_STATUS.processing).toEqual(['ship', 'complete', 'cancel']);
  });

  it('drops ship once sending, because ship only fires from processing', () => {
    expect(ACTIONS_BY_STATUS.sending).toEqual(['complete', 'cancel']);
  });

  it('offers nothing on the two terminal statuses', () => {
    expect(ACTIONS_BY_STATUS.completed).toEqual([]);
    expect(ACTIONS_BY_STATUS.cancelled).toEqual([]);
  });
});

describe('markPaid is gated on paidAt, never on status', () => {
  it('is offered on an unpaid order in any non-terminal status', () => {
    expect(canMarkPaid(order({ status: 'awaiting_review', paidAt: null }))).toBe(true);
    expect(canMarkPaid(order({ status: 'processing', paidAt: null }))).toBe(true);
    expect(canMarkPaid(order({ status: 'sending', paidAt: null }))).toBe(true);
  });

  it('is withdrawn once paidAt is stamped', () => {
    expect(canMarkPaid(order({ status: 'processing', paidAt: '2026-09-02T11:00:00.000Z' }))).toBe(
      false,
    );
  });

  it('is not offered on a terminal order even when unpaid', () => {
    expect(canMarkPaid(order({ status: 'completed', paidAt: null }))).toBe(false);
    expect(canMarkPaid(order({ status: 'cancelled', paidAt: null }))).toBe(false);
  });
});

describe('actionsFor', () => {
  it('returns the status list without markPaid, which is separate', () => {
    expect(actionsFor(order({ status: 'processing' }))).toEqual(['ship', 'complete', 'cancel']);
  });
});
```

- [ ] **Step 4: Run it and watch it fail**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core/apps/dashboard
npx vitest run src/components/Commerce/Orders/orderTransitions.test.ts
```

Expected: FAIL — cannot resolve `./orderTransitions`.

- [ ] **Step 5: Write the table**

`src/components/Commerce/Orders/orderTransitions.ts`:

```ts
import type { CommerceOrderStatus, OrderView } from '@/types/commerceOrders';

export type OrderActionName = 'approve' | 'reject' | 'ship' | 'complete' | 'cancel';

/**
 * MIRRORS Back `apps/core/src/commerce/orders/order.state.ts` -> ORDER_TRANSITIONS.
 * Any change there MUST change here. `orderTransitions.test.ts` guards this side.
 *
 *   approve   awaiting_review          -> processing
 *   reject    awaiting_review          -> cancelled
 *   ship      processing               -> sending
 *   complete  processing | sending     -> completed
 *   cancel    processing | sending     -> cancelled
 *
 * Offering an action the API will refuse is the failure this table exists to prevent.
 */
export const ACTIONS_BY_STATUS: Record<CommerceOrderStatus, readonly OrderActionName[]> = {
  awaiting_review: ['approve', 'reject'],
  processing: ['ship', 'complete', 'cancel'],
  sending: ['complete', 'cancel'],
  completed: [],
  cancelled: [],
};

export function actionsFor(order: OrderView): readonly OrderActionName[] {
  return ACTIONS_BY_STATUS[order.status] ?? [];
}

/**
 * `markPaid` sits OUTSIDE the table on purpose. Back's `FulfilmentService.markPaid` has no status
 * guard at all -- its only condition is `paidAt IS NULL`, and it is deliberately idempotent (a
 * second call is a seller double-tapping, not a conflict). Gating it on status would hide it
 * where it is legal.
 *
 * The one thing we add on top is the two terminal statuses: stamping "paid" on a cancelled or
 * completed order is never a thing a seller means to do, and the backend would happily allow it.
 */
export function canMarkPaid(order: OrderView): boolean {
  if (order.paidAt !== null) return false;
  return order.status !== 'completed' && order.status !== 'cancelled';
}
```

- [ ] **Step 6: Run the test and watch it pass**

```bash
npx vitest run src/components/Commerce/Orders/orderTransitions.test.ts
```

Expected: PASS, 8 tests.

- [ ] **Step 7: Prove the test is load-bearing**

Temporarily change `sending: ['complete', 'cancel']` to `['ship', 'complete', 'cancel']` and re-run. The third test must fail. Revert.

- [ ] **Step 8: Commit**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core
git add apps/dashboard/src/types/commerceOrders.ts \
        apps/dashboard/src/components/Commerce/Orders/orderTransitions.ts \
        apps/dashboard/src/components/Commerce/Orders/orderTransitions.test.ts
git commit -m "feat(dashboard): commerce order types and the transition mirror"
```

---

## Task 2: The data hooks

**Files:**
- Create: `src/hooks/useCommerceOrders.ts`
- Create: `src/hooks/useCommerceOrder.ts`
- Test: `src/hooks/useCommerceOrders.test.ts`

**Interfaces:**
- Consumes: `OrderView`, `OrderDetailView`, `OrdersFilters` (Task 1).
- Produces: `ordersListKey(filters)`, `useCommerceOrders(filters)`, `useCommerceOrder(id)` returning `{ order, isLoading, error, mutate, approve, reject, ship, complete, cancel, markPaid }`.

- [ ] **Step 1: Write the failing key test**

`src/hooks/useCommerceOrders.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

import { ordersListKey } from './useCommerceOrders';

describe('ordersListKey', () => {
  it('always carries page and limit', () => {
    expect(ordersListKey({ page: 1, limit: 20 })).toBe('/commerce/orders?page=1&limit=20');
  });

  it('adds only the filters that are set', () => {
    expect(ordersListKey({ page: 2, limit: 20, status: 'awaiting_review' })).toBe(
      '/commerce/orders?page=2&limit=20&status=awaiting_review',
    );
  });

  it('url-encodes the search term so a space or & cannot break the query', () => {
    expect(ordersListKey({ page: 1, limit: 20, search: 'علی رضایی' })).toBe(
      `/commerce/orders?page=1&limit=20&search=${encodeURIComponent('علی رضایی')}`,
    );
  });

  it('omits an empty search rather than sending search=', () => {
    expect(ordersListKey({ page: 1, limit: 20, search: '' })).toBe(
      '/commerce/orders?page=1&limit=20',
    );
  });

  it('carries the date range', () => {
    expect(
      ordersListKey({ page: 1, limit: 20, from: '2026-08-01', to: '2026-08-31' }),
    ).toBe('/commerce/orders?page=1&limit=20&from=2026-08-01&to=2026-08-31');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd apps/dashboard && npx vitest run src/hooks/useCommerceOrders.test.ts
```

Expected: FAIL — cannot resolve `./useCommerceOrders`.

- [ ] **Step 3: Write the list hook**

`src/hooks/useCommerceOrders.ts`:

```ts
'use client';

import useSWR from 'swr';

import type { PaginatedResult } from '@/types/commerce';
import type { OrderView, OrdersFilters } from '@/types/commerceOrders';

/**
 * `GET /commerce/orders` returns the project's `PaginatedResult` envelope directly (CLAUDE.md §9),
 * NOT a `ResponseMessage` -- so the payload is `{ items, meta }`, not `{ data }`.
 *
 * Built as a plain string rather than `URLSearchParams` because the string IS the SWR cache key:
 * a stable, readable key makes `mutate(key)` from elsewhere predictable.
 */
export function ordersListKey(filters: OrdersFilters): string {
  const parts = [`page=${filters.page}`, `limit=${filters.limit}`];
  if (filters.status) parts.push(`status=${filters.status}`);
  if (filters.search) parts.push(`search=${encodeURIComponent(filters.search)}`);
  if (filters.from) parts.push(`from=${filters.from}`);
  if (filters.to) parts.push(`to=${filters.to}`);
  return `/commerce/orders?${parts.join('&')}`;
}

/**
 * Plain `useSWR`, not `useSWRImmutable` (which `ProductListPage` uses): orders change under the
 * seller constantly -- the buyer's DM can promote a cart, and another seat can approve one -- so
 * this list must revalidate on focus and reconnect.
 */
export function useCommerceOrders(filters: OrdersFilters) {
  const key = ordersListKey(filters);
  const { data, error, isLoading, mutate } = useSWR<PaginatedResult<OrderView[]>>(key);

  return {
    orders: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
    key,
  };
}
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
npx vitest run src/hooks/useCommerceOrders.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Write the detail hook**

`src/hooks/useCommerceOrder.ts`:

```ts
'use client';

import useSWR from 'swr';

import api from '@/hooks/swr/api-client';
import type { IResponseMessage } from '@/types/responseMessage';
import type { OrderDetailView } from '@/types/commerceOrders';

export const orderDetailKey = (id: string) => `/commerce/orders/${id}`;

/**
 * One order plus the six writes that move it.
 *
 * Unlike `useShippingOptions` -- which suppresses revalidation because that screen batches a
 * screenful of edits behind one save button -- every write here revalidates immediately. An order
 * action is single-shot and changes which actions are legal next, so the action bar must redraw
 * against the server's answer rather than a guess.
 *
 * `GET :id` returns a `ResponseMessage`, so the payload is under `.data` (the list is not -- see
 * `useCommerceOrders`). The two envelopes genuinely differ; this is not an inconsistency to
 * "clean up".
 */
export function useCommerceOrder(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<IResponseMessage<OrderDetailView>>(
    id ? orderDetailKey(id) : null,
  );

  const run = async (path: string, body?: unknown) => {
    await api.post(`/commerce/orders/${id}/${path}`, body ?? {});
    await mutate();
  };

  return {
    order: data?.data,
    isLoading,
    error,
    mutate,
    approve: () => run('approve'),
    reject: (reason: string) => run('reject', { reason }),
    ship: () => run('ship'),
    complete: () => run('complete'),
    cancel: () => run('cancel', { reason: 'delivery_refused' }),
    markPaid: () => run('mark-paid'),
  };
}
```

- [ ] **Step 6: Type-check**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core
pnpm --filter front exec tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: the Task 1 baseline, unchanged.

- [ ] **Step 7: Commit**

```bash
git add apps/dashboard/src/hooks/useCommerceOrders.ts \
        apps/dashboard/src/hooks/useCommerceOrder.ts \
        apps/dashboard/src/hooks/useCommerceOrders.test.ts
git commit -m "feat(dashboard): commerce order list and detail hooks"
```

---

## Task 3: Status badge and order card

**Files:**
- Create: `src/components/Commerce/Orders/OrderStatusBadge.tsx`
- Create: `src/components/Commerce/Orders/OrderCard.tsx`
- Modify: `src/messages/fa.json` (add `Commerce.Orders`)
- Test: `src/components/Commerce/Orders/OrderCard.test.tsx`

**Interfaces:**
- Consumes: `OrderView`, `CommerceOrderStatus` (Task 1).
- Produces: `<OrderStatusBadge status={...} />`, `<OrderCard order={...} onOpen={(id) => void} />`.

- [ ] **Step 1: Add the copy**

In `src/messages/fa.json`, inside the existing `Commerce` object (alongside `List`, `Taxonomy`, `Import`, `Editor`, `Shipping`), add:

```json
"Orders": {
  "title": "سفارش‌های فروشگاه",
  "searchPlaceholder": "جستجوی نام گیرنده یا شماره موبایل",
  "status": {
    "all": "همه",
    "awaiting_review": "در انتظار تایید",
    "processing": "در حال آماده‌سازی",
    "sending": "در حال ارسال",
    "completed": "تکمیل‌شده",
    "cancelled": "لغو شده"
  },
  "cancelReason": {
    "payment_rejected": "رسید پرداخت تایید نشد",
    "delivery_refused": "گیرنده سفارش را تحویل نگرفت",
    "superseded": "سفارش قدیمی، با سیستم جدید جایگزین شد",
    "legacy_cancelled": "در سیستم قدیمی لغو شده بود"
  },
  "card": {
    "itemCount": "{count} کالا",
    "noName": "بدون نام"
  },
  "empty": {
    "none": "هنوز سفارشی ثبت نشده",
    "noneHint": "سفارش‌هایی که از دایرکت ثبت می‌شوند اینجا می‌آیند.",
    "noMatch": "سفارشی با این فیلترها پیدا نشد",
    "clearFilters": "حذف فیلترها"
  }
}
```

- [ ] **Step 2: Write the failing test**

`src/components/Commerce/Orders/OrderCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderView } from '@/types/commerceOrders';

import { OrderCard } from './OrderCard';

const copy = messages.Commerce.Orders;

const base: OrderView = {
  orderId: 'o1',
  status: 'awaiting_review',
  cancelReason: null,
  kind: 'physical',
  lines: [
    {
      variantId: 'v1',
      productId: 'p1',
      title: 'شال',
      options: [],
      imageUrl: null,
      unitPrice: 120000,
      compareAtPrice: null,
      quantity: 2,
      lineTotal: 240000,
    },
  ],
  itemsTotal: 240000,
  shippingTotal: 0,
  grandTotal: 240000,
  paymentMethod: 'card_to_card',
  recipientName: 'علی رضایی',
  mobile: '09120000000',
  cityId: 10,
  address: 'خیابان ولیعصر',
  plate: '12',
  unit: '3',
  postalcode: null,
  placedAt: '2026-09-02T10:00:00.000Z',
  shippingTitle: 'پست پیشتاز',
  shippingKind: 'post',
  shippingSettlement: 'prepaid',
  paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z',
};

const renderCard = (order: OrderView = base, onOpen = vi.fn()) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderCard order={order} onOpen={onOpen} />
    </NextIntlClientProvider>,
  );
  return onOpen;
};

describe('OrderCard', () => {
  it('shows the recipient, the translated status and the formatted total', () => {
    renderCard();
    expect(screen.getByText('علی رضایی')).toBeInTheDocument();
    expect(screen.getByText(copy.status.awaiting_review)).toBeInTheDocument();
    expect(screen.getByText(/۲۴۰,۰۰۰|240,000/)).toBeInTheDocument();
  });

  it('falls back to a named placeholder when the buyer never gave a name', () => {
    renderCard({ ...base, recipientName: null });
    expect(screen.getByText(copy.card.noName)).toBeInTheDocument();
  });

  it('opens the order when clicked', () => {
    const onOpen = renderCard();
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith('o1');
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
npx vitest run src/components/Commerce/Orders/OrderCard.test.tsx
```

Expected: FAIL — cannot resolve `./OrderCard`.

- [ ] **Step 4: Write the badge**

`src/components/Commerce/Orders/OrderStatusBadge.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { CommerceOrderStatus } from '@/types/commerceOrders';

/** Colour carries meaning here: amber = the seller owes an action, red = dead, green = done. */
const VARIANT: Record<CommerceOrderStatus, string> = {
  awaiting_review: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  sending: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function OrderStatusBadge({ status }: { status: CommerceOrderStatus }) {
  const t = useTranslations('Commerce.Orders');
  return <Badge className={VARIANT[status]}>{t(`status.${status}`)}</Badge>;
}
```

- [ ] **Step 5: Write the card**

`src/components/Commerce/Orders/OrderCard.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';

import { formatNumber } from '@/utils/formatNumber';
import type { OrderView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: OrderView;
  onOpen: (orderId: string) => void;
}

/**
 * Pure: takes an order, reports a click. The list page owns the data. Rendered as a <button> so
 * it is reachable by keyboard -- a div with onClick is not.
 */
export function OrderCard({ order, onOpen }: OrderCardProps) {
  const t = useTranslations('Commerce.Orders');
  const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <button
      type="button"
      onClick={() => onOpen(order.orderId)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-right hover:bg-muted/50"
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium">{order.recipientName ?? t('card.noName')}</span>
        <span className="text-muted-foreground text-xs">{t('card.itemCount', { count: itemCount })}</span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <OrderStatusBadge status={order.status} />
        <span className="text-sm">{formatNumber(order.grandTotal)}</span>
      </div>
    </button>
  );
}
```

- [ ] **Step 6: Run the test and watch it pass**

```bash
npx vitest run src/components/Commerce/Orders/OrderCard.test.tsx
```

Expected: PASS, 3 tests. If `Badge` is not exported from `@/components/ui/badge`, check `packages/ui/src/components/ui/` — the alias points there, not into `apps/dashboard`.

- [ ] **Step 7: Commit**

```bash
git add apps/dashboard/src/components/Commerce/Orders/OrderStatusBadge.tsx \
        apps/dashboard/src/components/Commerce/Orders/OrderCard.tsx \
        apps/dashboard/src/components/Commerce/Orders/OrderCard.test.tsx \
        apps/dashboard/src/messages/fa.json
git commit -m "feat(dashboard): order status badge and list card"
```

---

## Task 4: The list screen

**Files:**
- Create: `src/components/Commerce/Orders/OrdersListPage.tsx`
- Create: `src/app/(Console)/products/orders/page.tsx`
- Modify: `src/components/Layout/ConsoleSidebar.tsx`
- Modify: `src/messages/fa/Console.json`
- Test: `src/components/Commerce/Orders/OrdersListPage.test.tsx`

**Interfaces:**
- Consumes: `useCommerceOrders`, `ordersListKey` (Task 2), `OrderCard` (Task 3).
- Produces: `<OrdersListPage />`, and the exported helper `filtersFromParams(sp: URLSearchParams): OrdersFilters`.

- [ ] **Step 1: Write the failing test for URL filter parsing**

`src/components/Commerce/Orders/OrdersListPage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';

import { filtersFromParams, DEFAULT_LIMIT } from './OrdersListPage';

describe('filtersFromParams', () => {
  it('defaults to page 1 and the default limit when the URL is bare', () => {
    expect(filtersFromParams(new URLSearchParams())).toEqual({ page: 1, limit: DEFAULT_LIMIT });
  });

  it('reads every supported filter out of the URL', () => {
    const sp = new URLSearchParams(
      'page=3&status=processing&search=%D8%B9%D9%84%DB%8C&from=2026-08-01&to=2026-08-31',
    );
    expect(filtersFromParams(sp)).toEqual({
      page: 3,
      limit: DEFAULT_LIMIT,
      status: 'processing',
      search: 'علی',
      from: '2026-08-01',
      to: '2026-08-31',
    });
  });

  it('ignores a status that is not a real order status', () => {
    expect(filtersFromParams(new URLSearchParams('status=banana')).status).toBeUndefined();
  });

  it('falls back to page 1 when the page is junk or below 1', () => {
    expect(filtersFromParams(new URLSearchParams('page=0')).page).toBe(1);
    expect(filtersFromParams(new URLSearchParams('page=abc')).page).toBe(1);
  });

  it('never exceeds the API cap of 200', () => {
    expect(filtersFromParams(new URLSearchParams('limit=500')).limit).toBe(200);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run src/components/Commerce/Orders/OrdersListPage.test.tsx
```

Expected: FAIL — cannot resolve `./OrdersListPage`.

- [ ] **Step 3: Write the list page**

`src/components/Commerce/Orders/OrdersListPage.tsx`. Key parts:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { ItemsPagination } from '@/components/Console/ItemsPagination';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { useCommerceOrders } from '@/hooks/useCommerceOrders';
import type { CommerceOrderStatus, OrdersFilters } from '@/types/commerceOrders';

import { OrderCard } from './OrderCard';

export const DEFAULT_LIMIT = 20;

const STATUSES: readonly CommerceOrderStatus[] = [
  'awaiting_review',
  'processing',
  'sending',
  'completed',
  'cancelled',
];

const isStatus = (v: string | null): v is CommerceOrderStatus =>
  v !== null && (STATUSES as readonly string[]).includes(v);

/**
 * Filters live in the URL, not in `useState` (which is what `ProductListPage` does). Tapping an
 * order navigates to /products/orders/[id]; with local state, every "back" would silently throw
 * away the seller's filters and page position. It also makes a filtered list shareable.
 *
 * `limit` is clamped to 200 because `ReadOrdersDto` caps it there -- a hand-edited URL should
 * degrade to the cap, not 400.
 */
export function filtersFromParams(sp: URLSearchParams): OrdersFilters {
  const rawPage = Number(sp.get('page'));
  const rawLimit = Number(sp.get('limit'));
  const status = sp.get('status');
  const search = sp.get('search');
  const from = sp.get('from');
  const to = sp.get('to');

  return {
    page: Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1,
    limit: Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(Math.floor(rawLimit), 200) : DEFAULT_LIMIT,
    ...(isStatus(status) && { status }),
    ...(search && { search }),
    ...(from && { from }),
    ...(to && { to }),
  };
}
```

The component itself:
- reads `const sp = useSearchParams()` and `const filters = useMemo(() => filtersFromParams(new URLSearchParams(sp.toString())), [sp])`
- `const { orders, meta, isLoading } = useCommerceOrders(filters)`
- `setParam(key, value)` pushes a new URL via `router.replace(`${pathname}?${next}`)`, **always resetting `page` to 1** when any filter other than `page` changes
- renders status chips from `STATUSES` plus an "all" chip that clears `status`
- renders `<OrderCard>` per order, `onOpen={(id) => router.push(`/products/orders/${id}`)}`
- renders `<ItemsPagination serverPage={meta?.currentPage} serverPerPage={meta?.itemsPerPage} serverTotalPages={meta?.totalPages} serverItemCount={meta?.itemCount} totalCount={meta?.totalItems} isLoading={isLoading} onPageChange={(p) => setParam('page', String(p))} onLimitChange={(l) => setParam('limit', String(l))} />`
- **two empty states**: when `orders.length === 0`, show `empty.noMatch` + a `empty.clearFilters` button if any filter is set, otherwise `empty.none` + `empty.noneHint`
- guards the whole screen on `can('order:view')`

- [ ] **Step 4: Write the route shell**

`src/app/(Console)/products/orders/page.tsx`:

```tsx
'use client';

import { LayoutCard } from '@/components/Layout/LayoutCard';
import { OrdersListPage } from '@/components/Commerce/Orders/OrdersListPage';

export default function Page() {
  return (
    <LayoutCard className="_products">
      <OrdersListPage />
    </LayoutCard>
  );
}
```

- [ ] **Step 5: Add the sidebar entry**

In `src/components/Layout/ConsoleSidebar.tsx`, inside the `products` group's `items` array, after the `productsShipping` entry:

```ts
{
  title: t('productsOrders'),
  url: '/products/orders',
},
```

In `src/messages/fa/Console.json`, inside `Console.Sidebar`, add:

```json
"productsOrders": "سفارش‌های فروشگاه"
```

Leave the existing top-level `ordersList` («سفارشات» → `/orders`) entry alone. Two order entries coexist until cutover; that is intended.

- [ ] **Step 6: Run the tests and watch them pass**

```bash
npx vitest run src/components/Commerce/Orders/OrdersListPage.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 7: Type-check and commit**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core
pnpm --filter front exec tsc --noEmit 2>&1 | grep -c "error TS"   # must equal the baseline
git add apps/dashboard/src/components/Commerce/Orders/OrdersListPage.tsx \
        apps/dashboard/src/components/Commerce/Orders/OrdersListPage.test.tsx \
        "apps/dashboard/src/app/(Console)/products/orders/page.tsx" \
        apps/dashboard/src/components/Layout/ConsoleSidebar.tsx \
        apps/dashboard/src/messages/fa/Console.json
git commit -m "feat(dashboard): commerce orders list with url-backed filters"
```

---

## Task 5: The receipt strip

**Files:**
- Create: `src/components/Commerce/Orders/ReceiptLightbox.tsx`
- Create: `src/components/Commerce/Orders/ReceiptStrip.tsx`
- Modify: `src/messages/fa.json` (`Commerce.Orders.receipts`)
- Test: `src/components/Commerce/Orders/ReceiptStrip.test.tsx`

**Interfaces:**
- Consumes: `OrderReceiptView` (Task 1).
- Produces: `<ReceiptStrip receipts={...} />`.

- [ ] **Step 1: Add the copy**

Into `Commerce.Orders` in `src/messages/fa.json`:

```json
"receipts": {
  "title": "رسیدهای پرداخت",
  "none": "هنوز رسیدی فرستاده نشده",
  "attempt": "رسید {n}",
  "close": "بستن"
}
```

- [ ] **Step 2: Write the failing test**

`src/components/Commerce/Orders/ReceiptStrip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderReceiptView } from '@/types/commerceOrders';

import { ReceiptStrip } from './ReceiptStrip';

const copy = messages.Commerce.Orders.receipts;

const receipts: OrderReceiptView[] = [
  { id: 'r1', url: 'https://dl.befroosh.app/one.jpg', createDate: '2026-09-02T11:47:00.000Z' },
  { id: 'r2', url: 'https://dl.befroosh.app/two.jpg', createDate: '2026-09-02T12:04:00.000Z' },
];

const renderStrip = (list: OrderReceiptView[]) =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ReceiptStrip receipts={list} />
    </NextIntlClientProvider>,
  );

describe('ReceiptStrip', () => {
  it('renders every receipt, not just the latest', () => {
    renderStrip(receipts);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('puts the newest first, so a re-upload after a reject leads', () => {
    renderStrip(receipts);
    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('src', 'https://dl.befroosh.app/two.jpg');
    expect(imgs[1]).toHaveAttribute('src', 'https://dl.befroosh.app/one.jpg');
  });

  it('does not mutate the array it was handed', () => {
    const input = [...receipts];
    renderStrip(input);
    expect(input[0].id).toBe('r1');
  });

  it('says so when there is no receipt at all', () => {
    renderStrip([]);
    expect(screen.getByText(copy.none)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
npx vitest run src/components/Commerce/Orders/ReceiptStrip.test.tsx
```

Expected: FAIL — cannot resolve `./ReceiptStrip`.

- [ ] **Step 4: Implement**

`ReceiptLightbox.tsx` renders a `Dialog` from `@/components/ui/dialog` holding one full-size `<img>` and a close button labelled `t('receipts.close')`.

`ReceiptStrip.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { OrderReceiptView } from '@/types/commerceOrders';

import { ReceiptLightbox } from './ReceiptLightbox';

/**
 * Every receipt, newest first. Receipts are append-only in the backend: a reject followed by a
 * re-upload leaves several on one order, and a seller reviewing attempt #2 needs to see what they
 * rejected the first time. `[...receipts]` because `.sort` mutates in place and this array belongs
 * to SWR's cache.
 */
export function ReceiptStrip({ receipts }: { receipts: OrderReceiptView[] }) {
  const t = useTranslations('Commerce.Orders');
  const [open, setOpen] = useState<OrderReceiptView | null>(null);

  if (!receipts.length) {
    return <p className="text-muted-foreground text-sm">{t('receipts.none')}</p>;
  }

  const newestFirst = [...receipts].sort(
    (a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime(),
  );

  return (
    <>
      <div className="flex gap-2 overflow-x-auto">
        {newestFirst.map((receipt, index) => (
          <button key={receipt.id} type="button" onClick={() => setOpen(receipt)} className="shrink-0">
            <img
              src={receipt.url}
              alt={t('receipts.attempt', { n: newestFirst.length - index })}
              className="h-24 w-24 rounded object-cover"
            />
          </button>
        ))}
      </div>
      {open && <ReceiptLightbox receipt={open} onClose={() => setOpen(null)} />}
    </>
  );
}
```

- [ ] **Step 5: Run the test and watch it pass**

```bash
npx vitest run src/components/Commerce/Orders/ReceiptStrip.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Prove the ordering test bites**

Remove the `.sort(...)` call and re-run. The "newest first" test must fail. Restore it.

- [ ] **Step 7: Commit**

```bash
git add apps/dashboard/src/components/Commerce/Orders/ReceiptStrip.tsx \
        apps/dashboard/src/components/Commerce/Orders/ReceiptLightbox.tsx \
        apps/dashboard/src/components/Commerce/Orders/ReceiptStrip.test.tsx \
        apps/dashboard/src/messages/fa.json
git commit -m "feat(dashboard): receipt strip showing every attempt newest first"
```

---

## Task 6: The detail body

**Files:**
- Create: `src/components/Commerce/Orders/OrderDetail.tsx`
- Modify: `src/messages/fa.json` (`Commerce.Orders.detail`)
- Test: `src/components/Commerce/Orders/OrderDetail.test.tsx`

**Interfaces:**
- Consumes: `OrderDetailView` (Task 1), `ReceiptStrip` (Task 5), `OrderStatusBadge` (Task 3).
- Produces: `<OrderDetail order={...} cityName={string | null} actions={ReactNode} />`.

The component takes `cityName` as a **prop**, not a hook — keeping it pure and its test free of network mocking. `OrderDetailPage` (Task 8) resolves the name and passes it down.

- [ ] **Step 1: Add the copy**

Into `Commerce.Orders` in `src/messages/fa.json`:

```json
"detail": {
  "placedAt": "زمان ثبت",
  "payment": "پرداخت",
  "paidAt": "تایید شده در",
  "notPaid": "هنوز پرداخت تایید نشده",
  "buyer": "خریدار و آدرس",
  "recipient": "گیرنده",
  "mobile": "موبایل",
  "city": "شهر",
  "address": "آدرس",
  "plate": "پلاک",
  "unit": "واحد",
  "postalcode": "کد پستی",
  "shippingMethod": "روش ارسال",
  "items": "کالاها",
  "itemsTotal": "جمع کالاها",
  "shippingTotal": "هزینه ارسال",
  "grandTotal": "مبلغ کل",
  "cancelledBecause": "علت لغو"
}
```

- [ ] **Step 2: Write the failing test**

`src/components/Commerce/Orders/OrderDetail.test.tsx` — reuse the `base` order fixture from Task 3's test (copy it in; do not import across test files). Cases:

```tsx
describe('OrderDetail', () => {
  it('shows the city name it was handed rather than the raw id', () => {
    renderDetail({ ...base, receipts: [] }, 'تهران');
    expect(screen.getByText('تهران')).toBeInTheDocument();
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('omits shipping and address entirely for a digital order', () => {
    renderDetail({ ...base, kind: 'digital', address: null, shippingTitle: null, receipts: [] }, null);
    expect(screen.queryByText(copy.detail.address)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.detail.shippingMethod)).not.toBeInTheDocument();
  });

  it('says the payment is not yet confirmed when paidAt is null', () => {
    renderDetail({ ...base, paidAt: null, receipts: [] }, null);
    expect(screen.getByText(copy.detail.notPaid)).toBeInTheDocument();
  });

  it.each([
    ['payment_rejected'],
    ['delivery_refused'],
    ['superseded'],
    ['legacy_cancelled'],
  ])('renders the %s cancel reason in words', (reason) => {
    renderDetail(
      { ...base, status: 'cancelled', cancelReason: reason as never, receipts: [] },
      null,
    );
    expect(
      screen.getByText(copy.cancelReason[reason as keyof typeof copy.cancelReason]),
    ).toBeInTheDocument();
  });

  it('renders each line with its options and line total', () => {
    renderDetail(
      {
        ...base,
        lines: [{ ...base.lines[0], options: [{ name: 'رنگ', value: 'آبی' }] }],
        receipts: [],
      },
      null,
    );
    expect(screen.getByText('شال')).toBeInTheDocument();
    expect(screen.getByText(/رنگ/)).toBeInTheDocument();
  });
});
```

> The `it.each` cases pass literal strings, never an imported enum member. Phase 3a lost four tests to `it.each` cases that were vacuously true because the value was `undefined` at runtime.

- [ ] **Step 3: Run it and watch it fail**

```bash
npx vitest run src/components/Commerce/Orders/OrderDetail.test.tsx
```

Expected: FAIL — cannot resolve `./OrderDetail`.

- [ ] **Step 4: Implement**

Sections in order: header (badge + `placedAt` + `grandTotal`) → payment (`paymentMethod`, `paidAt` or `notPaid`, then `<ReceiptStrip receipts={order.receipts} />`) → buyer/address → lines → totals → `{actions}`.

Two rules the tests enforce:
- when `order.kind === 'digital'`, render **neither** the address block **nor** the shipping-method row;
- when `order.status === 'cancelled' && order.cancelReason`, render `t('detail.cancelledBecause')` and `t(`cancelReason.${order.cancelReason}`)`.

- [ ] **Step 5: Run the test and watch it pass**

```bash
npx vitest run src/components/Commerce/Orders/OrderDetail.test.tsx
```

Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/src/components/Commerce/Orders/OrderDetail.tsx \
        apps/dashboard/src/components/Commerce/Orders/OrderDetail.test.tsx \
        apps/dashboard/src/messages/fa.json
git commit -m "feat(dashboard): commerce order detail body"
```

---

## Task 7: The three dialogs

**Files:**
- Create: `src/components/Commerce/Orders/dialogs/RejectPaymentDialog.tsx`
- Create: `src/components/Commerce/Orders/dialogs/CancelOrderDialog.tsx`
- Create: `src/components/Commerce/Orders/dialogs/ConfirmActionDialog.tsx`
- Modify: `src/messages/fa.json` (`Commerce.Orders.dialogs`)
- Test: `src/components/Commerce/Orders/dialogs/RejectPaymentDialog.test.tsx`
- Test: `src/components/Commerce/Orders/dialogs/CancelOrderDialog.test.tsx`

**Interfaces:**
- Produces: `<RejectPaymentDialog open onOpenChange onConfirm={(reason: string) => Promise<void>} />`, `<CancelOrderDialog open onOpenChange onConfirm={() => Promise<void>} />`, `<ConfirmActionDialog open onOpenChange onConfirm title description confirmLabel />`.

- [ ] **Step 1: Add the copy**

Into `Commerce.Orders` in `src/messages/fa.json`:

```json
"dialogs": {
  "reject": {
    "title": "رد رسید پرداخت",
    "buyerSees": "این متن مستقیم برای خریدار در دایرکت فرستاده می‌شود.",
    "terminal": "با رد کردن رسید، سفارش لغو می‌شود و برگشتی ندارد.",
    "label": "علت رد",
    "presetUnreadable": "تصویر رسید خوانا نیست. لطفاً دوباره بفرست.",
    "presetAmount": "مبلغ واریزی با مبلغ سفارش نمی‌خواند.",
    "presetNotFound": "واریزی با این مشخصات پیدا نشد.",
    "presetWrongCard": "واریز به کارت دیگری انجام شده.",
    "empty": "نوشتن علت الزامی است",
    "tooLong": "علت باید حداکثر ۵۰۰ حرف باشد",
    "confirm": "رد کن و سفارش را لغو کن"
  },
  "cancel": {
    "title": "لغو سفارش",
    "description": "این گزینه برای وقتی است که گیرنده سفارش را تحویل نگرفته. کالاها به موجودی برمی‌گردند و سفارش لغو می‌شود.",
    "confirm": "لغو سفارش"
  },
  "ship": {
    "title": "ارسال سفارش",
    "description": "سفارش به حالت «در حال ارسال» می‌رود. این تغییر برگشت‌پذیر نیست.",
    "confirm": "ارسال شد"
  },
  "complete": {
    "title": "تکمیل سفارش",
    "description": "سفارش تکمیل‌شده علامت می‌خورد. این تغییر برگشت‌پذیر نیست.",
    "confirm": "تکمیل شد"
  },
  "cancelAction": "انصراف"
}
```

- [ ] **Step 2: Write the failing reject-dialog test**

```tsx
describe('RejectPaymentDialog', () => {
  it('warns that the buyer reads this text and that reject is terminal', () => {
    renderReject();
    expect(screen.getByText(copy.dialogs.reject.buyerSees)).toBeInTheDocument();
    expect(screen.getByText(copy.dialogs.reject.terminal)).toBeInTheDocument();
  });

  it('fills the textarea when a preset is tapped, and leaves it editable', () => {
    renderReject();
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.presetUnreadable }));
    const box = screen.getByRole('textbox');
    expect(box).toHaveValue(copy.dialogs.reject.presetUnreadable);
    fireEvent.change(box, { target: { value: 'متن دست‌نویس' } });
    expect(box).toHaveValue('متن دست‌نویس');
  });

  it('blocks an empty reason, because the API requires 1..500', () => {
    const onConfirm = renderReject();
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.confirm }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(copy.dialogs.reject.empty)).toBeInTheDocument();
  });

  it('blocks a reason over 500 characters', () => {
    const onConfirm = renderReject();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x'.repeat(501) } });
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.confirm }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(copy.dialogs.reject.tooLong)).toBeInTheDocument();
  });

  it('sends the typed reason when it is valid', async () => {
    const onConfirm = renderReject();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'رسید ناخواناست' } });
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.confirm }));
    expect(onConfirm).toHaveBeenCalledWith('رسید ناخواناست');
  });
});
```

And for cancel:

```tsx
describe('CancelOrderDialog', () => {
  it('is a confirmation, not a reason picker', () => {
    renderCancel();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText(copy.dialogs.cancel.description)).toBeInTheDocument();
  });

  it('confirms with no argument -- the reason is fixed at the call site', () => {
    const onConfirm = renderCancel();
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.cancel.confirm }));
    expect(onConfirm).toHaveBeenCalledWith();
  });
});
```

- [ ] **Step 3: Run both and watch them fail**

```bash
npx vitest run src/components/Commerce/Orders/dialogs/
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement the three dialogs**

All three use `Dialog` from `@/components/ui/dialog`.

`RejectPaymentDialog` holds `const [reason, setReason] = useState('')` and `const [error, setError] = useState<string | null>(null)`. The four presets are buttons that call `setReason(t('dialogs.reject.presetX'))` — they **fill** the textarea, they do not submit. On confirm: empty → `setError(t('dialogs.reject.empty'))`; length > 500 → `setError(t('dialogs.reject.tooLong'))`; otherwise `await onConfirm(reason)`. The 1–500 bounds mirror `RejectPaymentDto` exactly.

`CancelOrderDialog` renders the description and a confirm button, and calls `onConfirm()` with no argument. **No reason control of any kind** — the API accepts only `delivery_refused`, and `useCommerceOrder.cancel()` already hardcodes it.

`ConfirmActionDialog` is generic: `title`, `description`, `confirmLabel`, `onConfirm`.

- [ ] **Step 5: Run the tests and watch them pass**

```bash
npx vitest run src/components/Commerce/Orders/dialogs/
```

Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/src/components/Commerce/Orders/dialogs/ \
        apps/dashboard/src/messages/fa.json
git commit -m "feat(dashboard): reject, cancel and confirm dialogs for order actions"
```

---

## Task 8: The action bar, the detail page and error handling

**Files:**
- Create: `src/components/Commerce/Orders/OrderActions.tsx`
- Create: `src/components/Commerce/Orders/OrderDetailPage.tsx`
- Create: `src/app/(Console)/products/orders/[id]/page.tsx`
- Modify: `src/messages/fa.json` (`Commerce.Orders.actions`)
- Modify: `src/messages/fa/ErrorCodes.json`
- Test: `src/components/Commerce/Orders/OrderActions.test.tsx`

**Interfaces:**
- Consumes: `actionsFor`, `canMarkPaid` (Task 1), `useCommerceOrder` (Task 2), the dialogs (Task 7), `OrderDetail` (Task 6), `useShippingDestinations`.
- Produces: `<OrderActions order={...} onAction={(name: OrderActionName | 'markPaid', reason?: string) => Promise<void>} disabled />`.

- [ ] **Step 1: Add the copy and the error codes**

Into `Commerce.Orders` in `src/messages/fa.json`:

```json
"actions": {
  "approve": "تایید پرداخت",
  "reject": "رد رسید",
  "ship": "ارسال شد",
  "complete": "تکمیل شد",
  "cancel": "لغو سفارش",
  "markPaid": "علامت‌گذاری به‌عنوان پرداخت‌شده",
  "done": "انجام شد"
}
```

Into `src/messages/fa/ErrorCodes.json`, under the `ERROR_CODES` object — **this file, not `fa.json`, whose `ERROR_CODES` is dead at runtime**:

```json
"COMMERCE_ORDER_STATUS_CHANGED": "وضعیت این سفارش تغییر کرده. صفحه به‌روز شد؛ دوباره بررسی کن.",
"COMMERCE_INSUFFICIENT_STOCK_ON_APPROVAL": "موجودی کالا بین ثبت سفارش و تایید تو تمام شده. باید دستی رسیدگی شود.",
"COMMERCE_ORDER_NOT_FOUND": "این سفارش پیدا نشد."
```

Check first whether `COMMERCE_OUT_OF_STOCK` and `COMMERCE_VARIANT_NOT_FOUND` already exist there from phase 1; add them only if missing.

- [ ] **Step 2: Write the failing action-bar test**

```tsx
describe('OrderActions', () => {
  it('offers approve and reject while awaiting review', () => {
    renderActions({ status: 'awaiting_review', paidAt: null });
    expect(screen.getByRole('button', { name: copy.actions.approve })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.actions.reject })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.actions.ship })).not.toBeInTheDocument();
  });

  it('drops ship once the order is already sending', () => {
    renderActions({ status: 'sending', paidAt: null });
    expect(screen.queryByRole('button', { name: copy.actions.ship })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.actions.complete })).toBeInTheDocument();
  });

  it('offers no lifecycle action on a completed order', () => {
    renderActions({ status: 'completed', paidAt: '2026-09-02T12:00:00.000Z' });
    Object.values({ a: copy.actions.approve, b: copy.actions.ship, c: copy.actions.cancel })
      .forEach((label) =>
        expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument(),
      );
  });

  it('offers markPaid on an unpaid awaiting-review order, which no status table would allow', () => {
    renderActions({ status: 'awaiting_review', paidAt: null });
    expect(screen.getByRole('button', { name: copy.actions.markPaid })).toBeInTheDocument();
  });

  it('withdraws markPaid once paidAt is stamped', () => {
    renderActions({ status: 'processing', paidAt: '2026-09-02T12:00:00.000Z' });
    expect(screen.queryByRole('button', { name: copy.actions.markPaid })).not.toBeInTheDocument();
  });

  it('opens the reject dialog rather than rejecting straight away', () => {
    const onAction = renderActions({ status: 'awaiting_review', paidAt: null });
    fireEvent.click(screen.getByRole('button', { name: copy.actions.reject }));
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText(copy.dialogs.reject.buyerSees)).toBeInTheDocument();
  });

  it('approves without a dialog', () => {
    const onAction = renderActions({ status: 'awaiting_review', paidAt: null });
    fireEvent.click(screen.getByRole('button', { name: copy.actions.approve }));
    expect(onAction).toHaveBeenCalledWith('approve');
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
npx vitest run src/components/Commerce/Orders/OrderActions.test.tsx
```

Expected: FAIL — cannot resolve `./OrderActions`.

- [ ] **Step 4: Implement the action bar**

`OrderActions.tsx` renders one button per `actionsFor(order)`, plus a `markPaid` button when `canMarkPaid(order)`. `reject` opens `RejectPaymentDialog`; `cancel` opens `CancelOrderDialog`; `ship` and `complete` open `ConfirmActionDialog`; `approve` and `markPaid` fire directly. Every button is hidden unless `can('order:manage')`.

- [ ] **Step 5: Implement the detail page**

`OrderDetailPage.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useCommerceOrder } from '@/hooks/useCommerceOrder';
import { useShippingDestinations } from '@/hooks/useShippingDestinations';

import { OrderDetail } from './OrderDetail';
import { OrderActions } from './OrderActions';
import type { OrderActionName } from './orderTransitions';

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const t_ec = useTranslations('ERROR_CODES');
  const { order, isLoading, mutate, approve, reject, ship, complete, cancel, markPaid } =
    useCommerceOrder(orderId);
  const { cityById } = useShippingDestinations();

  /**
   * Matches `OrderActions`' `onAction` signature exactly: (name, reason?) => Promise<void>.
   *
   * `COMMERCE_ORDER_STATUS_CHANGED` means someone else already acted, or the buyer's DM moved this
   * order underneath the page. Toasting alone would leave stale buttons that fail on every retry,
   * so we revalidate: the action bar redraws against the order's real status.
   */
  const onAction = async (name: OrderActionName | 'markPaid', reason?: string) => {
    const run: Record<OrderActionName | 'markPaid', () => Promise<void>> = {
      approve,
      reject: () => reject(reason ?? ''),
      ship,
      complete,
      cancel,
      markPaid,
    };
    try {
      await run[name]();
    } catch (error: any) {
      const code = error?.response?.data?.code;
      toast.error(t_ec(code) || error?.response?.data?.message);
      if (code === 'COMMERCE_ORDER_STATUS_CHANGED') await mutate();
    }
  };

  // Render:
  //   <OrderDetail
  //     order={order}
  //     cityName={order?.cityId ? (cityById.get(order.cityId)?.name ?? null) : null}
  //     actions={<OrderActions order={order} onAction={onAction} disabled={isLoading} />}
  //   />
}
```

> `reject` is the only action carrying a payload, so it is the only entry that reads `reason`. The
> `?? ''` never fires in practice — `RejectPaymentDialog` blocks an empty reason before calling —
> but it keeps the map's type honest without an assertion.

`src/app/(Console)/products/orders/[id]/page.tsx` is a thin shell that reads the route param and renders `<LayoutCard><OrderDetailPage orderId={id} /></LayoutCard>`.

- [ ] **Step 6: Run the test and watch it pass**

```bash
npx vitest run src/components/Commerce/Orders/OrderActions.test.tsx
```

Expected: PASS, 7 tests.

- [ ] **Step 7: Prove the markPaid rule is load-bearing**

Change `canMarkPaid` to `return order.status === 'processing' && order.paidAt === null`. The "offers markPaid on an unpaid awaiting-review order" test must fail. Revert.

- [ ] **Step 8: Run the whole Orders suite, type-check, commit**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core/apps/dashboard
npx vitest run src/components/Commerce/Orders/ src/hooks/useCommerceOrders.test.ts
cd .. && cd ..
pnpm --filter front exec tsc --noEmit 2>&1 | grep -c "error TS"   # must equal the baseline
git add apps/dashboard/src/components/Commerce/Orders/OrderActions.tsx \
        apps/dashboard/src/components/Commerce/Orders/OrderActions.test.tsx \
        apps/dashboard/src/components/Commerce/Orders/OrderDetailPage.tsx \
        "apps/dashboard/src/app/(Console)/products/orders/[id]/page.tsx" \
        apps/dashboard/src/messages/fa.json \
        apps/dashboard/src/messages/fa/ErrorCodes.json
git commit -m "feat(dashboard): order action bar and detail page with status-change recovery"
```

---

## Task 9: The Excel export drawer

**Files:**
- Create: `src/components/Commerce/Orders/OrdersExportDrawer.tsx`
- Modify: `src/components/Commerce/Orders/OrdersListPage.tsx` (header button)
- Modify: `src/messages/fa.json` (`Commerce.Orders.export`)

**Interfaces:**
- Consumes: `OrdersFilters` (Task 1).
- Produces: `<OrdersExportDrawer open onOpenChange filters={OrdersFilters} />`.

- [ ] **Step 1: Read the request shape**

```bash
sed -n '1,60p' /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core/apps/core/src/commerce/orders/dto/commerceOrdersExport.dto.ts
```

Build the payload from what that file actually declares. Do not guess field names.

- [ ] **Step 2: Add the copy**

Into `Commerce.Orders` in `src/messages/fa.json`:

```json
"export": {
  "title": "خروجی اکسل سفارش‌ها",
  "description": "فایل ساخته می‌شود و به ایمیلی که وارد می‌کنی فرستاده می‌شود.",
  "emailLabel": "ایمیل",
  "emailInvalid": "ایمیل معتبر نیست",
  "submit": "بفرست",
  "queued": "درخواست ثبت شد. فایل به ایمیلت می‌رسد."
}
```

- [ ] **Step 3: Implement**

A `Sheet`/`Dialog` with an email field. On submit, `await api.post('/commerce/orders/excelExport', { email, filters })` using the shape from Step 1, then `toast.success(t('export.queued'))` and close. The export is emailed asynchronously — there is no file to download here, so never render a download link.

Wire the trigger into `OrdersListPage`'s header, gated on `can('order:manage')`, following the pattern in `app/(Console)/orders/page.tsx` (`useHeaderFeatures` + `setButtons`).

- [ ] **Step 4: Type-check and commit**

```bash
pnpm --filter front exec tsc --noEmit 2>&1 | grep -c "error TS"
git add apps/dashboard/src/components/Commerce/Orders/OrdersExportDrawer.tsx \
        apps/dashboard/src/components/Commerce/Orders/OrdersListPage.tsx \
        apps/dashboard/src/messages/fa.json
git commit -m "feat(dashboard): excel export for commerce orders"
```

---

## Task 10: Documentation and the cutover obligation

**Files:**
- Create: `knowledge/updates/2026-09-02-buyInDirectPhase3b.update.md`
- Modify: `knowledge/knowledgeMap.doc.md`
- Modify: `/home/cvexor/Documents/MVP/before-prod-cutover.md` (**outer repo**)

- [ ] **Step 1: Write the update doc**

`knowledge/updates/2026-09-02-buyInDirectPhase3b.update.md` with the standard sections — title with date, pointer to the spec and plan, then `Problem` / `Solution` / `Changes` / `Verification`. Verification carries the **real** numbers: the vitest count from Task 8's full-suite run and the tsc count against the recorded baseline.

- [ ] **Step 2: Add the knowledgeMap row**

One row in `knowledge/knowledgeMap.doc.md` for the new update doc.

> **Careful:** another session has uncommitted edits in this same file. Stage it only if your own row is the sole change you introduced, and check `git diff` before staging. If their edits are present, stage a version containing only your row.

- [ ] **Step 3: Add the cutover row**

In `/home/cvexor/Documents/MVP/before-prod-cutover.md`, add a row recording that legacy `/orders` (route, `components/Orders/`, and the `ordersList` sidebar entry) must be deleted and redirected to `/products/orders` once `CommerceOrderCoreData1786960000000` has run in production.

> This file is in the **outer** repo, which carries other sessions' modifications (`Back`, `Front`, `Site`, `CLAUDE.md`, `WORKTREES.md`). Stage only `before-prod-cutover.md`. Never `git add -A` there.

- [ ] **Step 4: Commit (two repos)**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core
git add knowledge/updates/2026-09-02-buyInDirectPhase3b.update.md knowledge/knowledgeMap.doc.md
git commit -m "docs(dashboard): buy-in-direct phase 3b update doc"

cd /home/cvexor/Documents/MVP
git add before-prod-cutover.md
git commit -m "docs(cutover): retire the legacy orders screen after the commerce order backfill"
```

---

## Final Verification

Run all of these and report the real numbers.

- [ ] **Full Orders suite**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core/apps/dashboard
npx vitest run src/components/Commerce/Orders/ src/hooks/useCommerceOrders.test.ts
```

Expected: all pass. Roughly 42 tests across 8 files.

- [ ] **Whole dashboard suite — no regressions**

```bash
npx vitest run
```

Expected: no new failures versus the pre-existing baseline. Record both numbers.

- [ ] **Type check**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core
pnpm --filter front exec tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: exactly the Task 1 baseline.

- [ ] **Lint the touched files only**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core
npx eslint apps/dashboard/src/components/Commerce/Orders apps/dashboard/src/hooks/useCommerceOrder.ts apps/dashboard/src/hooks/useCommerceOrders.ts
```

Expected: no **errors**. Pre-existing warnings elsewhere in the repo are baselined and not this phase's to fix.

- [ ] **Cross-session hygiene**

```bash
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core status --porcelain -uall
```

Expected: exactly the 5 files belonging to the other session, unchanged and unstaged.

- [ ] **JSON validity of all three message files**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core/apps/dashboard/src/messages
python3 -c "import json;[json.load(open(f)) for f in ['fa.json','fa/Console.json','fa/ErrorCodes.json']];print('all valid')"
```

A trailing comma here breaks the whole dashboard at runtime, and no test catches it.
