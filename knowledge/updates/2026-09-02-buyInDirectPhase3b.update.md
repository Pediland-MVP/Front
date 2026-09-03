# 2026-09-02 — Buy-in-Direct phase 3b: merchant orders screen

Spec: `docs/superpowers/specs/2026-09-02-buyInDirect-phase3b-design.md`
Plan: `docs/superpowers/plans/2026-09-02-buyInDirect-phase3b.md`
SDD ledger: `.superpowers/sdd/2026-09-02-buyInDirect-phase3b/progress.md` (10 tasks, full
review history, all rulings)

## Problem

Merchants taking commerce orders through the new Buy-in-Direct flow (Back phase 1) had no
dashboard screen to see, filter, and act on those orders — approve, reject, mark paid,
ship, complete, cancel — or to see payment receipts and export an emailed Excel file. The
legacy `/orders` screen only ever knew about the old `order` table, not the new
`commerce_order` schema.

## Solution

Built a new orders screen from scratch at `/products/orders` (list) and
`/products/orders/[id]` (detail), reading and writing the `commerce_order` API, sitting
alongside — not replacing — the legacy screen. Ten sequential tasks: view/status
transition table, data hooks, card + badge, list page with filters, receipt strip +
lightbox, order detail body, three confirmation dialogs, the action bar, the emailed Excel
export, and this documentation pass.

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
- Spec amendment: `docs/superpowers/specs/2026-09-02-buyInDirect-phase3b-design.md`
  §5.1.1 — records the product-kind dimension in `actionsFor` that §5.1's table omitted;
  §5.2 — records the `markPaid` outcome below (`completed` eligible, `cancelled` not).

### Whole-branch review fix wave (2026-09-02)

A final review of the completed phase found ten defects. All are fixed; the two critical
ones are written up under "Non-obvious decisions" below because they change stated rules.

- **C1** `canMarkPaid` excluded `completed`, hiding the button in its primary COD case.
  Predicate is now `paidAt === null && status !== 'cancelled'`.
- **C2** The filter bar's date picker sent Jalali dates to the API. Swapped to
  `react-multi-date-picker`; `isoFromDate` no longer goes through dayjs.
- **I1** No write invalidated the list key, so returning to the list showed a stale status.
  `useCommerceOrder.run()` now also calls the global `mutate` with `isOrdersListKey` — a
  predicate exported from `useCommerceOrders.ts`, beside the builder it must match.
- **I2** Receipts showed no upload time, which is the stated reason (spec §8 / D3) for
  showing all of them. Each thumbnail now carries a `toJalaliDateTime` caption.
- **I3** Order cards omitted the placed date (spec §6) — the field a date-sorted list is
  scanned by. Added beside the item count.
- **I4** A transport failure during `reject` toasted an empty string and destroyed up to
  500 characters of buyer-facing text: `onAction` swallowed the error, so the dialog closed
  and reset. `onAction` now resolves `boolean`, the dialogs close and clear only on `true`,
  and the toast falls back to `Commerce.Orders.errors.unknown`. The
  `COMMERCE_ORDER_STATUS_CHANGED` revalidation is unchanged.
- **I5** `ReceiptLightbox` had no `DialogTitle`, so Radix's `aria-labelledby` pointed at
  nothing (unlabeled dialog, console error on every open). It now renders a visually-hidden
  title carrying the attempt label `ReceiptStrip` computes — used for the fullscreen
  image's `alt` too, so a screen-reader user can tell which attempt opened — plus a
  visually-hidden description from `receipts.title`.
- **M1** `OrderDetail`'s `{actions && ...}` never falsified, because an `<OrderActions/>`
  element is truthy even when it renders `null` — a viewer without `order:manage`, or an
  order with no legal action, got an empty bordered strip. `OrderDetailPage` now decides
  with `hasAnyAction(order)` + the permission check and passes `null`.
- **M2** The action bar is now sticky on mobile (spec §7.7), `md:static` above.
- **M7** This doc said "CSV export" twice; it is an emailed **Excel** file.

### Non-obvious decisions worth remembering

- **Two screens, on purpose.** The legacy `/orders` screen and `components/Orders/` are
  untouched and still serve the old `order` table. The new screen only exists at
  `/products/orders*` and only reads `commerce_order`. They are not aware of each other.
  Retiring the legacy screen is a separate, later step — see the cutover row added to
  `before-prod-cutover.md` in this same task.
- **Breadcrumbs needed no code.** `orders` was already a known segment in
  `HeaderBreadcrumb.tsx`, and UUID detail segments already resolve to
  `Breadcrumbs.detail`. Nothing to add for either `/products/orders` or the `[id]` route.
- **`markPaid` is gated on `paidAt`, and on status only to exclude `cancelled`.** Back's
  `FulfilmentService.markPaid` has no status guard at all — its only condition is
  `paidAt IS NULL` — and it is deliberately idempotent (a second call is a seller
  double-tapping, not a conflict). The first cut of this screen read the rule as "never on
  status" and excluded both terminal statuses, which broke the button's **primary** case:
  the `paidAt` docstring on Back's `commerceOrder.entity.ts` says that with
  cash-on-delivery the courier remits *days later, often batched*, "so an order is
  routinely `COMPLETED` (fully delivered) and `paidAt IS NULL` (not yet settled) at the
  same time", and `markPaid` is "the only writer of this column for COD orders". Hiding
  it on `completed` left a delivered COD order with no path to settlement, ever.
  `cancelled` stays excluded because no money exists on either route into it — `reject`
  fires before payment is accepted, and `cancel` is `delivery_refused`, where the courier
  collected nothing. Final predicate:
  `order.paidAt === null && order.status !== 'cancelled'`. See the amended spec §5.2.
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
- **The date filter uses `react-multi-date-picker`, NOT `packages/ui`'s `DatePicker`.**
  This screen originally used the `packages/ui` one and it corrupted dates. That component
  imports `packages/ui/src/lib/dayjs-jalali`, whose module **body** calls
  `dayjs.calendar('jalali')` — a **global** mutation of the shared dayjs default calendar,
  not a per-instance one. Two consequences, both real: plain
  `dayjs(date).format('YYYY-MM-DD')` started emitting `1405-06-11` instead of
  `2026-09-02`, so `?from=`/`?to=` and the export payload carried Jalali strings the API
  cannot parse; and `utils/jalali.ts` (which reads `d.year()/month()/date()` expecting
  Gregorian and hands them to `toJalaali()`) double-converts under that default and
  renders **year 784**. The filter now uses `react-multi-date-picker` — the same picker
  the three legacy export drawers use — and `isoFromDate` formats from the `Date`'s own
  calendar fields rather than through dayjs, so no plugin can change what the API is sent.
- **That global-calendar mutation is wider than this screen, and is NOT fixed here.**
  Removing the direct `@/components/ui/date-picker` import is necessary but not
  sufficient: `packages/ui/src/components/ui/index.ts:30` does
  `export * from './date-picker'`, so **any** import from the `@/components/ui` **barrel**
  drags the mutation in — 24 dashboard files do, most of them predating this phase — and
  `packages/ui/package.json` declares no `sideEffects`, so a bundler cannot drop it
  either. Measured, not assumed: `import '@/components/ui'` alone makes
  `toJalaliDate('2026-09-02T10:00:00.000Z')` return `784/03/21`. That is a pre-existing,
  app-wide defect (it also reaches the legacy `components/Orders/OrderCard.tsx`,
  `AccountSessionsTable.tsx` and `AutomationTableColumns.tsx`) whose fix belongs in
  `packages/ui`, out of this phase's scope. What this phase does instead is stop depending
  on the global calendar being correct: `isoFromDate` is dayjs-free, and
  `OrdersListPage.test.tsx` asserts the pollution is present **and** that the helper still
  produces Gregorian anyway, while `OrderDetail.test.tsx` pins that the detail screen's own
  module graph stays barrel-free so its dates convert exactly once.

## Verification

Full history, all fix rounds, and every review verdict:
`.superpowers/sdd/2026-09-02-buyInDirect-phase3b/progress.md`.

Numbers below were re-measured after the fix wave, from
`/home/cvexor/Documents/MVP/Front/worktrees/commerce-product-core`. The Orders suite grew
from 71 tests to 99 (the gate command's scope) and the whole dashboard from 586 to 616 —
the extra file being `hooks/useCommerceOrder.test.tsx`, which drives I1's list invalidation
end to end through a real SWR cache rather than by spying on `mutate`:

```
$ cd apps/dashboard && npx vitest run src/components/Commerce/Orders/ src/hooks/useCommerceOrders.test.ts
 Test Files  11 passed (11)
      Tests  99 passed (99)
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

```
$ npx vitest run   # whole apps/dashboard suite
 Test Files  72 passed (72)
      Tests  616 passed (616)
   Duration  47.27s
```

Zero regressions across the whole dashboard, not just the Orders suite. Worth calling out:
`src/i18n/messages.test.ts` is among the 71 passing files, and it exercises the message
files this phase modified — the specific regression risk this phase carried, since more
than twenty existing test files import `fa.json`.

```
$ npx eslint apps/dashboard/src/components/Commerce/Orders apps/dashboard/src/app/\(Console\)/products/orders apps/dashboard/src/hooks/useCommerceOrder.ts apps/dashboard/src/hooks/useCommerceOrders.ts apps/dashboard/src/types/commerceOrders.ts
✖ 3 problems (0 errors, 3 warnings)
```

The gate is "no errors" — there are none. The three warnings, recorded honestly rather
than omitted:

- Three `@next/next/no-img-element` warnings (`OrderDetail.tsx:182`,
  `ReceiptLightbox.tsx:20`, `ReceiptStrip.tsx:38`). Checked against the rest of the app:
  plain `<img>` is the established pattern here — twelve existing files use it, including
  the sibling `CommerceProductCard.tsx` — so these match house style rather than
  introducing drift. Not something to "fix" in isolation on this screen.

A fourth warning (`@typescript-eslint/no-unused-vars` on an unused `onConfirm` binding in
`dialogs/RejectPaymentDialog.test.tsx:75`) was the one warning this phase actually
introduced. Fixed by dropping the unused assignment (that test asserts only on DOM state,
never on `onConfirm` itself) — see the fix-round commit. Re-verified after the fix:
`npx vitest run src/components/Commerce/Orders/dialogs/` — 2 files, 9/9 tests pass; the
eslint command above dropped from 4 problems to the 3 shown.

## Outstanding

- ~~`knowledge/knowledgeMap.doc.md` still needs a row for this doc.~~ **Done 2026-09-03.**
  Deferred during the task itself (Ruling 9, `progress.md`) because the file carried
  another live session's uncommitted edits. Resolved without touching their work: the
  index was written from `HEAD` plus this row only (`git hash-object` +
  `git update-index --cacheinfo`), leaving their edit unstaged in the working tree. The
  same commit also repaired the `2026-08-31-buyInDirectAutomationContent.update.md` row,
  which had only two cells — its file-path column was never written, so the description
  had slid into it. **Note for whoever maintains that index:** 34 of the 107 files in
  `knowledge/updates/` have no row at all. That backlog predates this phase and is not
  this branch's to close.

### `apps/admin` has the same Jalali timezone bug this phase fixed in the dashboard

Not fixed here — different app, outside this branch's scope, and pre-existing. Recorded
so it is not rediscovered from scratch.

`apps/admin/src/lib/dayjs-jalali.ts` is a **byte-identical copy** of
`packages/ui/src/lib/dayjs-jalali.ts`, module-body `dayjs.calendar('jalali')` and all. Two
call sites then chain `.calendar()` *after* `.tz()`:

- `apps/admin/src/lib/task-datetime.ts:39` — `dayjs(iso).tz('Asia/Tehran').calendar('jalali').format('YYYY/MM/DD HH:mm')`
- `apps/admin/src/app/(main)/users/columns.tsx:34` — same chain, `format('YYYY/MM/DD')`

jalaliday's `.clone()` drops the timezone binding, so `.calendar()` throws away what
`.tz()` established and the value falls back to the **host** timezone. Confirmed by
running admin's own installed `dayjs@1.11.19` + `jalaliday` against
`2026-09-02T09:00:00.000Z` (12:30 in Tehran):

| Host TZ | `.tz('Asia/Tehran').calendar('jalali')` renders | Correct |
|---|---|---|
| `Asia/Tehran` | `1405/06/11 12:30` | ✅ (only by luck — host already Tehran) |
| `UTC` | `1405/06/11 09:00` | ❌ off by 3.5h |
| `America/New_York` | `1405/06/11 05:00` | ❌ off by 7.5h |

Dropping `.tz()` entirely changes nothing, which is the proof it never applied. The date
part only shifts when the offset crosses midnight, so this hides well: staff browsing from
Iran see correct times, and it surfaces on server-rendered output or a non-Tehran host.

The fix used here is in `apps/dashboard/src/utils/jalali.ts` — format the absolute instant
with `Intl.DateTimeFormat` and an explicit `timeZone`, never dayjs. It needs no change to
`packages/ui`, which is why this phase touched zero files under `packages/`.
- Retiring the legacy `/orders` screen is tracked as a cutover item in
  `before-prod-cutover.md` (outer repo), gated on the
  `CommerceOrderCoreData1786960000000` migration having run in production.
