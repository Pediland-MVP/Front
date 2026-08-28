# Shipping Methods Settings Screen — 2026-08-27

Full design/plan reference:

- `Back/worktrees/commerce-product-core/docs/superpowers/specs/2026-08-27-commerce-shipping-methods-design.md`
- `Back/worktrees/commerce-product-core/docs/superpowers/plans/2026-08-27-commerce-shipping-methods-front.md`
- Paired Back doc: `Back/knowledge/updates/2026-08-27-commerceShippingMethods.update.md`
- Visual source: `ShippingSettings.dc.html` in the Befroosh design project (same project the
  product editor's chrome came from, via `ProductVariations.dc.html`).

> **Deploy-coupled.** Every route this screen calls ships in the paired Back branch. Neither half
> works alone.

## Problem

The Back half gave a workspace merchant-owned shipping options with a default price and sparse
per-city/per-province exceptions, but there was no way to set any of it. A merchant with no active
shipping option cannot take an order at all — `submitBlockers.util.ts` blocks checkout on
`shipping` — so the feature was unreachable in practice.

## Solution

A new page at **`app/(Console)/products/shipping/page.tsx`**, reached from a fourth sub-item under
«کالا و خدمات» in `ConsoleSidebar.tsx` («تنظیمات ارسال پستی»). It sits beside the catalogue rather
than under general settings because the price it sets is a property of what the shop sells.

1. **`ShippingSettings.tsx`** — the screen. Every card edits a local draft; nothing is sent until
   the header's «ذخیره تغییرات». The API is one route per option plus a second route for that
   option's exceptions, so save-per-field would fire three writes and three toasts for one
   ordinary edit. Batching also makes «انصراف» a real undo. Writes run **sequentially and stop at
   the first failure**, so a partial failure leaves every unsaved change in the drafts and
   pressing save again retries exactly what is left — `Promise.all` would report one error with no
   way to tell which of four methods actually saved.

   **Deletion is the deliberate exception**: it runs immediately behind
   `DeleteConfirmationDialog`, because burying a destructive action inside a generic "save
   changes" is how people lose data they did not mean to.

   A background SWR revalidation never clobbers unsaved edits — the effect that adopts server data
   compares a payload signature and bails while the screen is dirty.

2. **`ShippingMethodCard.tsx`** — one method, and the screen's one real piece of domain
   translation. The API models pricing as a single three-way enum (`flat` / `free_over` /
   `post_kerayeh`); a merchant thinks in a price plus two yes/no questions. So the card shows two
   switches and `pricingOf` folds them back into the enum. **پس‌کرایه swallows the others**: when
   the courier collects the fare from the buyer, the seller's price, threshold and exceptions are
   all meaningless, so they are *hidden* rather than left contradicting the mode — matching the
   `CHK_commerce_shipping_option_pricing` constraint instead of letting the server silently
   correct the payload.

   Deviation from the prototype, on purpose: the design hides the body of an inactive card, which
   would make a deactivated method uneditable — you could never fix the price that made you turn
   it off. A pencil affordance reveals the body while the method stays off.

3. **`RateOverrideEditor.tsx`** — the exceptions, collapsed and empty by default. That is the
   whole point of the sparse model: there are 1,119 cities and a merchant charging one price
   everywhere must never see a 1,119-row table. Search matches provinces before cities (a merchant
   pricing a region wants the province row, not it buried under city matches), hides destinations
   that already have a row, and caps suggestions at 30. Past 12 rows the list gains its own filter
   and a "show more".

4. **`MoneyField.tsx`** — the four price boxes on the screen, with CLAUDE.md §18 in one place:
   text input + `inputMode="numeric"` (a `type="number"` blanks Persian digits before they can be
   converted), `onInput={onInputP2EHandler}`, and `parseAmount`/`formatAmount` reused from the
   product editor so commerce separates prices the same way everywhere.

5. **`utils/commerce/shippingDraft.ts` / `shippingDestinations.ts`** — the enum folding, dirty
   detection and destination search as pure functions, so the rules are testable without a DOM.
   `areOverridesDirty` is order-insensitive: the server returns rows in insert order and a
   reorder alone must not look like an unsaved change.

**Design fidelity.** The prototype's own chrome (oklch violets, hand-drawn cards, `#7c7a88` greys)
was *not* copied. It maps onto the app's existing semantic tokens and the shared
`ProductEditor/ui/editorChrome.ts` vocabulary — `editorCard`, `editorInput`, `editorInputSm`,
`editorAddButton`, `text-mut`, `bg-tint`, `border-lnv` — the same translation the product editor
did for `ProductVariations.dc.html`.

## Changes

**New**

- `app/(Console)/products/shipping/page.tsx`
- `components/Commerce/Shipping/{ShippingSettings,ShippingMethodCard,RateOverrideEditor,MoneyField}.tsx`
- `hooks/useShippingOptions.ts`, `hooks/useShippingDestinations.ts`
- `types/shipping.ts`
- `utils/commerce/{shippingDraft,shippingDestinations}.ts`

**Modified**

- `components/Layout/ConsoleSidebar.tsx` — «تنظیمات ارسال پستی» sub-item under products.
- `components/Layout/HeaderBreadcrumb.tsx` — `shipping`, plus `taxonomy` and `import`, which were
  missing and had been falling through to the raw URL slug (CLAUDE.md §18.5).
- `types/city.ts` — `ICity.provinceId`, which `GET /cities` has always returned. Needed to show a
  saved exception as "city — province".
- `messages/fa.json` — `Commerce.Shipping` namespace, three `Breadcrumbs` keys.
- `messages/fa/Console.json` — `Console.Sidebar.productsShipping`.
- `messages/fa/ErrorCodes.json` — the five shipping `COMMERCE_*` codes. Note this file, **not**
  `fa.json`'s shadowed `ERROR_CODES` block.

## Verification

- `npx vitest run` — **486 pass / 59 files**, 56 of them new across four files:
  `shippingDestinations.test.ts` (7), `shippingDraft.test.ts` (19), `ShippingMethodCard.test.tsx`
  (9), `RateOverrideEditor.test.tsx` (11), `ShippingSettings.test.tsx` (10).
- `npx tsc --noEmit` — 206 errors, **byte-identical to the pre-change baseline**; zero in any
  touched file. (The baseline is pre-existing app-wide noise; `next build` uses
  `ignoreBuildErrors`.)
- `npx eslint` on every new file — clean.
- **Not yet verified in a browser.** No manual pass has been done against a running backend.
