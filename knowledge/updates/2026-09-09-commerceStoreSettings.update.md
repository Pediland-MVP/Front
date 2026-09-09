# 2026-09-09 — Commerce store settings (default final message)

**Related doc:** `Back/knowledge/updates/2026-09-09-commerceStoreSettings.update.md` (entity,
migration, `commerce/settings` endpoints, backend digital-required validation).

## Problem

Every commerce product has a "پیام نهایی" (final message) — sent to the buyer when their order
completes. Physical sellers were retyping the same thank-you text on every product, or leaving it
blank. Digital sellers, whose message is usually product-specific (a download link, an unlock
code), could still save a product with no message at all.

## Solution

- New page `/products/settings` ("تنظیمات فروشگاه"), sibling of `/products/shipping` under
  "کالا و خدمات" — a single-field form for the workspace's default final message
  (`components/Commerce/StoreSettings/StoreSettings.tsx`, backed by `useStoreSettings`).
- Product editor, **create mode only**: a new physical product's `finalMessage` is prefilled from
  this default the moment the store settings finish loading (`ProductEditorPage`'s seeding effect,
  same shape as the existing collection-membership seed). It is a one-time snapshot — editable,
  clearable, and never re-applied later, even if the workspace default changes mid-session.
  `FinalMessageSection` shows a hint + a link back to the settings page whenever the field was
  prefilled this way.
- `buildProductEditorSchema`'s `finalMessage` is now required (`.superRefine`) whenever
  `kind === 'digital'` — mirrors the backend's `@ValidateIf` on `CreateCommerceProductDto`.
  Physical stays optional, unchanged.

## Changes

- `hooks/useStoreSettings.ts` (new) — GET/PUT `/commerce/settings`
- `types/commerce.ts` — `CommerceStoreSettings`
- `components/Commerce/StoreSettings/StoreSettings.tsx` (new)
- `app/(Console)/products/settings/page.tsx` (new)
- `components/Layout/ConsoleSidebar.tsx` — new "تنظیمات فروشگاه" nav entry
- `components/Commerce/ProductEditor/productEditor.schema.ts` — digital-required `finalMessage`
- `components/Commerce/ProductEditor/ProductEditorPage.tsx` — default-prefill seeding effect
  (create mode, physical kind, once settled)
- `components/Commerce/ProductEditor/sections/FinalMessageSection.tsx` — `showDefaultHint` prop,
  digital-required hint
- `messages/fa.json` (`Commerce.StoreSettings`, `Commerce.Editor.FinalMessage.*`,
  `Commerce.Editor.Validation.finalMessageRequiredDigital`), `messages/fa/Console.json`
  (`productsStoreSettings`)

No breadcrumb-map change: `/products/settings`'s last segment (`settings`) already resolves to the
existing generic `Breadcrumbs.settings` key.

## Verification

- New/updated tests: `useStoreSettings` (covered via `StoreSettings.test.tsx`'s mock),
  `StoreSettings.test.tsx`, `FinalMessageSection.test.tsx` (default-prefill + digital-required
  hints), `productEditor.schema.test.ts` (digital-required cases, including the pre-existing
  "accepts either kind" case that needed a `finalMessage` added), `ProductEditorPage.test.tsx`
  (4 new cases: prefill, no-prefill-while-loading, no-default blank, no-prefill-on-edit).
- `pnpm --filter front exec tsc --noEmit` — zero new errors in touched files (checked against the
  pre-existing baseline noise).
- `npx vitest run src/components/Commerce` — 48 files / 583 tests pass.
- `npx eslint` / `npx prettier --check` on every touched file — clean.
