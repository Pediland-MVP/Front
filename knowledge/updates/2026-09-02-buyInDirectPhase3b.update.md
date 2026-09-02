# 2026-09-02 — Buy-in-Direct phase 3b: merchant orders screen

Spec: `docs/superpowers/specs/2026-09-02-buyInDirect-phase3b-design.md`
Plan: `docs/superpowers/plans/2026-09-02-buyInDirect-phase3b.md`
SDD ledger: `.superpowers/sdd/2026-09-02-buyInDirect-phase3b/progress.md` (10 tasks, full
review history, all rulings)

## Problem

Merchants taking commerce orders through the new Buy-in-Direct flow (Back phase 1) had no
dashboard screen to see, filter, and act on those orders — approve, reject, mark paid,
ship, complete, cancel — or to see payment receipts and export a CSV. The legacy `/orders`
screen only ever knew about the old `order` table, not the new `commerce_order` schema.

## Solution

Built a new orders screen from scratch at `/products/orders` (list) and
`/products/orders/[id]` (detail), reading and writing the `commerce_order` API, sitting
alongside — not replacing — the legacy screen. Ten sequential tasks: view/status
transition table, data hooks, card + badge, list page with filters, receipt strip +
lightbox, order detail body, three confirmation dialogs, the action bar, CSV export, and
this documentation pass.

## Changes

- `components/Commerce/Orders/` — `orderTransitions.ts` (`ACTIONS_BY_STATUS` +
  `actionsFor` + `canMarkPaid`), `OrderCard`, `OrderStatusBadge`, `OrdersListPage`,
  `ReceiptStrip`, `ReceiptLightbox`, `OrderDetail`, `OrderActions`, `OrderDetailPage`,
  `OrdersExportDrawer`, `dialogs/RejectPaymentDialog.tsx`,
  `dialogs/CancelOrderDialog.tsx`, `dialogs/ConfirmActionDialog.tsx`.
- `hooks/useCommerceOrders.ts`, `hooks/useCommerceOrder.ts` — list/detail SWR hooks plus
  the six write actions (approve, reject, markPaid, ship, complete, cancel).
- `app/(Console)/products/orders/page.tsx` and `.../[id]/page.tsx` — the two new routes.
- `components/Layout/ConsoleSidebar.tsx` — new sidebar entry alongside the legacy one.
- `messages/fa.json` (`Commerce.Orders.*`), `messages/fa/Console.json` (sidebar label),
  `messages/fa/ErrorCodes.json` (already covered the five relevant codes; untouched).
- Spec amendment (this task): `docs/superpowers/specs/2026-09-02-buyInDirect-phase3b-design.md`
  §5.1.1 — records the product-kind dimension in `actionsFor` that §5.1's table omitted.

### Non-obvious decisions worth remembering

- **Two screens, on purpose.** The legacy `/orders` screen and `components/Orders/` are
  untouched and still serve the old `order` table. The new screen only exists at
  `/products/orders*` and only reads `commerce_order`. They are not aware of each other.
  Retiring the legacy screen is a separate, later step — see the cutover row added to
  `before-prod-cutover.md` in this same task.
- **Breadcrumbs needed no code.** `orders` was already a known segment in
  `HeaderBreadcrumb.tsx`, and UUID detail segments already resolve to
  `Breadcrumbs.detail`. Nothing to add for either `/products/orders` or the `[id]` route.
- **`markPaid` is gated on `order.paidAt === null`, never on status.** Back's
  `FulfilmentService.markPaid` has no status guard at all — its only condition is
  `paidAt IS NULL` — and it is deliberately idempotent (a second call is a seller
  double-tapping, not a conflict). Gating the button on status would both hide it where
  it is legal and misrepresent what the backend actually enforces.
- **`actionsFor` drops `ship` for digital orders.** Back's `FulfilmentService.ship` throws
  `COMMERCE_ORDER_STATUS_CHANGED` ("A digital order is never shipped") for
  `kind === 'digital'`, before its conditional UPDATE — independent of status. A digital
  order reaches `processing` the normal way (via `approve` or `submitFree`), so without
  this filter the UI rendered a `ship` button that could never succeed: clicking it
  reported "status changed" (false), the page's own status-changed handler revalidated,
  found nothing changed, and redrew the same button — an unbreakable retry loop. Found
  during Task 8's review; `ACTIONS_BY_STATUS` stays a faithful status-only mirror of
  Back's `ORDER_TRANSITIONS`, and the kind rule is layered on top in `actionsFor`, not
  folded into the table. See the spec amendment above.
- **Reject reason is `.trim()`-ed before sending, deliberately stricter than the DTO.**
  `RejectPaymentDto` only requires length 1-500, which a whitespace-only string passes.
  The reason is DMd to the buyer verbatim, and this codebase already has a production
  incident of Meta rejecting whitespace-only DM text (error 100 / subcode 2534052,
  "Empty text" — see `project_consent_empty_text_bug` memory). A space-only reject reason
  would cancel the order (terminal, no rollback) while the buyer never learns why. Both
  the dialog's own validation and the send path now measure the trimmed string.
- **Three message files are in play, not one.** `fa.json` carries the screen copy under
  `Commerce.Orders`, `fa/Console.json` carries the sidebar label, and
  `fa/ErrorCodes.json` carries the error codes this flow can produce. `fa.json`'s own
  `ERROR_CODES` object is fully shadowed by the shallow spread in `i18n/request.ts` and
  is dead at runtime (see `feedback_error_code_translations_file` memory /
  `2026-08-26-errorCodeTranslationsComplete.update.md`) — a translation added there
  would silently never be read.
- **Two date-picker conventions now coexist in the dashboard, not by accident.** The
  three legacy export drawers (including the old `/orders` screen's own
  `excelExportOrders.drawer.tsx`) use `react-multi-date-picker`. This screen's filter bar
  uses `packages/ui`'s Jalali `DatePicker` instead — verified Jalali/RTL-correct
  (`dayjs .calendar('jalali')`, `react-day-picker/persian`, flipped chevrons) during
  Task 4's review. The different UI shape (inline filter bar vs. a modal form) justifies
  the split; recorded here so a future contributor does not read it as drift to clean up.

## Verification

Full history, all fix rounds, and every review verdict:
`.superpowers/sdd/2026-09-02-buyInDirect-phase3b/progress.md`.

Numbers below were measured directly for this task, from
`/home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core`:

```
$ cd apps/dashboard && npx vitest run src/components/Commerce/Orders/ src/hooks/useCommerceOrders.test.ts
 Test Files  11 passed (11)
      Tests  71 passed (71)
```

(Two pre-existing, expected stderr warnings during the run, neither a failure: a React
`act()` warning in `CancelOrderDialog.test.tsx`, and an intentional `MISSING_MESSAGE`
i18n error logged by `OrdersExportDrawer.test.tsx`'s own "surfaces a failed request"
case, which asserts on that exact fallback behaviour.)

```
$ pnpm --filter front exec tsc --noEmit 2>&1 | grep -c "error TS"
204
```

Matches the Task 1 baseline exactly — unchanged across all ten tasks of this phase.

```
$ python3 -c "import json;[json.load(open(f)) for f in ['apps/dashboard/src/messages/fa.json','apps/dashboard/src/messages/fa/Console.json','apps/dashboard/src/messages/fa/ErrorCodes.json']];print('valid')"
valid
```

## Outstanding

- `knowledge/knowledgeMap.doc.md` still needs a row for this doc. Skipped in this task
  (Ruling 9, `progress.md`): the file carries another live session's uncommitted edits,
  and staging it risked either committing their work or requiring index surgery to split
  the changes apart — a class of mistake that has already happened once in this project.
  Whoever owns that file's current edits should add the row when their work lands.
- Retiring the legacy `/orders` screen is tracked as a cutover item in
  `before-prod-cutover.md` (outer repo), gated on the
  `CommerceOrderCoreData1786960000000` migration having run in production.
