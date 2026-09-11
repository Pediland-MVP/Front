# DM order follow-up & shipping — Front (Tasks 15-18)

Design spec: `docs/superpowers/specs/2026-09-05-dm-order-followup-and-shipping.md` (describes the
whole feature, Back and Front). Paired Back doc:
`Back/knowledge/updates/2026-09-05-orderFollowUpCode.update.md` (not written by this task — see
that repo's own Task 19 for its contents).

Branch: `feat/dm-order-followup`, both repos, unmerged. This doc covers Front commits
`de4f6b12..29df231e` (Tasks 15-18): the product-description field, the ship dialog, the tracking
row + edit dialog, and the pickup/پس‌کرایه shipping-config fix.

## Problem

Three separate gaps, all downstream of the Back's Task 5 additions
(`trackingUrl`/`pickupAddress`/`cancelNote`/`followUpCode` on `OrderView`):

1. The product-description editor was a `contentEditable` WYSIWYG surface storing up to 20,000
   characters of markdown, with a five-button toolbar and a `lastPushed` push/pull arbitration
   whose only job was stopping the caret from jumping while React and the DOM fought over the
   same content. Its only live consumer is the Instagram DM carousel card subtitle — built as
   `price — description` inside a generic template capped at ~80 characters, of which a
   nine-digit toman price plus its separator eats up to 20. Markdown was never rendered there, and
   anything past the cap was silently cropped by Instagram. The merchant was never told either was
   happening.
2. `ship` (`processing → sending`) had no dialog for the carrier tracking URL the Back's Task 5
   added support for, and there was nowhere to see or correct a tracking link once posted.
3. `ShippingMethodCard` let a merchant pick «پس‌کرایه» (`freight_collect`) on a «تحویل حضوری»
   (`pickup`) method — a combination that is meaningless (a pickup has no carrier and no freight)
   and was only *hidden* downstream (the summary line special-cased pickup before any settlement
   check ran, and `chargesShipping()` forced `false` for pickup) rather than prevented. The
   «پرداخت در محل» merchant-facing note also used courier wording («مأمور پست...») on a pickup,
   where the buyer pays at the merchant's own counter, not a courier.

## Solution

- **Description → plain text.** `DescriptionSection.tsx` becomes a plain `<textarea>` with a
  `maxLength={60}` and a live `۴۲ / ۶۰` counter (Persian digits via `e2pNumbers`), inside the same
  card chrome (`editorCard`, `min-h-[170px]`) the old editor used. `contentEditable`, the toolbar,
  the `lastPushed` arbitration, and `utils/markdown.util.ts` (plus its test file) are deleted.
  `productEditor.schema.ts`'s zod cap moved from `.max(20_000)` to `.max(60)`.
  **The description is now plain text with nothing markdown left to render.** Any future
  storefront or other surface that renders it must treat it as plain text — there is no markdown
  syntax to strip or escape, because none is stored any more.
- **`ShipOrderDialog`** (new) replaces the generic `ConfirmActionDialog` on `processing → sending`.
  Collects an optional carrier tracking URL, validated `http(s)`-only via `new URL()` + an explicit
  `protocol` check (`new URL()` alone happily parses `javascript:alert(1)` as "valid" — the URL is
  rendered straight into an Instagram DM the buyer taps). The URL field is hidden entirely when
  `shippingKind === 'pickup'` — a pickup order is "ready to collect", not "posted", so there is no
  parcel a link could point at. On a failed write the typed URL is kept (only a manual cancel
  clears it), matching `RejectPaymentDialog`'s existing discipline.
- **Tracking row + `EditTrackingDialog`** (new) on `OrderSummaryRail`. The row is visible when
  `(status === 'sending' || status === 'completed') && shippingKind !== 'pickup'`. Read-only
  display for any viewer; the edit affordance is gated on `order:manage`. Calls
  `PATCH /commerce/orders/:id/tracking` (`useCommerceOrder`'s new `updateTracking`) with a required
  URL (same http(s)-only validation as `ShipOrderDialog`) and an opt-in `notify` boolean that
  **defaults to unchecked** — most edits are the seller fixing their own typo seconds after `ship`,
  and a DM per correction would be noise.
- **Shipping-config fix.** `shippingDraft.ts` gains `SETTLEMENTS_BY_KIND(kind)` as the single
  source of truth for which settlements a kind can offer (`pickup` → `['prepaid',
  'cash_on_delivery']`; everything else → all three). `ShippingMethodCard` uses it both to build
  the radio list and, in the SAME `onChange` that switches `kind`, to clear a now-invalid
  `settlement` back to `'prepaid'` — filtering the visible list alone would still submit a hidden,
  unchanged `freight_collect`. The «پرداخت در محل» note gained a kind-aware branch:
  `settlementNotes.cash_on_delivery_pickup` (no `مأمور پست`, buyer pays at the counter) vs. the
  existing `settlementNotes.cash_on_delivery` (courier collects at the door). Backend refuses the
  combination with `COMMERCE_SHIPPING_SETTLEMENT_INVALID`.

### The vocabulary this all sits on

**«پرداخت در محل» means two different things depending on `kind`.** On a پیک/پست it is "the
courier collects at your door" — the order **is** posted. On a تحویل حضوری it is "pay at our
counter" — the order is **never** posted. **Posting is decided by `kind` alone; `settlement` never
decides it.** Getting this backwards sends the reader down exactly the wrong path — it is the
reason `cash_on_delivery_pickup` needed its own copy key rather than reusing the courier wording,
and the reason `ship`'s dialog hides the tracking field for `pickup` regardless of `settlement`.

## Changes

| File | Change |
| --- | --- |
| `apps/dashboard/src/components/Commerce/ProductEditor/sections/DescriptionSection.tsx` | Rewritten: plain `<textarea>`, `maxLength={60}`, live counter, same card chrome. `contentEditable`/toolbar/`lastPushed` arbitration removed. |
| `apps/dashboard/src/components/Commerce/ProductEditor/utils/markdown.util.ts` (+ its test) | Deleted. |
| `apps/dashboard/src/components/Commerce/ProductEditor/productEditor.schema.ts` | `description` cap `.max(20_000)` → `.max(60)`. |
| `apps/dashboard/src/components/Commerce/ProductEditor/dialogs/PreviewDialog.tsx` | Preview no longer renders markdown for the description. |
| `apps/dashboard/src/styles/globals.css` | 34 lines of the old contentEditable/toolbar styling removed. |
| `apps/dashboard/src/test/renderWithForm.tsx` | New shared test helper (76 lines), used by the rewritten description tests. |
| `apps/dashboard/src/components/Commerce/Orders/dialogs/ShipOrderDialog.tsx` | New. Confirms `processing → sending`, optional tracking URL, hidden for pickup. |
| `apps/dashboard/src/components/Commerce/Orders/OrderStatusUpdater.tsx` | `onAction`/`runAction` widened to carry an optional `trackingUrl`, forwarded only when set; wires `ShipOrderDialog` in place of the generic confirm dialog for `ship`. |
| `apps/dashboard/src/hooks/useCommerceOrder.ts` | `ship(trackingUrl?)`; new `updateTracking(trackingUrl, notify)` → `PATCH /commerce/orders/:id/tracking`. |
| `apps/dashboard/src/types/commerceOrders.ts` | `OrderView` gains `trackingUrl`/`pickupAddress`/`cancelNote`/`followUpCode`, all optional (existing test fixtures untouched). |
| `apps/dashboard/src/components/Commerce/Orders/dialogs/EditTrackingDialog.tsx` | New. Required URL, `notify` checkbox defaulting OFF, re-seeds on open. |
| `apps/dashboard/src/components/Commerce/Orders/OrderSummaryRail.tsx` | New tracking row: link (read-only) + edit affordance (gated `order:manage`), visible per the status/shippingKind rule above. `rel="noopener noreferrer"` on the link (merchant-supplied URL, opens in a new tab). |
| `apps/dashboard/src/components/Commerce/Orders/{OrderDetail,OrderDetailPage}.tsx` | Wire `onUpdateTracking` through to `OrderSummaryRail`. |
| `apps/dashboard/src/utils/commerce/shippingDraft.ts` | New `SETTLEMENTS_BY_KIND(kind)`. |
| `apps/dashboard/src/components/Commerce/Shipping/ShippingMethodCard.tsx` | Radio list sourced from `SETTLEMENTS_BY_KIND`; kind-switch `onChange` clears a stale `freight_collect`; kind-aware `cash_on_delivery` / `cash_on_delivery_pickup` note. |
| `apps/dashboard/src/messages/fa.json` | New copy: description section hint/placeholder/count; ship dialog (pickup vs. posted titles/descriptions, url label/hint/invalid); tracking dialog (title/description/notify label/invalid); `settlementNotes.cash_on_delivery_pickup`. |
| `apps/dashboard/src/messages/fa/ErrorCodes.json` | Three new keys — see below. |
| `apps/dashboard/package.json` / `pnpm-lock.yaml` | `@testing-library/user-event` added then removed same day — see "Decisions" below; net diff is zero new runtime deps. |

### Error codes added (`apps/dashboard/src/messages/fa/ErrorCodes.json`)

| Code | Persian message |
| --- | --- |
| `COMMERCE_PRODUCT_DESCRIPTION_TOO_LONG` | «توضیحات محصول حداکثر ۶۰ کاراکتر است.» |
| `COMMERCE_ORDER_NOT_TRACKABLE` | «برای سفارش تحویل حضوری، لینک پیگیری معنی ندارد.» |
| `COMMERCE_SHIPPING_SETTLEMENT_INVALID` | «برای «تحویل حضوری» نمی‌توان «پس‌کرایه» انتخاب کرد.» |

Per CLAUDE.md §10/§8, these live in `messages/fa/ErrorCodes.json` — the `ERROR_CODES` block inside
`messages/fa.json` is shadowed by the shallow spread in `i18n/request.ts` and is dead at runtime
(see `feedback_error_code_translations_file` memory / `2026-08-27-audioTooLongErrorCode.update.md`
for the same trap hit before). `en/ErrorCodes.json` intentionally left alone.

## Decisions worth recording (to avoid re-litigating)

- **`@testing-library/user-event` is deliberately NOT a dependency.** It was added in
  `de4f6b12` for the new `DescriptionSection.test.tsx`, then removed the same day in `bee20191`
  once it turned out to be the only file in the app using it against 41 files using `fireEvent` —
  not worth a second testing idiom plus a new dependency for one test. `fireEvent.change` bypasses
  the browser's `maxLength` enforcement, so the over-cap behaviour that `user-event` could exercise
  is now asserted two other ways instead: the `maxLength` attribute itself
  (`DescriptionSection.test.tsx`), and the 61-rejected/60-accepted boundary at the zod-schema level
  (`productEditor.schema.test.ts`), which is where the real enforcement lives anyway.
- **`ShipOrderDialog`'s `reset()` omits `setIsSubmitting(false)`**, unlike the `RejectPaymentDialog`
  pattern it otherwise copies (confirmed by reading both files: `RejectPaymentDialog.reset()` calls
  `setIsSubmitting(false)`; `ShipOrderDialog.reset()` does not). This self-heals via
  `handleConfirm`'s `finally` block, which always runs `setIsSubmitting(false)` regardless — so the
  only way to observe the gap is a seller who escapes/cancels mid-request and reopens the dialog
  before the in-flight request settles. Narrow, but real; worth fixing to match the sibling dialog
  exactly if this file is touched again.

## Known gaps (unsoftened)

- **`EditTrackingDialog`'s re-seed effect races a concurrent update.** The effect depends on
  `[open, current]`, not on a `false → true` transition of `open` alone. If the order's
  `trackingUrl` changes from another seat (or the buyer's own action) **while the dialog is
  already open**, the effect re-fires and silently overwrites whatever the seller had typed plus
  resets `notify` to `false` — with no warning that anything happened. The window is narrow (needs
  a concurrent write during an open edit session) but the loss is silent. Fix: seed only on the
  `false → true` transition of `open`, e.g. by tracking the previous `open` value in a ref.
- **`ShipOrderDialog`'s `reset()` omits `setIsSubmitting(false)`**, unlike `RejectPaymentDialog`.
  Self-heals via `handleConfirm`'s `finally`; only visible if a seller cancels/escapes mid-request
  and reopens before the request settles. See "Decisions" above.
- **`packages/ui/node_modules/next-intl` is a tracked symlink that drifts.** It points into a
  content-hashed `.pnpm/<hash>/node_modules/next-intl` path that changes whenever the dependency
  resolution shifts (a peer-dep hash suffix changed during this branch's work, from
  `..._@babel+core@7.28.5_@opentelemetry+api@1.9.0..._65653be2dd39241e10d611f503a71254` to
  `..._@opentelemetry+api@1.9.0..._b35d1ff7f6aa0ba345102261253c303a`), which broke three of this
  branch's tasks' test runs until re-linked (`pnpm install`). Pre-existing, not caused by this
  branch's feature work — this branch's commits deliberately **do not** commit the drifted symlink
  (git shows it modified-but-unstaged throughout). A tracked `node_modules` symlink probably should
  not be in git at all; worth its own cleanup task.

## Verification

Run personally, this session, on `feat/dm-order-followup`:

```
cd apps/dashboard && pnpm test -- src/components/Commerce
```

Result: **80 test files passed, 716 tests passed**, 0 failed (`Duration 60.13s`).

Note: the `src/components/Commerce` argument does **not** scope this repo's vitest run — a
same-session unfiltered `pnpm test` (no args) produced the identical **80 files / 716 tests**,
confirming the positional filter has no effect here rather than coincidentally matching the whole
suite. So this number covers the entire `apps/dashboard` test suite, not just the
Commerce/Orders/ProductEditor/Shipping files Tasks 15-18 touched.

`tsc`/`next build` were not run for this doc — the brief asked not to run `next build`/`pnpm dev`
without asking, and no TypeScript was touched outside files already covered by the passing test
run above.
