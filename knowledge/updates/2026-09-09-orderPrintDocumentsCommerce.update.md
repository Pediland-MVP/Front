# Order print documents (shipping label / invoice), commerce-module version — 2026-09-09

Front half of `Back/knowledge/updates/2026-09-09-orderPrintDocumentsCommerce.update.md` (Back
commits `a4e996e0`..`b6a7cde7` on `feat/commerce-product-core`, already shipped), which carries the
`ShopAddress` entity, the two `/instagram/:instagramID/shopAddress` endpoints, and the new `shop`
block on `GET /commerce/orders/:id` — read that one first, this side is built on it.

> **Rearchitected later the same day** — see the dated section at the bottom of this file. The
> `ShopAddressDialog`/`InstagramAccounts.tsx` 4th button described below (through "## Verification")
> was REPLACED by a full settings page (`ShopAddressSettings` at `/products/shop`), because the
> address moved from per-Instagram-account to per-workspace on the Back side. Kept as-is for the
> commit-by-commit history; do not treat it as the current design.

API contract rows updated in [`knowledge/front-back-relations.md`](../front-back-relations.md).

## Problem

A seller has no way to print a shipping label or a sales invoice for a commerce order — every
print needs the order's own data (buyer, lines, totals) plus the seller's own postal identity
(sender name/address/phone/postal code), and until this feature nothing on the frontend rendered
either as a printable document, and nothing let a seller record their own postal address per
Instagram account in the first place.

## Solution

- Pure HTML-string document builders (`buildLabelDocument`/`buildInvoiceDocument`) render an A5
  shipping label and an A4 invoice from an `OrderDetailView`, using the browser's native
  print-to-PDF as the PDF path — no PDF library. A shared hidden same-origin iframe
  (`printDocument.ts`) does the actual `window.print()`.
- Two new header buttons on `OrderDetail.tsx` («پرینت برچسب» / «پرینت فاکتور») call the builders.
  The label button is disabled for a digital order (`order.kind !== 'physical'`); the invoice
  button is always enabled. Deliberately placed in a new header row above the grid, not inside
  `OrderSummaryRail.tsx` — that rail is reserved for status-decision content only.
- New `ShopAddressDialog.tsx`, opened from a 4th action button on `InstagramAccounts.tsx`, lets a
  seller record/edit the sender address (province/city/address/postal code/phone/shipping method)
  used on printed documents, per Instagram account. The trigger stays enabled for
  `instagram:view-only` users (unlike the other three action buttons) so a read-only user can still
  open and read the address; every field plus the save button are disabled instead.
- `OrderDetailPage.tsx` resolves the buyer's city **and** province names via
  `useShippingDestinations()` and passes both through, so the builders never have to look up a
  human-readable location themselves.

## Two real bugs found and fixed (Task 9's review loop)

Both share one root cause and are worth knowing about explicitly, since they are the kind of bug a
future editor of `ShopAddressDialog.tsx` could reintroduce:

**react-hook-form's `reset()`/`setValue()` do not reliably clear a manually-controlled
`Controller`-bound Select's DISPLAYED value when given an explicit `undefined`** — the Select falls
back to a value frozen at mount, unlike a plain registered `<input>`, which handles `undefined`
fine. The fix in both cases is the same: use `''` instead of `undefined`, matching the pattern
already used for the other four (registered-input) fields.

1. **Account-switch reset (data bug).** The effect that resets the form when switching to a
   different Instagram account reset `state`/`cityId` to `undefined` when the target account had no
   saved city, while the other four fields correctly reset to `''`. Left unfixed, the *previous*
   account's province/city stayed visible — and submittable — as the new account's address. This
   is exactly the cross-account leak class the whole dialog exists to prevent: an unfixed instance
   would print the wrong sender province/city on a shipping label or invoice.
2. **Live province-change handler (display-only bug).** The province Select's `onValueChange`
   called `form.setValue('cityId', undefined)` to drop the now-stale city — same mechanism, same
   fix (`''`). This one was traced and confirmed to be **display-only**: `setValue(name,
   undefined)` had already correctly cleared the actual submitted form values, so no saved address
   was ever stored with a city inconsistent with its province. Still fixed, since a user staring at
   a wrong city on screen has no way to tell it isn't what would be saved.

Bug 1 was first found (and correctly left unfixed, as a documented repro test with a
"known defect, not fixed here" docstring — no `it.skip`, the test ran and failed) by Task 11's
test gap-fill pass, since that task's scope was tests-only. Bug 2 was found afterward while writing
the TDD repro for bug 1's fix. Once the fix landed, the repro test's name/docstring were rewritten
into a regression test (see `ShopAddressDialog.test.tsx`) rather than left describing a defect that
no longer exists.

## Changes

**New files**
- `apps/dashboard/src/components/Commerce/Orders/print/buildLabelDocument.ts` (+ `.test.ts`) — A5
  shipping label builder.
- `apps/dashboard/src/components/Commerce/Orders/print/buildInvoiceDocument.ts` (+ `.test.ts`) — A4
  invoice builder.
- `apps/dashboard/src/components/Commerce/Orders/print/documentStyles.ts` — shared print CSS.
- `apps/dashboard/src/components/Commerce/Orders/print/printDocument.ts` — hidden same-origin
  iframe + `srcdoc` print mechanism.
- `apps/dashboard/src/utils/toPersianDigits.ts`, `apps/dashboard/src/utils/numberToPersianWords.ts`
  (+ `.test.ts`) — ported unchanged from the legacy-order reference implementation.
- `apps/dashboard/src/types/instagram/shopAddress.ts` — `IShopAddress` type.
- `apps/dashboard/src/components/Settings/ShopAddressDialog.tsx` (+ `.test.tsx`) — the sender
  address dialog.

**Changed files**
- `apps/dashboard/src/types/commerceOrders.ts` — new `OrderShopView` type, `shop: OrderShopView |
  null` field on `OrderDetailView`.
- `apps/dashboard/src/components/Commerce/Orders/OrderDetail.tsx` (+ `.test.tsx`) — new header row,
  the two print buttons, wired to the builders through `printDocument()`.
- `apps/dashboard/src/components/Commerce/Orders/OrderDetailPage.tsx` (+ `.test.tsx`) — resolves
  buyer province name via `useShippingDestinations().provinceById` alongside the existing city
  resolution; both passed through to `OrderDetail`.
- `apps/dashboard/src/components/Settings/InstagramAccounts.tsx` — new 4th action button opening
  `ShopAddressDialog`, enabled for view-only users.
- `apps/dashboard/src/messages/fa.json` — print button labels, `Settings.ShopAddress` /
  `Settings.Accounts.shopAddress` namespaces.
- `apps/dashboard/src/messages/fa/ErrorCodes.json` — `SHOP_ADDRESS_INVALID_CITY` (the paired Back
  error code for a bad `cityId` on PUT).
- Various test fixtures (`OrderDetail.test.tsx`, `OrderDetailPage.test.tsx`,
  `OrderSummaryRail.test.tsx`) updated to include the new required `shop` field on
  `OrderDetailView`.

No backend change needed here beyond what `Back/knowledge/updates/2026-09-09-orderPrintDocumentsCommerce.update.md`
already covers — this doc is Front-only file list.

## Verification

- `pnpm exec vitest run src/components/Commerce/Orders src/components/Settings src/utils` — all
  touched suites passing (label/invoice builders, `OrderDetail`, `OrderDetailPage`,
  `ShopAddressDialog`, `toPersianDigits`/`numberToPersianWords`).
- `pnpm exec tsc --noEmit` on `apps/dashboard`: **206 → 207**. The one new error is
  `ShopAddressDialog.tsx(62,60)`, a `zodResolver`/`ZodType` argument-type mismatch — the accepted
  pre-existing `@hookform/resolvers` zod version-skew class, not a new bug class. 21 other files
  already carry the identical error, including every other Settings form (`ProfileForm`,
  `TeamManager`, `WorkspaceForm`, `PasswordTab`, `ChoosePlan`, `DiscountCode`) plus
  `CheckoutPage`, `excelExportSessions`, and others across `app/(Auth)`/`app/(Console)`.
- **Not clicked through in a browser.** No one has opened the print preview or the print dialog
  itself against a real order, and the printed A5/A4 layout has not been checked against an actual
  printer or PDF export.

## 2026-09-09 (later the same day) — Rearchitected to per-workspace

Back side full reasoning: `Back/knowledge/updates/2026-09-09-orderPrintDocumentsCommerce.update.md`'s
matching dated section. Commit range this section describes: Back `b6a7cde7..e8fb5660`, Front
`a38637b8..HEAD` (this same branch).

**Problem:** the address was per-Instagram-account (`ShopAddressDialog`, opened from a 4th button
on the Instagram accounts settings list). The actual requirement is one return address per
**workspace**, not one per connected page.

**Front changes — entirely a UI-location + data-source swap, `OrderShopView`'s shape and the print
builders (`buildLabelDocument`/`buildInvoiceDocument`) are UNCHANGED:**

- `ShopAddressDialog.tsx` (+ `.test.tsx`) DELETED. Replaced by `ShopAddressSettings.tsx`
  (`components/Commerce/Shop/`, + `.test.tsx`) — a full settings page, not a dialog, since there is
  now exactly one address to show (no per-account switching to gate behind a trigger button).
- New route `/products/shop/page.tsx`, under "کالا و خدمات" — sibling of `/products/shipping`,
  same reasoning: a setting that shapes what prints/charges on an order belongs beside the
  catalogue, not under general account settings.
- `InstagramAccounts.tsx` — the 4th action button («آدرس») and its `ShopAddressDialog` wiring
  removed entirely; the account list goes back to its original 3 actions (Copy/Reconnect/Delete).
- New `apps/dashboard/src/hooks/useShopAddress.ts` — bound to the fixed key
  `/commerce/shop-address` (no route param, matching `useShippingOptions`'s shape), replacing the
  old dialog's own inline `useSWRImmutable` call keyed by `instagramId`.
- `apps/dashboard/src/types/instagram/shopAddress.ts` → moved to `apps/dashboard/src/types/shopAddress.ts`
  (top-level, matching `shipping.ts`'s convention) and dropped the now-nonexistent `id` field
  (`workspaceId` is the row's identity on the Back side now, never sent to the client).
- `usePermissions().can('order:manage')` now gates editing (was `instagram:manage`) — matches the
  Back permission split change (`ORDER_VIEW`/`ORDER_MANAGE`, same as the sibling shipping-options
  controller).
- Sidebar (`ConsoleSidebar.tsx`) gained a `productsShop` entry; breadcrumb (`HeaderBreadcrumb.tsx`)
  gained a `shop` segment. New i18n keys: `Console.Sidebar.productsShop` (note: **`fa/Console.json`**,
  not `fa.json` — `i18n/request.ts` shallow-merges the two and `fa.json` carries no top-level
  `Console` key at all, so there is no shadowing risk here, unlike `ErrorCodes.json`) and
  `Breadcrumbs.shop` (`fa.json`, alongside the existing `shipping`/`taxonomy`/`import` entries).
  `Settings.Accounts.shopAddress` (the old per-account button label) removed as dead;
  `Settings.ShopAddress.title`/`.description` reworded from "این آدرس روی برچسب پستی و فاکتور
  همین پیج چاپ می‌شود" (this page) to reflect the whole shop.
- The two RHF `undefined`-vs-`''` fixes from the original `ShopAddressDialog` (see the section
  above) carry over unchanged in spirit: the data-driven load still resets `state`/`cityId` to
  `''`, and the province `Select`'s live `onValueChange` still clears `cityId` to `''` rather than
  `undefined`. The account-SWITCHING scenario that originally exposed bug 1 no longer exists (a
  single fixed SWR key, no re-keying), so that specific regression class is gone by construction —
  but the general Controller-bound-Select quirk still applies to any load/clear, so both fixes stay.

**Verification:**
- `pnpm exec vitest run src/components/Commerce/Shop src/components/Settings/InstagramAccounts.tsx
  src/components/Layout/ConsoleSidebar.test.tsx` (plus the full `src/components/Commerce` +
  `src/components/Settings` + `src/hooks` suites) — all passing, 53 suites / 616 tests in the wider
  sweep.
- `pnpm exec tsc --noEmit`: **207 → 207** (net zero) — `ShopAddressDialog.tsx`'s pre-existing
  accepted `zodResolver` error moved to `ShopAddressSettings.tsx` (same error class, same file
  count as before, not a new one).
- **Still not clicked through in a browser** — same known gap as the original cut.
