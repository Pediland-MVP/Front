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

### Cash-on-delivery toggle (`settings/card`)

پرداخت در محل is a **payment method**, and it is entirely independent of پس‌کرایه, which is a
*shipping pricing mode* set per method on this screen. All four combinations are valid. The toggle
lives on the bank-details form because that is the endpoint the Back writes it through
(`POST /payments/cardToCard`) — the reasoning being that this page is the one place a merchant says
how their shop gets paid.

Adding it needed a Back fix (`d4189762`): `codEnabled`/`codMaxOrderValue` live on `payment_detail`,
and neither `getWorkspacePaymentDetailsById`'s `select` nor `readOneCardToCard`'s return included
them — so the form could set the toggle but never read it back, and it would have rendered off no
matter what was saved.

**Known limitation, unchanged:** `GET /payments/cardToCard` still 404s for a workspace with no
card, and `UpdateCardToCardDto` still requires the card fields. A merchant who wants *only* cash on
delivery therefore cannot switch it on without entering bank details. Fixing that means either a
COD endpoint of its own or making the card fields optional — a product decision, not a UI one.

### Not built: the order screen's settle and cancel actions

Task 6 of the plan asked for «تسویه شد» and cancel buttons on the order screen, calling
`POST /commerce/orders/:id/mark-paid` and `:id/cancel`. **It was not built, on purpose.**

The dashboard's `/orders` screen (`OrdersCardList` → `orderDetails.tsx`) reads the **legacy**
`GET /orders`, not `GET /commerce/orders`. Nothing in the dashboard calls a `/commerce/orders`
route at all — grep returns zero hits. The two modules have separate tables and separate ids, so
posting a legacy order's id to a commerce fulfilment route would address the wrong record.

The plan's premise — "modify `orderDetails.tsx`" — is therefore wrong, and the real work is a
commerce orders screen that does not exist yet. That is a feature in its own right, not part of
shipping settings. Until it exists, a COD order can be taken but not settled from the dashboard.

## Verification

- `npx vitest run` — **491 pass / 60 files**, 61 of them new across five files:
  `shippingDestinations.test.ts` (7), `shippingDraft.test.ts` (19), `ShippingMethodCard.test.tsx`
  (9), `RateOverrideEditor.test.tsx` (11), `ShippingSettings.test.tsx` (10),
  `settings/card/page.test.tsx` (5).
- `vitest.setup.ts` gained a no-op `ResizeObserver`. jsdom has none and Radix measures with it, so
  rendering the card settings page threw before any assertion ran. No existing test had hit it.
- `npx tsc --noEmit` — 206 errors, **byte-identical to the pre-change baseline**; zero in any
  touched file. (The baseline is pre-existing app-wide noise; `next build` uses
  `ignoreBuildErrors`.)
- `npx eslint` on every new file — clean.
- **Not yet verified in a browser.** No manual pass has been done against a running backend.


---

# 2026-08-28 — Redesign: one settlement mode per method

> Supersedes this doc's پس‌کرایه/COD UI. Paired Back doc: same date, same file name.

## Problem

The screen showed **two switches** — a پس‌کرایه toggle on each method, and a separate
پرداخت در محل toggle over on the bank-details page — because the API modelled them as independent
axes. They are not. They are three mutually exclusive answers to one question, so two switches let
a merchant turn on a combination that means nothing, and the shop-wide COD switch offered cash on
delivery for **every** method, including carriers that collect nothing.

## Solution

The two switches become **one radio group** — `prepaid` / `freight_collect` / `cash_on_delivery` —
because the modes are exclusive and a radio group is the control that says so. Each option carries
a one-line explanation of who pays what and when, since "پس‌کرایه" alone does not tell a merchant
that the buyer still prepays the goods.

Only `prepaid` charges a rate, so the price field, the free-shipping threshold and the whole
per-city exceptions editor are **hidden** under the other two, replaced by a sentence saying why.

`freeOverAmount` is now `null` vs a number rather than a boolean plus a number: turning the
free-shipping switch off writes `null` (never waived), not `0` (always free). Getting that
backwards would silently give away free shipping on every order.

`settings/card` keeps **only the ceiling**. The on/off control is gone from that page entirely —
whether a carrier collects at the door is a property of the carrier, and the bank-details form
cannot know it. Its hint now points at «تنظیمات ارسال پستی».

The known limitation this closes for free: a merchant who wants only cash on delivery no longer
needs bank details to enable it, because there is no longer anything to enable there.

## Changes

- `types/shipping.ts` — `CommerceShippingSettlement` replaces `CommerceShippingPricing`; kinds
  renamed `post_express`/`post_registered`.
- `utils/commerce/shippingDraft.ts` — the `postKerayeh`/`freeOverEnabled` booleans collapse into
  one `settlement` value plus a nullable `freeOverAmount`; `pricingOf` is gone, replaced by
  `chargesShipping`.
- `ShippingMethodCard.tsx` — radio group, mode-specific notes, rate section gated on `prepaid`.
  Each radio gets an explicit `aria-label`: the wrapping label also holds the explanation, so the
  accessible name would otherwise be the mode plus a sentence of prose.
- `settings/card/page.tsx` — COD toggle removed, ceiling kept.
- `messages/fa.json` / `messages/fa/ErrorCodes.json` — new settlement copy;
  `COMMERCE_SHIPPING_THRESHOLD_REQUIRED` dropped (the backend no longer raises it).

## Verification

- `npx vitest run` — **495 pass / 60 files**.
- `npx tsc --noEmit` — 204 errors, identical to baseline, zero in any touched file.
- **Still not verified in a browser.**

---

# 2026-08-29 — The method card opens only on the pencil

## Problem

A card's body was open whenever the method was **active** (`isActive || isForcedOpen`), and the
pencil existed only to reveal an *inactive* one. That was tolerable while a shop had one or two
hand-made methods. It stopped being tolerable the moment the backend started seeding **five**
methods into every workspace: «تنظیمات ارسال پستی» would open as a wall of forms, and the thing the
screen is actually for — seeing what the shop offers and switching methods on and off — was buried
under them.

## Solution

Every card starts **collapsed**, active or not, and opens only when the merchant clicks the pencil.
The header already answers the at-a-glance question on its own: name, carrier badge, and a summary
line carrying the price, the free-shipping threshold and the exception count (or «غیرفعال»,
«پس‌کرایه», «پرداخت در محل»).

One deliberate exception: a draft with `serverId === null` opens immediately. That is a method the
merchant just added, and leaving it collapsed would make «افزودن روش» look like it did nothing but
append a nameless row.

The pencil is now always visible and toggles both ways — pencil → ✕, `aria-expanded` following the
state, and a tinted background while open. It is **not** gated on `canEdit`: a read-only member
still needs to read what a method costs, and every control inside the body carries its own
`disabled`.

## Changes

- `ShippingMethodCard.tsx` — `isForcedOpen`/`isBodyOpen` become one `isEditing`, seeded from
  `draft.serverId === null`; the pencil button leaves its `!draft.isActive` guard and gains a close
  state.
- `messages/fa.json` — `editInactive` → `edit` («ویرایش روش ارسال»), plus `closeEditor`
  («بستن ویرایش»). The old key's name described a behaviour that no longer exists.
- `ShippingMethodCard.test.tsx` — a `renderOpenCard` helper (every body assertion now opens the card
  first, as a merchant does) and 5 new tests: an active card shows no form, the summary still says
  everything while closed, the pencil toggles both ways, a never-saved draft opens itself, and a
  read-only member can open but not edit.
- `ShippingSettings.test.tsx` — an `openCard(index)` helper; 7 tests reach fields inside a card.

## Verification

- `npx vitest run src/components/Commerce/Shipping` — **37 pass / 3 files** (was 32); the whole
  dashboard suite: **500 pass / 60 files**.
- `npx tsc --noEmit` — 204 errors, identical to baseline, zero in any touched file.
- **Still not verified in a browser.**
