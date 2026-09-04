# Orders Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/products/orders` from a card grid into a six-column table (row-cards on phone) that shows the کارت‌به‌کارت receipt, and rebuild the order detail page as a sticky decision rail beside a detail column, with a status select + confirmation dialog replacing six action buttons.

**Architecture:** Back gains an `OrderListView` (an `OrderView` plus `receiptUrl`/`receiptCount`) served only on the seller list route, hydrated after pagination so no to-many join touches `skip`/`take`. Front replaces `OrderCard` with a table + row-card pair sharing one pure derivation module, and replaces `OrderActions` with a `targetStatusesFor`-driven select whose confirm dialog is chosen by `actionForTransition`.

**Tech Stack:** NestJS + TypeORM (Back, jest) · Next.js App Router + SWR + next-intl + Tailwind + shadcn/ui (Front, vitest + Testing Library)

**Spec:** `docs/superpowers/specs/2026-09-04-orders-screen-redesign-design.md`

## Global Constraints

- **Worktrees only.** Front work in `/home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core`, Back work in `/home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core`. Both are on branch `feat/commerce-product-core`. Never edit, stage or commit in `Front/` or `Back/` themselves. Pass absolute paths; use `git -C <worktree> …` (CLAUDE.md §0, §0.1).
- **i18n:** every user-facing string comes from `t(...)`. New keys go in `apps/dashboard/src/messages/fa.json` **only** — never `en.json` (CLAUDE.md §8).
- **Branded types** (Back): use `@befroosh/common` ids (`CommerceOrderId`, `WorkspaceId`, …), never plain `string` (CLAUDE.md §6).
- **Response envelopes:** `GET /commerce/orders` returns `PaginatedResult` (`{items, meta}`) directly; `GET /commerce/orders/:id` returns `ResponseMessage` (payload under `.data`). These genuinely differ — do not "unify" them (CLAUDE.md §9).
- **Verification is part of the task.** Run scoped `tsc --noEmit` and the touched test files without asking. Never report done without real command output (CLAUDE.md §7.1). Do **not** run `next build` or `pnpm run dev`.
- **Dashboard tsc baseline is 206 pre-existing errors** (measured on `e825650e`). It must not grow. Check by grepping for the touched filenames, not by the total.
- **Commit after every task.** End every commit message with:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM
  ```
  A husky/lint-staged hook runs eslint + prettier on commit; let it.
- **Never merge this branch anywhere** without the user asking (CLAUDE.md §0).

**Commands** (memorise — repeated throughout):

| What | Command |
|---|---|
| Front test | `cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core/apps/dashboard && npx vitest run <path>` |
| Front tsc | same dir, `npx tsc --noEmit 2>&1 \| grep -E '<TouchedFile>'` |
| ui test | `cd …/commerce-product-core/packages/ui && npx vitest run <path>` |
| Back test | `cd /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core/apps/core && npx jest <path> --runInBand` |
| Back tsc | `cd /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core && pnpm --filter core exec tsc --noEmit` |

---

## File Structure

**Back** (`Back/worktrees/commerce-product-core/apps/core/src/commerce/orders/`)

| File | Responsibility |
|---|---|
| `orderView.mapper.ts` *(modify)* | `+ OrderListView`, `+ toOrderListView`, `+ mapReceipts` helper shared with `toOrderDetailView` |
| `orderRead.service.ts` *(modify)* | `+ SELLER_LIST_RELATIONS`, `+ hydrateForSeller`; `readManyForWorkspace` returns `OrderListView[]` |
| `orderView.mapper.spec.ts` *(modify)* | covers `toOrderListView` |
| `orderRead.service.spec.ts` *(modify)* | covers `hydrateForSeller` + the buyer-path leak guard |

**Front** (`Front/worktrees/commerce-product-core/apps/dashboard/src/`)

| File | Responsibility |
|---|---|
| `types/commerceOrders.ts` *(modify)* | `+ OrderListView` |
| `hooks/useCommerceOrders.ts` *(modify)* | returns `OrderListView[]` |
| `messages/fa.json` *(modify)* | new `Commerce.Orders` keys |
| `components/Commerce/Orders/orderRowFields.ts` *(new)* | **pure** row derivation shared by table + row-card |
| `components/Commerce/Orders/OrderThumbs.tsx` *(new)* | product + receipt thumbnails, receipt → lightbox |
| `components/Commerce/Orders/OrdersTable.tsx` *(new)* | six-column table, `md`+ |
| `components/Commerce/Orders/OrderRowCard.tsx` *(new)* | compact row-card, below `md` |
| `components/Commerce/Orders/OrdersListPage.tsx` *(modify)* | swaps the grid for the pair |
| `components/Commerce/Orders/OrderCard.tsx` *(delete)* | replaced |
| `components/Commerce/Orders/orderTransitions.ts` *(modify)* | `+ targetStatusesFor`, `+ actionForTransition` |
| `components/Commerce/Orders/OrderStatusUpdater.tsx` *(new)* | select + update button + dialog routing + markPaid |
| `components/Commerce/Orders/OrderSummaryRail.tsx` *(new)* | the sticky decision rail |
| `components/Commerce/Orders/OrderBuyerCard.tsx` *(new)* | buyer + delivery, incl. the pickup special case |
| `components/Commerce/Orders/OrderItemsCard.tsx` *(new)* | line items |
| `components/Commerce/Orders/OrderTotalsCard.tsx` *(new)* | totals |
| `components/Commerce/Orders/OrderDetail.tsx` *(modify)* | reduced to layout + composition |
| `components/Commerce/Orders/OrderActions.tsx` *(delete)* | replaced by `OrderStatusUpdater` |

Unchanged and not to be touched: `ReceiptStrip`, `ReceiptLightbox`, `OrderStatusBadge`, `OrdersExportDrawer`, `dialogs/*`, `OrderDetailPage`'s `onAction` contract, the legacy `/orders` screen, everything under `packages/`.

---

## Task 1: Back — `toOrderListView`

**Files:**
- Modify: `apps/core/src/commerce/orders/orderView.mapper.ts`
- Test: `apps/core/src/commerce/orders/orderView.mapper.spec.ts`

**Interfaces:**
- Consumes: existing `OrderView`, `toOrderView`, `OrderReceiptView`, `toOrderDetailView`.
- Produces:
  ```ts
  export interface OrderListView extends OrderView {
    receiptUrl: string | null;
    receiptCount: number;
  }
  export function toOrderListView(
    order: CommerceOrder,
    urlByFileId: Map<number, string>,
  ): OrderListView;
  ```

- [ ] **Step 1: Write the failing test**

Append to `orderView.mapper.spec.ts` (reuse whatever order factory the file already defines; if it builds orders inline, build one the same way):

```ts
describe('toOrderListView', () => {
  const receipt = (id: string, fileId: number, iso: string) =>
    ({ id, fileId, createDate: new Date(iso) }) as any;

  it('takes the newest receipt url and counts them all', () => {
    const order = {
      ...baseOrder,
      receipts: [
        receipt('r1', 1, '2026-09-01T10:00:00Z'),
        receipt('r2', 2, '2026-09-03T10:00:00Z'),
        receipt('r3', 3, '2026-09-02T10:00:00Z'),
      ],
    } as any;
    const urls = new Map([
      [1, 'https://cdn/1.jpg'],
      [2, 'https://cdn/2.jpg'],
      [3, 'https://cdn/3.jpg'],
    ]);

    const view = toOrderListView(order, urls);

    expect(view.receiptUrl).toBe('https://cdn/2.jpg');
    expect(view.receiptCount).toBe(3);
  });

  it('is null with no receipts', () => {
    const view = toOrderListView({ ...baseOrder, receipts: [] } as any, new Map());
    expect(view.receiptUrl).toBeNull();
    expect(view.receiptCount).toBe(0);
  });

  it('skips a receipt whose file row is gone, rather than emitting an empty url', () => {
    const order = {
      ...baseOrder,
      receipts: [
        receipt('r1', 1, '2026-09-01T10:00:00Z'),
        receipt('r2', 2, '2026-09-03T10:00:00Z'), // newest, but no file row
      ],
    } as any;

    const view = toOrderListView(order, new Map([[1, 'https://cdn/1.jpg']]));

    expect(view.receiptUrl).toBe('https://cdn/1.jpg');
    expect(view.receiptCount).toBe(1);
  });

  it('carries every OrderView field through unchanged', () => {
    const view = toOrderListView({ ...baseOrder, receipts: [] } as any, new Map());
    expect(view).toMatchObject(toOrderView({ ...baseOrder, receipts: [] } as any));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core/apps/core
npx jest src/commerce/orders/orderView.mapper.spec.ts --runInBand
```
Expected: FAIL — `toOrderListView is not a function`.

- [ ] **Step 3: Write the implementation**

In `orderView.mapper.ts`, extract the receipt mapping `toOrderDetailView` already does into a shared helper, then build on it:

```ts
/**
 * Shared by `toOrderDetailView` and `toOrderListView` so the two can never disagree about
 * ordering or about what to do with a receipt whose file row is gone.
 *
 * A receipt whose `fileId` has no `file_entity` row (hard-deleted, or a botched import) is
 * DROPPED rather than emitted with an empty `url` a viewer would render as a broken image --
 * which is also why `receiptCount` counts what survived, not `order.receipts.length`.
 */
function mapReceipts(
  order: CommerceOrder,
  urlByFileId: Map<number, string>,
): OrderReceiptView[] {
  return (order.receipts ?? [])
    .map((receipt) => {
      const url = urlByFileId.get(receipt.fileId);
      return url ? { id: receipt.id, url, createDate: receipt.createDate } : null;
    })
    .filter((r): r is OrderReceiptView => r !== null)
    .sort((a, b) => b.createDate.getTime() - a.createDate.getTime());
}

/**
 * The SELLER list view. `OrderView` plus just enough of the receipt trail to judge a
 * کارت‌به‌کارت payment straight from the list: the newest receipt's url, and how many exist so
 * the row can mark a re-upload without shipping every url.
 *
 * Deliberately NOT folded into `toOrderView`: that mapper is shared by the buyer-facing reads
 * (`readOneForCustomer`, `readManyForCustomer`) and by `CheckoutService`, none of which should
 * carry a receipt url.
 */
export interface OrderListView extends OrderView {
  receiptUrl: string | null;
  receiptCount: number;
}

export function toOrderListView(
  order: CommerceOrder,
  urlByFileId: Map<number, string>,
): OrderListView {
  const receipts = mapReceipts(order, urlByFileId);
  return {
    ...toOrderView(order),
    receiptUrl: receipts[0]?.url ?? null,
    receiptCount: receipts.length,
  };
}
```

Then rewrite `toOrderDetailView`'s body to use the helper — behaviour identical:

```ts
export function toOrderDetailView(
  order: CommerceOrder,
  urlByFileId: Map<number, string>,
): OrderDetailView {
  return { ...toOrderView(order), receipts: mapReceipts(order, urlByFileId) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/commerce/orders/orderView.mapper.spec.ts --runInBand
```
Expected: PASS, including every pre-existing `toOrderDetailView` test (the refactor must not change its behaviour).

- [ ] **Step 5: Type-check**

```bash
cd /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core
pnpm --filter core exec tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git -C /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core add apps/core/src/commerce/orders/orderView.mapper.ts apps/core/src/commerce/orders/orderView.mapper.spec.ts
git -C /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core commit -m "feat(commerce): OrderListView carries the newest receipt for the seller list

toOrderDetailView's receipt mapping becomes a shared mapReceipts helper so the
detail and list views cannot disagree about ordering or about dropping a
receipt whose file row is gone.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 2: Back — serve `OrderListView` from the seller list route

**Files:**
- Modify: `apps/core/src/commerce/orders/orderRead.service.ts`
- Test: `apps/core/src/commerce/orders/orderRead.service.spec.ts`

**Interfaces:**
- Consumes: `toOrderListView` (Task 1).
- Produces: `readManyForWorkspace(workspaceId, query): Promise<PaginatedResult<OrderListView[]>>`.

- [ ] **Step 1: Write the failing test**

Append to `orderRead.service.spec.ts`, following the file's existing repository-mock style:

```ts
describe('readManyForWorkspace — receipts', () => {
  it('hydrates with receipts and attaches the newest url', async () => {
    orderRepo.findAndCount.mockResolvedValue([[{ id: 'o1' }], 1]);
    orderRepo.find.mockResolvedValue([
      {
        ...baseOrder,
        id: 'o1',
        lines: [],
        receipts: [
          { id: 'r1', fileId: 7, createDate: new Date('2026-09-01T00:00:00Z') },
          { id: 'r2', fileId: 8, createDate: new Date('2026-09-03T00:00:00Z') },
        ],
      },
    ]);
    fileRepo.find.mockResolvedValue([
      { id: 7, url: 'https://cdn/7.jpg' },
      { id: 8, url: 'https://cdn/8.jpg' },
    ]);

    const result = await service.readManyForWorkspace('ws1' as WorkspaceId, {
      page: 1,
      limit: 20,
    } as any);

    expect(result.items[0].receiptUrl).toBe('https://cdn/8.jpg');
    expect(result.items[0].receiptCount).toBe(2);
    expect(orderRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ relations: ['lines', 'receipts'] }),
    );
  });

  it('does not query files when the page has no receipts at all', async () => {
    orderRepo.findAndCount.mockResolvedValue([[{ id: 'o1' }], 1]);
    orderRepo.find.mockResolvedValue([{ ...baseOrder, id: 'o1', lines: [], receipts: [] }]);

    const result = await service.readManyForWorkspace('ws1' as WorkspaceId, {
      page: 1,
      limit: 20,
    } as any);

    expect(result.items[0].receiptUrl).toBeNull();
    expect(fileRepo.find).not.toHaveBeenCalled();
  });

  it('preserves the paginating query order, not the order Postgres returned rows in', async () => {
    orderRepo.findAndCount.mockResolvedValue([[{ id: 'o1' }, { id: 'o2' }], 2]);
    orderRepo.find.mockResolvedValue([
      { ...baseOrder, id: 'o2', lines: [], receipts: [] },
      { ...baseOrder, id: 'o1', lines: [], receipts: [] },
    ]);

    const result = await service.readManyForWorkspace('ws1' as WorkspaceId, {
      page: 1,
      limit: 20,
    } as any);

    expect(result.items.map((o) => o.orderId)).toEqual(['o1', 'o2']);
  });
});

describe('readManyForCustomer — no receipt leak', () => {
  it('never puts a receipt url in a buyer payload', async () => {
    orderRepo.findAndCount.mockResolvedValue([[{ id: 'o1' }], 1]);
    orderRepo.find.mockResolvedValue([
      {
        ...baseOrder,
        id: 'o1',
        lines: [],
        receipts: [{ id: 'r1', fileId: 7, createDate: new Date() }],
      },
    ]);

    const result = await service.readManyForCustomer({ customerId: 'c1' } as any, {
      page: 1,
      limit: 20,
    } as any);

    expect(result.items[0]).not.toHaveProperty('receiptUrl');
    expect(orderRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ relations: ['lines'] }),
    );
  });
});
```

> If the spec file's mocks are named differently, match the file — do not rename its existing mocks.

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core/apps/core
npx jest src/commerce/orders/orderRead.service.spec.ts --runInBand
```
Expected: FAIL — `receiptUrl` is `undefined`.

- [ ] **Step 3: Write the implementation**

Add beside `LIST_RELATIONS`:

```ts
/**
 * The SELLER list's relations. `receipts` is safe to join HERE and nowhere near the paginating
 * query: `hydrateForSeller` is a `WHERE id IN (...)` fetch with no `skip`/`take`, so the to-many
 * flattening `LIST_RELATIONS`' docstring warns about has nothing to slice. `readOne` already
 * joins `receipts` the same way, for the same reason.
 */
const SELLER_LIST_RELATIONS = ['lines', 'receipts'];
```

Add the hydrator next to `hydrate`:

```ts
/**
 * `hydrate`'s seller-side twin: same id-order preservation, plus the receipt urls.
 *
 * `commerce_order_receipt.fileId` is a plain FK with no relation (the module's boundary rule),
 * so urls come from ONE targeted `fileRepo.find` over the whole page's file ids -- not a join,
 * and not a query per order.
 */
private async hydrateForSeller(ids: CommerceOrderId[]): Promise<OrderListView[]> {
  if (!ids.length) return [];

  const orders = await this.orderRepo.find({
    where: { id: In(ids) },
    relations: SELLER_LIST_RELATIONS,
  });

  const fileIds = orders.flatMap((order) => (order.receipts ?? []).map((r) => r.fileId));
  // Skipped entirely for a page with no receipts -- `In([])` is a query for nothing.
  const files = fileIds.length
    ? await this.fileRepo.find({ where: { id: In(fileIds) }, select: { id: true, url: true } })
    : [];
  const urlByFileId = new Map(files.map((f) => [f.id, f.url]));

  const byId = new Map(orders.map((order) => [order.id, order]));
  return ids
    .map((id) => byId.get(id))
    .filter((order): order is CommerceOrder => !!order)
    .map((order) => toOrderListView(order, urlByFileId));
}
```

In `readManyForWorkspace`, change the return type to `Promise<PaginatedResult<OrderListView[]>>`, swap the hydrate call and the envelope's generic:

```ts
const items = await this.hydrateForSeller(idRows.map((r) => r.id));

return new PaginatedResult<OrderListView[]>({
```

Import `OrderListView` and `toOrderListView` from `./orderView.mapper`. Leave `hydrate`, `readManyForCustomer` and `LIST_RELATIONS` exactly as they are.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/commerce/orders/orderRead.service.spec.ts src/commerce/orders/orders.controller.spec.ts --runInBand
```
Expected: PASS.

- [ ] **Step 5: Type-check**

```bash
cd /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core
pnpm --filter core exec tsc --noEmit
```
Expected: no errors. If the controller's return type is annotated, widen it to `OrderListView[]`.

- [ ] **Step 6: Commit**

```bash
git -C /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core add apps/core/src/commerce/orders/orderRead.service.ts apps/core/src/commerce/orders/orderRead.service.spec.ts
git -C /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core commit -m "feat(commerce): seller order list carries the newest receipt url

hydrateForSeller joins receipts and resolves urls in one targeted file query.
Safe because it runs AFTER pagination -- a WHERE id IN (...) fetch has no
skip/take for the to-many flattening to corrupt. The buyer list keeps plain
hydrate, so no receipt url can reach a buyer payload.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 3: Front — types, hook typing, and every new translation key

**Files:**
- Modify: `apps/dashboard/src/types/commerceOrders.ts`
- Modify: `apps/dashboard/src/hooks/useCommerceOrders.ts:44-56`
- Modify: `apps/dashboard/src/messages/fa.json`

**Interfaces:**
- Produces: `OrderListView`; `useCommerceOrders(...).orders: OrderListView[]`; all `Commerce.Orders` keys later tasks call `t()` with.

> Doing the copy up front means no later task is blocked writing Persian strings, and a missing key can never silently render as a raw key path.

- [ ] **Step 1: Add the type**

In `types/commerceOrders.ts`, after `OrderView`:

```ts
/**
 * What `GET /commerce/orders` (the SELLER list) returns — mirrors Back's `OrderListView`.
 * `receiptUrl` is the newest receipt only; `receiptCount` lets a row mark a re-upload without
 * shipping every url. The buyer-facing reads return plain `OrderView`.
 */
export interface OrderListView extends OrderView {
  receiptUrl: string | null;
  receiptCount: number;
}
```

- [ ] **Step 2: Retype the hook**

In `hooks/useCommerceOrders.ts`: import `OrderListView` and change the two references — `useSWR<PaginatedResult<OrderListView[]>>(key)` and the `orders` fallback stays `data?.items ?? []`. Nothing else changes.

- [ ] **Step 3: Add the translation keys**

In `messages/fa.json`, inside `Commerce.Orders`:

```json
"table": {
  "product": "کالا",
  "recipient": "گیرنده",
  "placedAt": "تاریخ ثبت",
  "grandTotal": "مبلغ کل",
  "payment": "پرداخت",
  "status": "وضعیت",
  "openOrder": "دیدن سفارش"
},
"payment": {
  "paid": "پرداخت تایید شده",
  "unpaid": "پرداخت تایید نشده"
},
"statusUpdate": {
  "label": "وضعیت سفارش",
  "submit": "بروزرسانی",
  "terminal": "این سفارش بسته شده و وضعیتش تغییر نمی‌کند.",
  "hint": "وضعیت تازه را انتخاب کن و «بروزرسانی» را بزن."
},
"pickup": {
  "notice": "این سفارش تحویل حضوری است و ارسال نمی‌شود.",
  "addressUnknown": "محل تحویل روی این سفارش ثبت نشده."
}
```

Extend the existing `receipts` object with one key:

```json
"thumbAlt": "رسید پرداخت"
```

Extend the existing `dialogs` object with two entries:

```json
"approve": {
  "title": "تایید پرداخت",
  "description": "سفارش به «در حال آماده‌سازی» می‌رود و کالاها از موجودی کم می‌شوند.",
  "confirm": "تایید پرداخت"
},
"markPaid": {
  "title": "ثبت پرداخت",
  "description": "این سفارش پرداخت‌شده علامت می‌خورد. این تغییر برگشت‌پذیر نیست.",
  "confirm": "ثبت پرداخت"
}
```

Do **not** touch `en.json` (CLAUDE.md §8).

- [ ] **Step 4: Verify the file is still valid JSON and the keys resolve**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core/apps/dashboard
python3 -c "
import json; d=json.load(open('src/messages/fa.json'))['Commerce']['Orders']
for k in ['table','payment','statusUpdate','pickup']: assert k in d, k
assert 'thumbAlt' in d['receipts']
assert 'approve' in d['dialogs'] and 'markPaid' in d['dialogs']
print('keys ok')"
npx tsc --noEmit 2>&1 | grep -E 'commerceOrders|useCommerceOrders'; echo "tsc grep done"
```
Expected: `keys ok`, and no tsc lines for those two files.

- [ ] **Step 5: Commit**

```bash
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add apps/dashboard/src/types/commerceOrders.ts apps/dashboard/src/hooks/useCommerceOrders.ts apps/dashboard/src/messages/fa.json
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "feat(orders): add the OrderListView type and the redesign's translation keys

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 4: Front — `orderRowFields` (pure row derivation)

**Files:**
- Create: `apps/dashboard/src/components/Commerce/Orders/orderRowFields.ts`
- Test: `apps/dashboard/src/components/Commerce/Orders/orderRowFields.test.ts`

**Interfaces:**
- Consumes: `OrderListView` (Task 3).
- Produces:
  ```ts
  export type KnownPaymentMethod = 'card_to_card' | 'free' | 'cash_on_delivery';
  export interface OrderRowFields {
    firstLine: ViewLine | undefined;
    extraLines: number;
    itemCount: number;
    isPaid: boolean;
    isPickup: boolean;
    paymentMethodKey: KnownPaymentMethod | null;
  }
  export function orderRowFields(order: OrderView): OrderRowFields;
  ```
  Tasks 6, 7, 11 and 12 all call this. `paymentMethodKey === null` means "unrecognised, render `order.paymentMethod` raw".

  **Takes `OrderView`, not `OrderListView`** — it reads no receipt field, and widening the parameter is what lets Task 11 pass an `OrderDetailView` straight in. `OrderListView` and `OrderDetailView` both extend `OrderView`, so every caller type-checks.

- [ ] **Step 1: Write the failing test**

Create `orderRowFields.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

import type { OrderListView } from '@/types/commerceOrders';

import { orderRowFields } from './orderRowFields';

const line = (over: Partial<OrderListView['lines'][number]> = {}) => ({
  variantId: 'v1',
  productId: 'p1',
  title: 'شال',
  options: [],
  imageUrl: null,
  unitPrice: 1000,
  compareAtPrice: null,
  quantity: 1,
  lineTotal: 1000,
  ...over,
});

const base: OrderListView = {
  orderId: 'o1',
  status: 'awaiting_review',
  cancelReason: null,
  kind: 'physical',
  lines: [line()],
  itemsTotal: 1000,
  shippingTotal: 0,
  grandTotal: 1000,
  paymentMethod: 'card_to_card',
  recipientName: 'علی',
  mobile: '09120000000',
  cityId: 1,
  address: 'خیابان',
  plate: null,
  unit: null,
  postalcode: null,
  placedAt: '2026-09-02T10:00:00.000Z',
  shippingTitle: null,
  shippingKind: null,
  shippingSettlement: null,
  paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z',
  receiptUrl: null,
  receiptCount: 0,
};

describe('orderRowFields', () => {
  it('counts quantity for itemCount but distinct lines for extraLines', () => {
    const f = orderRowFields({ ...base, lines: [line({ quantity: 3 })] });
    expect(f.itemCount).toBe(3);
    expect(f.extraLines).toBe(0);
  });

  it('extraLines is distinct lines beyond the first', () => {
    const f = orderRowFields({
      ...base,
      lines: [line(), line({ variantId: 'v2' }), line({ variantId: 'v3' })],
    });
    expect(f.extraLines).toBe(2);
    expect(f.firstLine?.variantId).toBe('v1');
  });

  it('is paid only when paidAt is set', () => {
    expect(orderRowFields(base).isPaid).toBe(false);
    expect(orderRowFields({ ...base, paidAt: '2026-09-03T00:00:00Z' }).isPaid).toBe(true);
  });

  it('recognises the three known payment methods and nulls anything else', () => {
    expect(orderRowFields(base).paymentMethodKey).toBe('card_to_card');
    expect(orderRowFields({ ...base, paymentMethod: 'free' }).paymentMethodKey).toBe('free');
    expect(orderRowFields({ ...base, paymentMethod: 'zarinpal' }).paymentMethodKey).toBeNull();
  });

  it('flags a pickup order', () => {
    expect(orderRowFields(base).isPickup).toBe(false);
    expect(orderRowFields({ ...base, shippingKind: 'pickup' }).isPickup).toBe(true);
  });

  it('survives an order with no lines', () => {
    const f = orderRowFields({ ...base, lines: [] });
    expect(f.firstLine).toBeUndefined();
    expect(f.itemCount).toBe(0);
    expect(f.extraLines).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core/apps/dashboard
npx vitest run src/components/Commerce/Orders/orderRowFields.test.ts
```
Expected: FAIL — cannot resolve `./orderRowFields`.

- [ ] **Step 3: Write the implementation**

Create `orderRowFields.ts`:

```ts
import type { OrderView, ViewLine } from '@/types/commerceOrders';

export type KnownPaymentMethod = 'card_to_card' | 'free' | 'cash_on_delivery';

const KNOWN_PAYMENT_METHODS: readonly KnownPaymentMethod[] = [
  'card_to_card',
  'free',
  'cash_on_delivery',
];

export interface OrderRowFields {
  firstLine: ViewLine | undefined;
  /** Distinct lines beyond the one shown -- NOT `itemCount`, which sums quantity. 3x the same
   *  shirt is one line and correctly shows no "+N": the row is not hiding anything. */
  extraLines: number;
  itemCount: number;
  isPaid: boolean;
  isPickup: boolean;
  /**
   * `null` for a value outside `CommercePaymentMethodEnum`. The backend column is a plain
   * `varchar(40)`, not a DB enum, so a row from the legacy backfill can carry anything --
   * callers render `order.paymentMethod` raw in that case rather than letting next-intl print a
   * missing key path like `Commerce.Orders.paymentMethod.zarinpal`.
   */
  paymentMethodKey: KnownPaymentMethod | null;
}

/**
 * Every derived value the orders list shows, computed once from one order.
 *
 * Pure and hook-free on purpose: `OrdersTable` (md+) and `OrderRowCard` (below md) render the
 * SAME order two different ways, and this is what stops the two from drifting apart. It returns
 * translation KEYS, never translated text, so it stays testable without an intl provider.
 */
export function orderRowFields(order: OrderView): OrderRowFields {
  const paymentMethodKey =
    (KNOWN_PAYMENT_METHODS as readonly string[]).includes(order.paymentMethod)
      ? (order.paymentMethod as KnownPaymentMethod)
      : null;

  return {
    firstLine: order.lines[0],
    extraLines: Math.max(0, order.lines.length - 1),
    itemCount: order.lines.reduce((sum, l) => sum + l.quantity, 0),
    isPaid: order.paidAt !== null,
    isPickup: order.shippingKind === 'pickup',
    paymentMethodKey,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/Commerce/Orders/orderRowFields.test.ts
```
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add apps/dashboard/src/components/Commerce/Orders/orderRowFields.ts apps/dashboard/src/components/Commerce/Orders/orderRowFields.test.ts
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "feat(orders): pure row derivation shared by the table and the row-card

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 5: Front — `OrderThumbs`

**Files:**
- Create: `apps/dashboard/src/components/Commerce/Orders/OrderThumbs.tsx`
- Test: `apps/dashboard/src/components/Commerce/Orders/OrderThumbs.test.tsx`

**Interfaces:**
- Consumes: `orderRowFields` (Task 4), existing `ReceiptLightbox`.
- Produces: `<OrderThumbs order={OrderListView} />`.

- [ ] **Step 1: Write the failing test**

Create `OrderThumbs.test.tsx` (reuse the `base` fixture shape from Task 4's test — copy it into this file; the two files are read independently):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderListView } from '@/types/commerceOrders';

import { OrderThumbs } from './OrderThumbs';

const copy = messages.Commerce.Orders;

const base: OrderListView = {
  orderId: 'o1', status: 'awaiting_review', cancelReason: null, kind: 'physical',
  lines: [{ variantId: 'v1', productId: 'p1', title: 'شال', options: [], imageUrl: null,
    unitPrice: 1000, compareAtPrice: null, quantity: 1, lineTotal: 1000 }],
  itemsTotal: 1000, shippingTotal: 0, grandTotal: 1000, paymentMethod: 'card_to_card',
  recipientName: 'علی', mobile: '09120000000', cityId: 1, address: 'خیابان', plate: null,
  unit: null, postalcode: null, placedAt: '2026-09-02T10:00:00.000Z', shippingTitle: null,
  shippingKind: null, shippingSettlement: null, paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z', receiptUrl: null, receiptCount: 0,
};

const renderThumbs = (order: OrderListView) =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderThumbs order={order} />
    </NextIntlClientProvider>,
  );

describe('OrderThumbs', () => {
  it('renders the product image when the first line has one', () => {
    renderThumbs({ ...base, lines: [{ ...base.lines[0], imageUrl: 'https://cdn/p.jpg' }] });
    expect(screen.getByAltText('شال')).toHaveAttribute('src', 'https://cdn/p.jpg');
  });

  it('falls back to an icon tile, never a broken img, with no product image', () => {
    renderThumbs(base);
    expect(screen.queryByAltText('شال')).toBeNull();
  });

  it('renders no receipt thumbnail when there is none', () => {
    renderThumbs(base);
    expect(screen.queryByAltText(copy.receipts.thumbAlt)).toBeNull();
  });

  it('opens the lightbox when the receipt thumbnail is clicked', () => {
    renderThumbs({ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 1 });
    fireEvent.click(screen.getByAltText(copy.receipts.thumbAlt));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not let the receipt click bubble to the row', () => {
    const onRowClick = vi.fn();
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <div onClick={onRowClick}>
          <OrderThumbs order={{ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 1 }} />
        </div>
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByAltText(copy.receipts.thumbAlt));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('marks a re-upload with the receipt count', () => {
    renderThumbs({ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/Commerce/Orders/OrderThumbs.test.tsx
```
Expected: FAIL — cannot resolve `./OrderThumbs`.

- [ ] **Step 3: Write the implementation**

```tsx
'use client';

import { FileDigitIcon, PackageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { OrderListView } from '@/types/commerceOrders';

import { ReceiptLightbox } from './ReceiptLightbox';
import { orderRowFields } from './orderRowFields';

/**
 * The two images a seller judges an order by: what was bought, and the کارت‌به‌کارت receipt.
 *
 * The receipt is the reason this exists. Reviewing a batch of `awaiting_review` orders used to
 * mean opening every one of them; here the thumbnail opens the SAME `ReceiptLightbox` the detail
 * page uses, in place, so payment can be judged without leaving the list.
 *
 * Plain `<img>`, matching `OrderCard`/`CommerceProductCard` before it: these are remote R2 urls
 * and a page renders up to `limit` (max 200) of them.
 */
export function OrderThumbs({ order }: { order: OrderListView }) {
  const t = useTranslations('Commerce.Orders');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { firstLine } = orderRowFields(order);
  const TypeIcon = order.kind === 'physical' ? PackageIcon : FileDigitIcon;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {firstLine?.imageUrl ? (
        <img
          src={firstLine.imageUrl}
          alt={firstLine.title}
          className="size-11 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-md"
        >
          <TypeIcon className="size-5 text-gray-400" />
        </div>
      )}

      {order.receiptUrl && (
        <div className="relative shrink-0">
          <button
            type="button"
            /**
             * The whole row is a click target that navigates to the detail page. Without
             * `stopPropagation` this button would open the lightbox AND navigate away from it in
             * the same click, so the lightbox would never be seen.
             */
            onClick={(event) => {
              event.stopPropagation();
              setLightboxOpen(true);
            }}
            className="block"
          >
            <img
              src={order.receiptUrl}
              alt={t('receipts.thumbAlt')}
              className="size-11 rounded-md border object-cover"
            />
          </button>
          {order.receiptCount > 1 && (
            /* A re-upload happened -- the seller rejected once and the buyer sent another.
               Shown as a count, not N thumbnails: the list has room for one. */
            <span className="bg-secondary text-secondary-foreground absolute -top-1 -end-1 rounded-full px-1.5 text-[10px] font-semibold">
              {order.receiptCount}
            </span>
          )}
        </div>
      )}

      {lightboxOpen && (
        <ReceiptLightbox
          receipt={{ id: order.orderId, url: order.receiptUrl!, createDate: order.placedAt }}
          label={t('receipts.thumbAlt')}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/Commerce/Orders/OrderThumbs.test.tsx
```
Expected: PASS (6 tests).

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E 'OrderThumbs'; echo "tsc grep done"
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add apps/dashboard/src/components/Commerce/Orders/OrderThumbs.tsx apps/dashboard/src/components/Commerce/Orders/OrderThumbs.test.tsx
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "feat(orders): product + receipt thumbnails with an in-place lightbox

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 6: Front — `OrdersTable` (desktop)

**Files:**
- Create: `apps/dashboard/src/components/Commerce/Orders/OrdersTable.tsx`
- Test: `apps/dashboard/src/components/Commerce/Orders/OrdersTable.test.tsx`

**Interfaces:**
- Consumes: `orderRowFields`, `OrderThumbs`, existing `OrderStatusBadge`, `formatNumber`, `toJalaliDate`/`toJalaliDateTime`.
- Produces: `<OrdersTable orders={OrderListView[]} onOpen={(orderId: string) => void} />`.

- [ ] **Step 1: Write the failing test**

Create `OrdersTable.test.tsx` with the same `base` fixture as Task 5 (copy it in), plus:

```tsx
const renderTable = (orders: OrderListView[], onOpen = vi.fn()) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrdersTable orders={orders} onOpen={onOpen} />
    </NextIntlClientProvider>,
  );
  return onOpen;
};

describe('OrdersTable', () => {
  it('renders all six column headers', () => {
    renderTable([base]);
    // Named explicitly rather than sliced off `copy.table`, so reordering the JSON keys
    // cannot silently change what this asserts.
    for (const header of [
      copy.table.product,
      copy.table.recipient,
      copy.table.placedAt,
      copy.table.grandTotal,
      copy.table.payment,
      copy.table.status,
    ]) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
  });

  it('renders one row per order', () => {
    renderTable([base, { ...base, orderId: 'o2' }]);
    expect(screen.getAllByRole('button', { name: copy.table.openOrder })).toHaveLength(2);
  });

  it('opens the order when the row is clicked', () => {
    const onOpen = renderTable([base]);
    fireEvent.click(screen.getByRole('button', { name: copy.table.openOrder }));
    expect(onOpen).toHaveBeenCalledWith('o1');
  });

  it('opens the order on Enter, so the row is keyboard reachable', () => {
    const onOpen = renderTable([base]);
    fireEvent.keyDown(screen.getByRole('button', { name: copy.table.openOrder }), {
      key: 'Enter',
    });
    expect(onOpen).toHaveBeenCalledWith('o1');
  });

  it('shows the unpaid state for an order with no paidAt', () => {
    renderTable([base]);
    expect(screen.getByText(copy.payment.unpaid)).toBeInTheDocument();
  });

  it('shows the paid state once paidAt is stamped', () => {
    renderTable([{ ...base, paidAt: '2026-09-03T00:00:00Z' }]);
    expect(screen.getByText(copy.payment.paid)).toBeInTheDocument();
  });

  it('falls back to the raw payment method for an unrecognised value', () => {
    renderTable([{ ...base, paymentMethod: 'zarinpal' }]);
    expect(screen.getByText('zarinpal')).toBeInTheDocument();
  });

  it('shows a +N chip only when the order has more than one distinct line', () => {
    renderTable([base]);
    expect(screen.queryByText(copy.card.more.replace('{count}', '1'))).toBeNull();

    cleanup();
    renderTable([{ ...base, lines: [base.lines[0], { ...base.lines[0], variantId: 'v2' }] }]);
    expect(screen.getByText(copy.card.more.replace('{count}', '1'))).toBeInTheDocument();
  });

  it('shows the placeholder name when the order has no recipient', () => {
    renderTable([{ ...base, recipientName: null }]);
    expect(screen.getByText(copy.card.noName)).toBeInTheDocument();
  });
});
```

Import `cleanup` from `@testing-library/react`.

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/Commerce/Orders/OrdersTable.test.tsx
```
Expected: FAIL — cannot resolve `./OrdersTable`.

- [ ] **Step 3: Write the implementation**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from '@/utils/formatNumber';
import { toJalaliDate, toJalaliDateTime } from '@/utils/jalali';
import type { OrderListView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderThumbs } from './OrderThumbs';
import { orderRowFields } from './orderRowFields';

interface OrdersTableProps {
  orders: OrderListView[];
  onOpen: (orderId: string) => void;
}

/**
 * The seller's work queue, `md` and up. An order is a row of facts compared ACROSS orders --
 * who, when, how much, paid or not -- and a grid put every fact in a different place on screen.
 *
 * `OrderRowCard` renders the same order below `md`. Both derive every value from
 * `orderRowFields`, which is what stops the two from drifting.
 */
const OrdersTableComponent = ({ orders, onOpen }: OrdersTableProps) => {
  const t = useTranslations('Commerce.Orders');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.product')}</TableHead>
          <TableHead>{t('table.recipient')}</TableHead>
          <TableHead>{t('table.placedAt')}</TableHead>
          <TableHead>{t('table.grandTotal')}</TableHead>
          <TableHead>{t('table.payment')}</TableHead>
          <TableHead>{t('table.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const { firstLine, extraLines, itemCount, isPaid, paymentMethodKey } =
            orderRowFields(order);

          return (
            <TableRow
              key={order.orderId}
              /**
               * `role="button"` + `tabIndex` + a key handler, not a `<button>` wrapper: a
               * `<tr>` cannot contain one and still be a table row. The grid card this replaces
               * was keyboard reachable and that must not regress.
               */
              role="button"
              tabIndex={0}
              aria-label={t('table.openOrder')}
              onClick={() => onOpen(order.orderId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpen(order.orderId);
                }
              }}
              className="hover:bg-muted/50 cursor-pointer"
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <OrderThumbs order={order} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-secondary line-clamp-1 text-sm font-medium">
                      {firstLine?.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t('card.itemCount', { count: itemCount })}
                      {extraLines > 0 && ` · ${t('card.more', { count: extraLines })}`}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{order.recipientName ?? t('card.noName')}</span>
                  {order.mobile && (
                    <span className="text-muted-foreground text-xs">{order.mobile}</span>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                {toJalaliDate(order.placedAt)}
              </TableCell>

              <TableCell className="whitespace-nowrap">
                <span className="text-sm font-semibold">{formatNumber(order.grandTotal)}</span>{' '}
                <span className="text-muted-foreground text-xs">{t('card.tooman')}</span>
              </TableCell>

              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs">
                    {paymentMethodKey ? t(`paymentMethod.${paymentMethodKey}`) : order.paymentMethod}
                  </span>
                  <span
                    className={
                      isPaid
                        ? 'text-xs text-green-700 dark:text-green-400'
                        : 'text-muted-foreground text-xs'
                    }
                  >
                    {isPaid ? t('payment.paid') : t('payment.unpaid')}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export const OrdersTable = memo(OrdersTableComponent);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/Commerce/Orders/OrdersTable.test.tsx
```
Expected: PASS (9 tests).

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E 'OrdersTable'; echo "tsc grep done"
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add apps/dashboard/src/components/Commerce/Orders/OrdersTable.tsx apps/dashboard/src/components/Commerce/Orders/OrdersTable.test.tsx
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "feat(orders): six-column orders table for md and up

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 7: Front — `OrderRowCard` (phone)

**Files:**
- Create: `apps/dashboard/src/components/Commerce/Orders/OrderRowCard.tsx`
- Test: `apps/dashboard/src/components/Commerce/Orders/OrderRowCard.test.tsx`

**Interfaces:**
- Consumes: same as Task 6.
- Produces: `<OrderRowCard order={OrderListView} onOpen={(orderId: string) => void} />`.

- [ ] **Step 1: Write the failing test**

Create `OrderRowCard.test.tsx` with the same `base` fixture, plus:

```tsx
const renderRow = (order: OrderListView, onOpen = vi.fn()) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderRowCard order={order} onOpen={onOpen} />
    </NextIntlClientProvider>,
  );
  return onOpen;
};

describe('OrderRowCard', () => {
  it('shows every fact the table shows, so the phone loses nothing', () => {
    renderRow({ ...base, paidAt: null });
    expect(screen.getByText('شال')).toBeInTheDocument();
    expect(screen.getByText('علی')).toBeInTheDocument();
    expect(screen.getByText('09120000000')).toBeInTheDocument();
    expect(screen.getByText(copy.payment.unpaid)).toBeInTheDocument();
    expect(screen.getByText(copy.status.awaiting_review)).toBeInTheDocument();
  });

  it('opens the order when tapped', () => {
    const onOpen = renderRow(base);
    fireEvent.click(screen.getByRole('button', { name: copy.table.openOrder }));
    expect(onOpen).toHaveBeenCalledWith('o1');
  });

  it('shows the placeholder name when the order has no recipient', () => {
    renderRow({ ...base, recipientName: null });
    expect(screen.getByText(copy.card.noName)).toBeInTheDocument();
  });

  it('falls back to the raw payment method for an unrecognised value', () => {
    renderRow({ ...base, paymentMethod: 'zarinpal' });
    expect(screen.getByText('zarinpal')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/Commerce/Orders/OrderRowCard.test.tsx
```
Expected: FAIL — cannot resolve `./OrderRowCard`.

- [ ] **Step 3: Write the implementation**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';

import { Card, CardContent } from '@/components/ui';
import { formatNumber } from '@/utils/formatNumber';
import { toJalaliDate } from '@/utils/jalali';
import type { OrderListView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderThumbs } from './OrderThumbs';
import { orderRowFields } from './orderRowFields';

interface OrderRowCardProps {
  order: OrderListView;
  onOpen: (orderId: string) => void;
}

/**
 * The same order as `OrdersTable`, below `md`.
 *
 * A six-column table does not fit a phone, and the two usual escapes both cost the seller
 * something: horizontal scroll hides the status they are looking for behind a sideways drag, and
 * dropping columns loses the paid/unpaid signal and the date the list is sorted by. This keeps
 * every fact and rearranges it instead.
 *
 * `role="button"` on a div rather than a real `<button>` wrapper: `OrderThumbs` renders its own
 * button for the receipt, and a `<button>` inside a `<button>` is invalid HTML -- the parser
 * auto-closes the outer one, so the markup a browser builds is not the markup written. Same
 * pattern `OrdersTable` uses for its `<tr>`, and it keeps the row keyboard reachable.
 */
const OrderRowCardComponent = ({ order, onOpen }: OrderRowCardProps) => {
  const t = useTranslations('Commerce.Orders');
  const { firstLine, extraLines, isPaid, paymentMethodKey } = orderRowFields(order);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('table.openOrder')}
      onClick={() => onOpen(order.orderId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(order.orderId);
        }
      }}
      className="w-full cursor-pointer text-right"
    >
      <Card className="gap-0 p-0 transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-3 p-3">
          <OrderThumbs order={order} />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <span className="text-secondary line-clamp-1 text-sm font-semibold">
                {firstLine?.title}
                {extraLines > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {' '}
                    {t('card.more', { count: extraLines })}
                  </span>
                )}
              </span>
              <OrderStatusBadge status={order.status} className="shrink-0" />
            </div>

            <span className="text-secondary text-[13px]">
              {order.recipientName ?? t('card.noName')}
            </span>
            {order.mobile && (
              <span className="text-muted-foreground text-xs">{order.mobile}</span>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">{toJalaliDate(order.placedAt)}</span>
              <span className="text-primary text-sm font-semibold">
                {formatNumber(order.grandTotal)}{' '}
                <span className="text-xs font-medium">{t('card.tooman')}</span>
              </span>
            </div>

            <span className="text-muted-foreground text-xs">
              {paymentMethodKey ? t(`paymentMethod.${paymentMethodKey}`) : order.paymentMethod}
              {' · '}
              <span className={isPaid ? 'text-green-700 dark:text-green-400' : undefined}>
                {isPaid ? t('payment.paid') : t('payment.unpaid')}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const OrderRowCard = memo(OrderRowCardComponent);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/Commerce/Orders/OrderRowCard.test.tsx
```
Expected: PASS (4 tests).

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E 'OrderRowCard'; echo "tsc grep done"
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add apps/dashboard/src/components/Commerce/Orders/OrderRowCard.tsx apps/dashboard/src/components/Commerce/Orders/OrderRowCard.test.tsx
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "feat(orders): compact row-card for the orders list below md

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 8: Front — wire the list, delete `OrderCard`

**Files:**
- Modify: `apps/dashboard/src/components/Commerce/Orders/OrdersListPage.tsx:262-275` (the grid branch)
- Delete: `apps/dashboard/src/components/Commerce/Orders/OrderCard.tsx`
- Delete: `apps/dashboard/src/components/Commerce/Orders/OrderCard.test.tsx`
- Test: `apps/dashboard/src/components/Commerce/Orders/OrdersListPage.test.tsx`

**Interfaces:**
- Consumes: `OrdersTable` (Task 6), `OrderRowCard` (Task 7).

- [ ] **Step 1: Write the failing test**

Add to `OrdersListPage.test.tsx` (keep every existing test — the filter bar, the states and the clear-all behaviour must all still pass):

```tsx
it('renders the table and the row-card list, one per breakpoint', async () => {
  // seed the SWR mock with one order, the same way the existing tests in this file do
  renderPage();
  expect(await screen.findByRole('table')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: copy.table.openOrder }).length).toBeGreaterThan(0);
});

it('renders both breakpoint renderings, so neither is dropped', async () => {
  renderPage();
  await screen.findByRole('table');
  // NOT `querySelector('.grid')` -- the filter bar's date-picker cell is a `.grid` this task
  // does not touch, so that probe fails on a correct implementation. The grid CARD's removal is
  // enforced by deleting OrderCard.tsx and by tsc, not by a CSS-class check.
  expect(screen.getAllByRole('button', { name: copy.table.openOrder }).length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/Commerce/Orders/OrdersListPage.test.tsx
```
Expected: FAIL — no `table` role in the document.

- [ ] **Step 3: Replace the grid branch**

In `OrdersListPage.tsx`, swap the final branch of `listRegion` (currently the `<div className="grid …">` mapping `OrderCard`) for:

```tsx
) : (
  /**
   * Both renderings are always in the DOM and CSS picks one. A `useMediaQuery` hook would paint
   * the wrong layout on the first render and visibly flash. At the default `limit` of 20 this is
   * 40 light rows; the seller-set maximum is 200.
   */
  <>
    <div className="hidden md:block">
      <OrdersTable orders={orders} onOpen={(orderId) => router.push(`/products/orders/${orderId}`)} />
    </div>
    <div className="flex flex-col gap-2 md:hidden">
      {orders.map((order) => (
        <OrderRowCard
          key={order.orderId}
          order={order}
          onOpen={(orderId) => router.push(`/products/orders/${orderId}`)}
        />
      ))}
    </div>
  </>
);
```

Replace the `OrderCard` import with `OrdersTable` and `OrderRowCard`. Change nothing else in the file — the three-band layout, `md:min-h-0` chain, filters, chips, pager and the error→loading→empty branch order all stay.

- [ ] **Step 4: Delete the grid card and run the whole Commerce suite**

```bash
rm src/components/Commerce/Orders/OrderCard.tsx src/components/Commerce/Orders/OrderCard.test.tsx
npx vitest run src/components/Commerce/
```
Expected: PASS. Total will differ from the 397 baseline — `OrderCard.test.tsx`'s 7 tests are gone and Tasks 4–7 added ~25.

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E 'OrdersListPage|OrderCard'; echo "tsc grep done"
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add -A apps/dashboard/src/components/Commerce/Orders/
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "refactor(orders): the list is a table on desktop and row-cards on phone

Replaces the card grid. A grid is right for browsing a catalogue and wrong for
a work queue -- an order is a row of facts compared across orders.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 9: Front — `targetStatusesFor` + `actionForTransition`

**Files:**
- Modify: `apps/dashboard/src/components/Commerce/Orders/orderTransitions.ts`
- Test: `apps/dashboard/src/components/Commerce/Orders/orderTransitions.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function targetStatusesFor(order: OrderView): readonly CommerceOrderStatus[];
  export function actionForTransition(
    from: CommerceOrderStatus,
    to: CommerceOrderStatus,
  ): OrderActionName | null;
  ```

- [ ] **Step 1: Write the failing test**

Append to `orderTransitions.test.ts`:

```ts
describe('targetStatusesFor', () => {
  const order = (over: Partial<OrderView>): OrderView => ({ ...baseOrder, ...over });

  it('offers approve and reject targets from awaiting_review', () => {
    expect(targetStatusesFor(order({ status: 'awaiting_review' }))).toEqual([
      'processing',
      'cancelled',
    ]);
  });

  it('offers ship, complete and cancel targets from processing', () => {
    expect(targetStatusesFor(order({ status: 'processing' }))).toEqual([
      'sending',
      'completed',
      'cancelled',
    ]);
  });

  it('never offers sending for a digital order, which can never be shipped', () => {
    expect(targetStatusesFor(order({ status: 'processing', kind: 'digital' }))).toEqual([
      'completed',
      'cancelled',
    ]);
  });

  it('offers nothing on a terminal order', () => {
    expect(targetStatusesFor(order({ status: 'completed' }))).toEqual([]);
    expect(targetStatusesFor(order({ status: 'cancelled' }))).toEqual([]);
  });
});

describe('actionForTransition', () => {
  it('maps cancelled to reject from awaiting_review, but cancel from processing', () => {
    expect(actionForTransition('awaiting_review', 'cancelled')).toBe('reject');
    expect(actionForTransition('processing', 'cancelled')).toBe('cancel');
    expect(actionForTransition('sending', 'cancelled')).toBe('cancel');
  });

  it('maps the forward transitions', () => {
    expect(actionForTransition('awaiting_review', 'processing')).toBe('approve');
    expect(actionForTransition('processing', 'sending')).toBe('ship');
    expect(actionForTransition('processing', 'completed')).toBe('complete');
    expect(actionForTransition('sending', 'completed')).toBe('complete');
  });

  it('returns null for a transition the state machine does not have', () => {
    expect(actionForTransition('awaiting_review', 'completed')).toBeNull();
    expect(actionForTransition('completed', 'processing')).toBeNull();
    expect(actionForTransition('processing', 'processing')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/Commerce/Orders/orderTransitions.test.ts
```
Expected: FAIL — `targetStatusesFor is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `orderTransitions.ts`:

```ts
/**
 * The target status each action lands on. The INVERSE of what the seller picks: they choose a
 * destination, and `actionForTransition` turns the (from, to) pair back into the action.
 *
 * This is the one place the asymmetry lives: `cancelled` is reachable by TWO different actions
 * depending on where the order is now -- `reject` from `awaiting_review` (no money has been
 * accepted; the buyer is told why, in up to 500 characters) and `cancel` from `processing`/
 * `sending` (the courier came back with the goods, so stock is restored). A select that offered
 * one «لغو شده» without resolving which of the two it means would fire the wrong endpoint.
 */
const TARGET_BY_ACTION: Record<OrderActionName, CommerceOrderStatus> = {
  approve: 'processing',
  reject: 'cancelled',
  ship: 'sending',
  complete: 'completed',
  cancel: 'cancelled',
};

/**
 * The statuses this order may legally move to, in the order the select should list them.
 *
 * Derived from `actionsFor`, NOT from `ACTIONS_BY_STATUS` directly, so the digital-order `ship`
 * filter (and the unbreakable retry loop its docstring describes) keeps working with no second
 * rule to maintain.
 */
export function targetStatusesFor(order: OrderView): readonly CommerceOrderStatus[] {
  return actionsFor(order).map((action) => TARGET_BY_ACTION[action]);
}

/**
 * `null` for any pair the state machine does not have -- including `from === to`, which is what
 * the update button is disabled on.
 */
export function actionForTransition(
  from: CommerceOrderStatus,
  to: CommerceOrderStatus,
): OrderActionName | null {
  if (from === to) return null;
  const action = (ACTIONS_BY_STATUS[from] ?? []).find(
    (candidate) => TARGET_BY_ACTION[candidate] === to,
  );
  return action ?? null;
}
```

> `actionForTransition` reads `ACTIONS_BY_STATUS` (the faithful Back mirror), **not** `actionsFor`: the digital `ship` rule belongs to what is *offered*, and a select can only submit what it offered. Keeping the resolver on the raw table means it stays a pure inverse of the mirror.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/Commerce/Orders/orderTransitions.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add apps/dashboard/src/components/Commerce/Orders/orderTransitions.ts apps/dashboard/src/components/Commerce/Orders/orderTransitions.test.ts
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "feat(orders): resolve a (from, to) status pair back into its action

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 10: Front — `OrderStatusUpdater`

**Files:**
- Create: `apps/dashboard/src/components/Commerce/Orders/OrderStatusUpdater.tsx`
- Test: `apps/dashboard/src/components/Commerce/Orders/OrderStatusUpdater.test.tsx`

**Interfaces:**
- Consumes: `targetStatusesFor`, `actionForTransition`, `canMarkPaid`, the three existing dialogs.
- Produces:
  ```tsx
  <OrderStatusUpdater
    order={OrderView}
    onAction={(name: OrderActionName | 'markPaid', reason?: string) => Promise<boolean>}
    disabled?={boolean}
  />
  ```
  `onAction`'s contract is **identical** to the deleted `OrderActions` — `OrderDetailPage` needs no change.

- [ ] **Step 1: Write the failing test**

Create `OrderStatusUpdater.test.tsx`. Mock permissions the same way `OrderActions.test.tsx` did (copy that file's `usePermissions` mock verbatim before deleting it in Task 13):

```tsx
const renderUpdater = (order: OrderView, onAction = vi.fn().mockResolvedValue(true)) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderStatusUpdater order={order} onAction={onAction} />
    </NextIntlClientProvider>,
  );
  return onAction;
};

describe('OrderStatusUpdater', () => {
  it('disables the update button until a different status is chosen', () => {
    renderUpdater(awaitingOrder);
    expect(screen.getByRole('button', { name: copy.statusUpdate.submit })).toBeDisabled();
  });

  it('confirms before approving — approve must not fire on one click', async () => {
    const onAction = renderUpdater(awaitingOrder);
    await selectStatus(copy.status.processing);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));

    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText(copy.dialogs.approve.description)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.approve.confirm }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith('approve'));
  });

  it('asks for a reason when cancelling from awaiting_review (reject)', async () => {
    renderUpdater(awaitingOrder);
    await selectStatus(copy.status.cancelled);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));
    expect(screen.getByText(copy.dialogs.reject.buyerSees)).toBeInTheDocument();
  });

  it('warns about restocking when cancelling from processing (cancel)', async () => {
    renderUpdater(processingOrder);
    await selectStatus(copy.status.cancelled);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));
    expect(screen.getByText(copy.dialogs.cancel.description)).toBeInTheDocument();
  });

  it('keeps the chosen status when the write fails', async () => {
    const onAction = vi.fn().mockResolvedValue(false);
    renderUpdater(awaitingOrder, onAction);
    await selectStatus(copy.status.processing);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.approve.confirm }));

    await waitFor(() => expect(onAction).toHaveBeenCalled());
    expect(screen.getByRole('combobox')).toHaveTextContent(copy.status.processing);
  });

  it('never offers sending for a digital order', async () => {
    renderUpdater({ ...processingOrder, kind: 'digital' });
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('option', { name: copy.status.sending })).toBeNull();
  });

  it('disables the select and explains why on a terminal order', () => {
    renderUpdater({ ...awaitingOrder, status: 'completed' });
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByText(copy.statusUpdate.terminal)).toBeInTheDocument();
  });

  it('confirms before marking paid, because there is no un-mark endpoint', async () => {
    const onAction = renderUpdater(awaitingOrder);
    fireEvent.click(screen.getByRole('button', { name: copy.actions.markPaid }));
    expect(onAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.markPaid.confirm }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith('markPaid'));
  });

  it('offers markPaid on a completed COD order — the case it exists for', () => {
    renderUpdater({ ...awaitingOrder, status: 'completed', paidAt: null });
    expect(screen.getByRole('button', { name: copy.actions.markPaid })).toBeInTheDocument();
  });

  it('hides markPaid once paidAt is stamped', () => {
    renderUpdater({ ...awaitingOrder, paidAt: '2026-09-03T00:00:00Z' });
    expect(screen.queryByRole('button', { name: copy.actions.markPaid })).toBeNull();
  });
});
```

Write a `selectStatus` helper that opens the Radix `combobox` and clicks the named `option`.

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/Commerce/Orders/OrderStatusUpdater.test.tsx
```
Expected: FAIL — cannot resolve `./OrderStatusUpdater`.

- [ ] **Step 3: Write the implementation**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import type { CommerceOrderStatus, OrderView } from '@/types/commerceOrders';

import { CancelOrderDialog } from './dialogs/CancelOrderDialog';
import { ConfirmActionDialog } from './dialogs/ConfirmActionDialog';
import { RejectPaymentDialog } from './dialogs/RejectPaymentDialog';
import {
  actionForTransition,
  canMarkPaid,
  targetStatusesFor,
  type OrderActionName,
} from './orderTransitions';

interface OrderStatusUpdaterProps {
  order: OrderView;
  /** Identical contract to the `OrderActions` this replaces: resolves `true` when the write
   *  landed, `false` when it failed and the page has already toasted. */
  onAction: (name: OrderActionName | 'markPaid', reason?: string) => Promise<boolean>;
  disabled?: boolean;
}

/**
 * One status select and one «بروزرسانی» button, in place of six sibling action buttons.
 *
 * The select offers only LEGAL targets, so a transition the API would refuse can never be
 * submitted. The confirmation dialog is chosen by `actionForTransition`, which is what makes
 * «لغو شده» ask for a buyer-facing reason from `awaiting_review` (reject) but warn about
 * restocking from `processing`/`sending` (cancel).
 *
 * `markPaid` deliberately sits OUTSIDE the select: it is settlement, not status. Its only
 * backend guard is `paidAt IS NULL`, so gating it on status would hide it where it is legal --
 * above all on a COMPLETED cash-on-delivery order, which is the primary case it exists for.
 */
export function OrderStatusUpdater({ order, onAction, disabled }: OrderStatusUpdaterProps) {
  const t = useTranslations('Commerce.Orders');
  const { can } = usePermissions();

  const [draft, setDraft] = useState<CommerceOrderStatus>(order.status);
  const [pendingAction, setPendingAction] = useState<OrderActionName | null>(null);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // The order can move under the page -- the buyer's DM can promote it, another seat can approve
  // it -- and `OrderDetailPage` revalidates on `COMMERCE_ORDER_STATUS_CHANGED`. When it does, a
  // draft still pointing at the old target would submit a transition that no longer exists.
  useEffect(() => {
    setDraft(order.status);
  }, [order.status]);

  if (!can('order:manage')) return null;

  const targets = targetStatusesFor(order);
  const isTerminal = targets.length === 0;
  const isDisabled = disabled || busy;
  const pendingResolved = draft === order.status ? null : actionForTransition(order.status, draft);

  const runAction = async (name: OrderActionName | 'markPaid', reason?: string) => {
    setBusy(true);
    try {
      return await onAction(name, reason);
    } finally {
      setBusy(false);
    }
  };

  const closeDialog = () => setPendingAction(null);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground text-xs">{t('statusUpdate.label')}</Label>

      <Select
        value={draft}
        onValueChange={(value) => setDraft(value as CommerceOrderStatus)}
        disabled={isDisabled || isTerminal}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {/* The current status is listed so the trigger has something to show, but it is never
              a legal target -- the update button stays disabled while it is selected. */}
          <SelectItem value={order.status}>{t(`status.${order.status}`)}</SelectItem>
          {targets.map((status) => (
            <SelectItem key={status} value={status}>
              {t(`status.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isTerminal ? (
        <p className="text-muted-foreground text-xs">{t('statusUpdate.terminal')}</p>
      ) : (
        <p className="text-muted-foreground text-xs">{t('statusUpdate.hint')}</p>
      )}

      <Button
        type="button"
        disabled={isDisabled || pendingResolved === null}
        onClick={() => setPendingAction(pendingResolved)}
      >
        {t('statusUpdate.submit')}
      </Button>

      {canMarkPaid(order) && (
        <Button
          type="button"
          variant="outline"
          disabled={isDisabled}
          onClick={() => setMarkPaidOpen(true)}
        >
          {t('actions.markPaid')}
        </Button>
      )}

      <ConfirmActionDialog
        open={pendingAction === 'approve'}
        onOpenChange={(open) => setPendingAction(open ? 'approve' : null)}
        onConfirm={async () => {
          if (await runAction('approve')) closeDialog();
        }}
        title={t('dialogs.approve.title')}
        description={t('dialogs.approve.description')}
        confirmLabel={t('dialogs.approve.confirm')}
      />
      <ConfirmActionDialog
        open={pendingAction === 'ship'}
        onOpenChange={(open) => setPendingAction(open ? 'ship' : null)}
        onConfirm={async () => {
          if (await runAction('ship')) closeDialog();
        }}
        title={t('dialogs.ship.title')}
        description={t('dialogs.ship.description')}
        confirmLabel={t('dialogs.ship.confirm')}
      />
      <ConfirmActionDialog
        open={pendingAction === 'complete'}
        onOpenChange={(open) => setPendingAction(open ? 'complete' : null)}
        onConfirm={async () => {
          if (await runAction('complete')) closeDialog();
        }}
        title={t('dialogs.complete.title')}
        description={t('dialogs.complete.description')}
        confirmLabel={t('dialogs.complete.confirm')}
      />
      <RejectPaymentDialog
        open={pendingAction === 'reject'}
        onOpenChange={(open) => setPendingAction(open ? 'reject' : null)}
        onConfirm={async (reason) => {
          const ok = await runAction('reject', reason);
          if (ok) closeDialog();
          return ok;
        }}
      />
      <CancelOrderDialog
        open={pendingAction === 'cancel'}
        onOpenChange={(open) => setPendingAction(open ? 'cancel' : null)}
        onConfirm={async () => {
          if (await runAction('cancel')) closeDialog();
        }}
      />
      <ConfirmActionDialog
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        onConfirm={async () => {
          if (await runAction('markPaid')) setMarkPaidOpen(false);
        }}
        title={t('dialogs.markPaid.title')}
        description={t('dialogs.markPaid.description')}
        confirmLabel={t('dialogs.markPaid.confirm')}
      />
    </div>
  );
}
```

> **Do not** reset `draft` in the failure path. A failed write keeps the seller's choice, matching the rule the reject dialog already follows for its typed reason. The `useEffect` resets it only when the order's real status changes.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/Commerce/Orders/OrderStatusUpdater.test.tsx
```
Expected: PASS (10 tests).

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep -E 'OrderStatusUpdater'; echo "tsc grep done"
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add apps/dashboard/src/components/Commerce/Orders/OrderStatusUpdater.tsx apps/dashboard/src/components/Commerce/Orders/OrderStatusUpdater.test.tsx
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "feat(orders): status select with an adaptive confirmation dialog

approve now confirms instead of firing on one click, and markPaid gains a
confirm because there is no un-mark endpoint.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 11: Front — `OrderSummaryRail`

**Files:**
- Create: `apps/dashboard/src/components/Commerce/Orders/OrderSummaryRail.tsx`
- Test: `apps/dashboard/src/components/Commerce/Orders/OrderSummaryRail.test.tsx`

**Interfaces:**
- Consumes: `orderRowFields`, `OrderStatusBadge`, `ReceiptStrip`, `OrderStatusUpdater` (passed in as a node).
- Produces: `<OrderSummaryRail order={OrderDetailView} statusUpdater={ReactNode} />`.

> `statusUpdater` arrives as a node, not as props, for the same reason `OrderDetail` takes `actions` today: the rail stays pure and its test needs no permissions mock.

- [ ] **Step 1: Write the failing test**

```tsx
describe('OrderSummaryRail', () => {
  it('leads with the status, the total and the payment state', () => {
    render(wrap(<OrderSummaryRail order={detailOrder} statusUpdater={null} />));
    expect(screen.getByText(copy.status.awaiting_review)).toBeInTheDocument();
    // `formatNumber` uses `Intl.NumberFormat('en-US')` — ASCII digits and commas, NOT Persian
    // digits. The amount is deliberately the only ASCII-digit token on an otherwise Persian
    // surface; do not "fix" this assertion to ۱٬۰۰۰.
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText(copy.payment.unpaid)).toBeInTheDocument();
  });

  it('shows the paid time once settled', () => {
    render(wrap(<OrderSummaryRail order={{ ...detailOrder, paidAt: '2026-09-03T00:00:00Z' }} statusUpdater={null} />));
    expect(screen.getByText(copy.payment.paid)).toBeInTheDocument();
  });

  it('shows the receipts, newest first', () => {
    render(wrap(<OrderSummaryRail order={{ ...detailOrder, receipts: [
      { id: 'r1', url: 'https://cdn/1.jpg', createDate: '2026-09-01T00:00:00Z' },
      { id: 'r2', url: 'https://cdn/2.jpg', createDate: '2026-09-03T00:00:00Z' },
    ] }} statusUpdater={null} />));
    expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', 'https://cdn/2.jpg');
  });

  it('says so when no receipt has been sent', () => {
    render(wrap(<OrderSummaryRail order={detailOrder} statusUpdater={null} />));
    expect(screen.getByText(copy.receipts.none)).toBeInTheDocument();
  });

  it('renders the cancel reason on a cancelled order', () => {
    render(wrap(<OrderSummaryRail order={{ ...detailOrder, status: 'cancelled', cancelReason: 'payment_rejected' }} statusUpdater={null} />));
    expect(screen.getByText(copy.cancelReason.payment_rejected)).toBeInTheDocument();
  });

  it('renders whatever status control it is handed', () => {
    render(wrap(<OrderSummaryRail order={detailOrder} statusUpdater={<button>UPDATER</button>} />));
    expect(screen.getByRole('button', { name: 'UPDATER' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/Commerce/Orders/OrderSummaryRail.test.tsx
```
Expected: FAIL — cannot resolve `./OrderSummaryRail`.

- [ ] **Step 3: Write the implementation**

```tsx
'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui';
import { formatNumber } from '@/utils/formatNumber';
import { toJalaliDateTime } from '@/utils/jalali';
import type { OrderDetailView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';
import { ReceiptStrip } from './ReceiptStrip';
import { orderRowFields } from './orderRowFields';

interface OrderSummaryRailProps {
  order: OrderDetailView;
  /** The status control, injected so this component stays pure and its test needs no
   *  permissions mock -- same reason `OrderDetail` has always taken `actions` as a node. */
  statusUpdater: ReactNode;
}

/**
 * Everything needed to DECIDE, and nothing else.
 *
 * The flat page this replaces ordered its sections the way the data was written, which put the
 * action buttons at the very bottom: approving a payment meant scrolling past the address and
 * every line item first. Here the decision is one block -- what state, how much, paid or not,
 * the receipt to judge, and the control to act -- pinned on desktop and stacked FIRST on a
 * phone.
 */
export function OrderSummaryRail({ order, statusUpdater }: OrderSummaryRailProps) {
  const t = useTranslations('Commerce.Orders');
  const { isPaid, paymentMethodKey } = orderRowFields(order);

  return (
    <Card className="lg:sticky lg:top-4">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="text-lg font-semibold">
            {formatNumber(order.grandTotal)}{' '}
            <span className="text-muted-foreground text-xs font-medium">{t('card.tooman')}</span>
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">{t('detail.placedAt')}</span>
          <span className="text-sm">{toJalaliDateTime(order.placedAt)}</span>
        </div>

        {order.status === 'cancelled' && order.cancelReason && (
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">{t('detail.cancelledBecause')}</span>
            <span className="text-sm">{t(`cancelReason.${order.cancelReason}`)}</span>
          </div>
        )}

        <div className="flex flex-col gap-1 border-t pt-3">
          <span className="text-sm">
            {paymentMethodKey ? t(`paymentMethod.${paymentMethodKey}`) : order.paymentMethod}
          </span>
          <span
            className={
              isPaid ? 'text-xs text-green-700 dark:text-green-400' : 'text-muted-foreground text-xs'
            }
          >
            {isPaid ? t('payment.paid') : t('payment.unpaid')}
          </span>
          {order.paidAt && (
            <span className="text-muted-foreground text-xs">{toJalaliDateTime(order.paidAt)}</span>
          )}
          <ReceiptStrip receipts={order.receipts} />
        </div>

        {statusUpdater && <div className="border-t pt-3">{statusUpdater}</div>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/Commerce/Orders/OrderSummaryRail.test.tsx
```
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add apps/dashboard/src/components/Commerce/Orders/OrderSummaryRail.tsx apps/dashboard/src/components/Commerce/Orders/OrderSummaryRail.test.tsx
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "feat(orders): sticky decision rail for the order detail page

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 12: Front — the three detail cards

**Files:**
- Create: `apps/dashboard/src/components/Commerce/Orders/OrderBuyerCard.tsx`
- Create: `apps/dashboard/src/components/Commerce/Orders/OrderItemsCard.tsx`
- Create: `apps/dashboard/src/components/Commerce/Orders/OrderTotalsCard.tsx`
- Test: `apps/dashboard/src/components/Commerce/Orders/OrderBuyerCard.test.tsx`

**Interfaces:**
- Produces:
  ```tsx
  <OrderBuyerCard order={OrderView} cityName={string | null} />
  <OrderItemsCard order={OrderView} />
  <OrderTotalsCard order={OrderView} />
  ```

Move the existing `Field`, `shippingKindLabel` and `shippingSettlementLabel` logic out of `OrderDetail.tsx` into `OrderBuyerCard` **verbatim** — including their docstrings about why the lookups are guarded switches rather than `t(\`kinds.${value}\`)`.

- [ ] **Step 1: Write the failing test**

`OrderBuyerCard.test.tsx` — the pickup case is the new behaviour, the rest is a regression net for the moved code:

```tsx
describe('OrderBuyerCard', () => {
  it('shows the address block for a physical order', () => {
    render(wrap(<OrderBuyerCard order={physicalOrder} cityName="تهران" />));
    expect(screen.getByText('تهران')).toBeInTheDocument();
    expect(screen.getByText('خیابان ولیعصر')).toBeInTheDocument();
  });

  it('omits the address block for a digital order, which has none', () => {
    render(wrap(<OrderBuyerCard order={{ ...physicalOrder, kind: 'digital' }} cityName="تهران" />));
    expect(screen.queryByText('خیابان ولیعصر')).toBeNull();
  });

  it('falls back to the raw value for an unrecognised shipping kind', () => {
    render(wrap(<OrderBuyerCard order={{ ...physicalOrder, shippingKind: 'drone' }} cityName={null} />));
    expect(screen.getByText('drone')).toBeInTheDocument();
  });

  it('does not present the buyer address as a delivery address on a pickup order', () => {
    render(wrap(<OrderBuyerCard order={{ ...physicalOrder, shippingKind: 'pickup' }} cityName="تهران" />));
    expect(screen.getByText(copy.pickup.notice)).toBeInTheDocument();
    expect(screen.getByText(copy.pickup.addressUnknown)).toBeInTheDocument();
    expect(screen.queryByText('خیابان ولیعصر')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/Commerce/Orders/OrderBuyerCard.test.tsx
```
Expected: FAIL — cannot resolve `./OrderBuyerCard`.

- [ ] **Step 3: Write the three cards**

Each is `<Card><CardContent className="flex flex-col gap-3 p-4">` wrapping an `<h3 className="text-sm font-semibold">` and the body **cut and pasted** from the matching section of today's `OrderDetail.tsx`. This is a move, not a rewrite — take the existing JSX unchanged, including comments:

| New card | Source (before Task 13 rewrites the file) |
|---|---|
| `OrderBuyerCard` | `OrderDetail.tsx:143-169` (the `detail.buyer` block) + the `Field` component (`:24-31`) + `shippingKindLabel` (`:73-92`) + `shippingSettlementLabel` (`:94-108`) |
| `OrderItemsCard` | `OrderDetail.tsx:172-208` (the `detail.items` block) |
| `OrderTotalsCard` | `OrderDetail.tsx:212-225` (the totals block) |

`Field`, `shippingKindLabel` and `shippingSettlementLabel` move into `OrderBuyerCard` **with their docstrings intact** — those comments explain why the lookups are guarded `switch`es rather than `t(\`kinds.${value}\`)` (an unrecognised value must fall back to the raw string, not print a missing key path), and that reasoning is not obvious from the code.

`OrderBuyerCard` adds the pickup branch. Recipient and mobile always render; then:

```tsx
{isPickup ? (
  /**
   * `pickupAddress` lives ONLY on `commerce_shipping_option` -- the live, mutable merchant
   * config. `commerce_order` freezes `shippingTitle`/`shippingKind`/`shippingSettlement` at
   * promotion but stores NO `shippingOptionId`, so there is no path from an order back to its
   * collection address, not even a live lookup.
   *
   * Rendering the buyer's home address here anyway was actively misleading: for a pickup order
   * it is not a delivery destination, and it sat under a «روش ارسال» heading as though it were
   * one. Saying the collection point is not recorded is worse UX than showing it and better UX
   * than lying. Freezing the address onto the order is tracked as a separate task.
   */
  <>
    <p className="text-sm">{t('pickup.notice')}</p>
    <p className="text-muted-foreground text-sm">{t('pickup.addressUnknown')}</p>
  </>
) : (
  !isDigital && (
    <div className="grid grid-cols-2 gap-3">
      {/* `OrderDetail.tsx:150-168` moved unchanged: city, address, plate, unit,
          postalcode, shippingTitle, shippingKindLabel, shippingSettlementLabel */}
    </div>
  )
)}
```

`isPickup` comes from `orderRowFields`; `isDigital` is `order.kind === 'digital'`.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/Commerce/Orders/OrderBuyerCard.test.tsx
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add apps/dashboard/src/components/Commerce/Orders/OrderBuyerCard.tsx apps/dashboard/src/components/Commerce/Orders/OrderItemsCard.tsx apps/dashboard/src/components/Commerce/Orders/OrderTotalsCard.tsx apps/dashboard/src/components/Commerce/Orders/OrderBuyerCard.test.tsx
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "feat(orders): buyer, items and totals as real cards

A pickup order no longer presents the buyer's home address as a delivery
destination -- the collection point is not recorded on the order at all.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 13: Front — recompose `OrderDetail`, delete `OrderActions`

**Files:**
- Modify: `apps/dashboard/src/components/Commerce/Orders/OrderDetail.tsx` (full rewrite, ~60 lines)
- Modify: `apps/dashboard/src/components/Commerce/Orders/OrderDetailPage.tsx:88-98`
- Delete: `apps/dashboard/src/components/Commerce/Orders/OrderActions.tsx`
- Delete: `apps/dashboard/src/components/Commerce/Orders/OrderActions.test.tsx`
- Test: `apps/dashboard/src/components/Commerce/Orders/OrderDetail.test.tsx`, `OrderDetailPage.test.tsx`

- [ ] **Step 1: Update the tests**

In `OrderDetail.test.tsx`, keep every assertion about content (fields, lines, totals, cancel reason) — they must still pass against the new composition. Replace the `order-actions-bar` assertions with:

```tsx
it('puts the decision rail before the detail columns in the DOM, so it is first on a phone', () => {
  render(wrap(<OrderDetail order={detailOrder} cityName="تهران" statusUpdater={<button>UPDATER</button>} />));
  const rail = screen.getByRole('button', { name: 'UPDATER' });
  const items = screen.getByText(copy.detail.items);
  expect(rail.compareDocumentPosition(items) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('renders no status control when handed none', () => {
  render(wrap(<OrderDetail order={detailOrder} cityName="تهران" statusUpdater={null} />));
  expect(screen.queryByRole('button', { name: 'UPDATER' })).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/Commerce/Orders/OrderDetail.test.tsx
```
Expected: FAIL — `OrderDetail` has no `statusUpdater` prop.

- [ ] **Step 3: Rewrite `OrderDetail`**

```tsx
'use client';

import type { ReactNode } from 'react';

import type { OrderDetailView } from '@/types/commerceOrders';

import { OrderBuyerCard } from './OrderBuyerCard';
import { OrderItemsCard } from './OrderItemsCard';
import { OrderSummaryRail } from './OrderSummaryRail';
import { OrderTotalsCard } from './OrderTotalsCard';

interface OrderDetailProps {
  order: OrderDetailView;
  cityName: string | null;
  /** The status control. `null` for a viewer without `order:manage`. */
  statusUpdater: ReactNode;
}

/**
 * Layout only -- every card below owns its own content.
 *
 * `lg:grid-cols-[1fr_320px]` with the rail declared FIRST in the DOM and pushed to the second
 * column by `lg:order-2`. Source order is what a phone and a screen reader follow, and the whole
 * point of this screen is that the decision comes first; visual order is what a desktop follows,
 * and there the rail belongs beside the detail, not above it.
 */
export function OrderDetail({ order, cityName, statusUpdater }: OrderDetailProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="lg:order-2">
        <OrderSummaryRail order={order} statusUpdater={statusUpdater} />
      </div>

      <div className="flex flex-col gap-4 lg:order-1">
        <OrderBuyerCard order={order} cityName={cityName} />
        <OrderItemsCard order={order} />
        <OrderTotalsCard order={order} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewire `OrderDetailPage`**

Replace the `OrderActions` import with `OrderStatusUpdater`, and the returned JSX's `actions` prop with:

```tsx
statusUpdater={
  can('order:manage') && hasAnyAction(order) ? (
    <OrderStatusUpdater order={order} onAction={onAction} disabled={isLoading} />
  ) : null
}
```

`onAction`, the error handling and the `COMMERCE_ORDER_STATUS_CHANGED` revalidation are unchanged.

- [ ] **Step 5: Delete `OrderActions` and run the full suite**

```bash
rm src/components/Commerce/Orders/OrderActions.tsx src/components/Commerce/Orders/OrderActions.test.tsx
npx vitest run src/components/Commerce/
npx tsc --noEmit 2>&1 | grep -E 'Orders/'; echo "tsc grep done"
```
Expected: all PASS; no tsc lines for anything under `Orders/`.

- [ ] **Step 6: Commit**

```bash
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add -A apps/dashboard/src/components/Commerce/Orders/
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "refactor(orders): detail page is a decision rail beside a detail column

Replaces one flat column of border-t sections that buried the action buttons
below the address and every line item. OrderActions is gone; its six buttons
are now the status select plus a separate markPaid.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

---

## Task 14: Documentation and final verification

**Files:**
- Create: `Front/…/knowledge/updates/2026-09-04-ordersScreenRedesign.update.md`
- Create: `Back/…/knowledge/updates/2026-09-04-orderListViewReceipts.update.md`
- Modify: both repos' `knowledge/knowledgeMap.doc.md`
- Modify: `Front/…/knowledge/front-back-relations.md`
- Modify: `WORKTREES.md` (outer repo root)

- [ ] **Step 1: Write the Front update doc**

`2026-09-04-ordersScreenRedesign.update.md`, with the sections CLAUDE.md §4 requires — title with date, pointer to the spec and to `2026-09-04-ordersPageRefactor.update.md` (which this supersedes), then `Problem` / `Solution` / `Changes` / `Verification`. State plainly that the grid it replaced was one day old, and record the pickup-address gap as a known limitation with its fix (freeze `shippingPickupAddress` onto `commerce_order`) named.

- [ ] **Step 2: Write the Back update doc**

`2026-09-04-orderListViewReceipts.update.md` — same four sections. The load-bearing part is **why `hydrateForSeller` may join `receipts` when `LIST_RELATIONS`' docstring forbids it**: the ban applies to the paginating query, and this one is `WHERE id IN (...)` with no `skip`/`take`. Also record that `readManyForCustomer` deliberately keeps plain `hydrate` so no receipt url reaches a buyer.

- [ ] **Step 3: Update both knowledge maps and front-back-relations**

Add a row per new doc to each repo's `knowledgeMap.doc.md`. In `front-back-relations.md`, record that `GET /commerce/orders` now returns `OrderListView` (`+receiptUrl`, `+receiptCount`) and that `apps/dashboard/src/components/Commerce/Orders/OrdersTable.tsx` consumes it — this is the API change a frontend depends on (CLAUDE.md §4).

- [ ] **Step 4: Update `WORKTREES.md`**

Flip both `commerce-product-core` rows to `completed` ✅, note the redesign in Notes, and re-sort each table newest-first by last commit date (CLAUDE.md §0.2).

- [ ] **Step 5: Full verification sweep**

```bash
# Back
cd /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core/apps/core
npx jest src/commerce/orders --runInBand
cd /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core
pnpm --filter core exec tsc --noEmit

# Front
cd /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core/apps/dashboard
npx vitest run src/components/Commerce/
npx tsc --noEmit 2>&1 | grep -cE 'error TS'   # must be <= 206
```
Record the real numbers in both update docs. **Do not write "passing" without pasted output.**

- [ ] **Step 6: Commit**

```bash
git -C /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core add -A knowledge/
git -C /home/cvexor/Documents/MVP/Back/worktrees/commerce-product-core commit -m "docs(commerce): record the OrderListView receipt change

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"

git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core add -A knowledge/
git -C /home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core commit -m "docs(orders): record the orders screen redesign

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"

git -C /home/cvexor/Documents/MVP add WORKTREES.md
git -C /home/cvexor/Documents/MVP commit -m "docs(worktrees): commerce-product-core orders redesign complete

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012WdWeHuzeeo97VCAYd9jEM"
```

- [ ] **Step 7: Hand back for the browser pass**

The previous refactor shipped explicitly **"Not yet verified in a browser."** Tell the user this needs a manual pass at three widths (phone, `md`, `lg`+) and list what to look at: the receipt lightbox opening from a list row without navigating, the table→row-card switch at `md`, the rail sticking on desktop and sitting first on a phone, and a «لغو شده» selection asking for a reason from `awaiting_review` but warning about restock from `processing`.

---

## Notes for the executor

- **`OrderStatusBadge`, `ReceiptStrip`, `ReceiptLightbox` and `dialogs/*` are not to be modified.** Four tasks consume them; none changes them.
- **The `dialogs/` components' props are fixed:** `ConfirmActionDialog` takes `{open, onOpenChange, onConfirm: () => Promise<void>, title, description, confirmLabel}`; `RejectPaymentDialog`'s `onConfirm` is `(reason: string) => Promise<boolean>`; `CancelOrderDialog`'s is `() => Promise<void>`. Task 10 matches all three.
- **Persian digits:** `formatNumber` already renders them. Do not add a second formatter.
- **If a task's test fails for a reason the plan did not predict, stop and report it** rather than editing the assertion to match the code — the assertions encode the spec.
