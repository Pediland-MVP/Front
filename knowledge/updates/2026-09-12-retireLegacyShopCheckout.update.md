# Retire the legacy `(Shop)` web checkout — 2026-09-12

Full reference: `knowledge/front-back-relations.md` → "Shop checkout — RETIRED (2026-09-12) · Vitrin".
Back half: `Back/knowledge/updates/2026-09-12-retireLegacyShopCheckout.update.md`.

## Problem

A `PRODUCT` automation sent an Instagram card whose URL button opened
`${FRONT_URL}/:instagramUsername/:productId/order` — the `(Shop)` route group: a 37-file, ~2.4k-line
public checkout (buyer details, address, quantity, shipping, card-to-card receipt upload, Zarinpal
return) running on its own lead-cookie auth, outside `AuthProvider`.

Buying has moved into the Instagram DM (buy-in-direct). The web checkout was a second purchase path
nobody owns, and its existence forced odd shapes elsewhere — `api-client`'s opt-in session bootstrap
and two special cases in `proxy.ts` existed mainly for it.

## Solution

Delete the page and everything only it used; stop the automation form offering `PRODUCT`. Leave the
enum member and the render path alone so existing contents keep working until migration Phase 13
ports them.

## Changes

- **Deleted** `apps/dashboard/src/app/(Shop)/` (37 files) and `apps/dashboard/src/components/Shop/`
  (`CheckoutPage.tsx` + `index.ts`). `components/Shop` was imported only from inside `(Shop)`, so it
  died with it.
- **Deleted** `apps/dashboard/src/types/shops/` — `IShop` / `ShopNamespace` had zero remaining
  references. `types/order/*` was **kept**: those files look orphaned individually but
  `order.namespace.ts` re-exports them and has 6 importers, and they still serve the live legacy
  merchant orders screen.
- **Removed** the `Checkout` i18n namespace (47 leaf keys) from `fa.json` and `en.json`. Done as a
  **line-slice text edit, never a JSON round-trip** — per
  `2026-08-13-howFoundUs.update.md`, round-tripping a messages file through a parser silently
  collapsed a duplicate key here once and had to be reverted. Verified afterwards that exactly one
  top-level key disappeared from each file and both still parse.
- **`PRODUCT` removed from the automation form**:
  `packages/ui/src/automation-builder/Contents/ContentTypeOptions.tsx` — the option and its
  now-unused `ShoppingBagIcon` import. Gone in **both** builder modes. `Contents.tsx`'s filter needed
  no code change (it never had a PRODUCT branch); its stale "PRODUCT stays available in template
  mode" comment was corrected.
- **`proxy.ts` — behaviour deliberately unchanged**, comments rewritten to say why. Both the
  `/:shop/:product/order` pass-through and the `payments/verify` matcher exclusion are KEPT so a
  stale link 404s instead of redirecting the buyer to `/auth`.
- **`api-client.tsx`** — the opt-in session bootstrap stays; only its justifying comment was updated,
  since flipping it to global would change the boot sequence the bootstrap was added to fix.

## Verification

- `tsc --noEmit` (dashboard): **210 → 206** errors, and a set-level diff shows **zero new** errors —
  the four that disappeared were pre-existing ones inside the deleted `(Shop)` files.
- `vitest`: **965 dashboard tests pass** (99 files), **198 `packages/ui` tests pass** (20 files).
- Two `packages/ui` tests used `buttons.titles.product` as the control proving the template-mode
  filter is *selective*; repointed to `buttons.titles.text`, which is always offered.
- New test block `Contents — PRODUCT is no longer offered (legacy shop checkout retired)`: asserts
  PRODUCT is absent in both `automation` and `template` modes, and that `buy_in_direct` is still
  offered.

## Deploy coupling — read before shipping

Deploy-coupled with Back `chore/retire-legacy-shop-checkout`, and **order-dependent**: any content
still on the legacy `product` path after this ships has no purchase path at all. Run the
buy-in-direct flip and confirm `content_cycle_content WHERE type = 'product'` is empty first — see
the 2026-09-12 row in `before-prod-cutover.md`, and note the 28 all-draft automations the flip
deliberately leaves behind.
