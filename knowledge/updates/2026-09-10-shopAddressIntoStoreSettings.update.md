# 2026-09-10 — Shop address moved into the store settings page

Full reference: `knowledge/front-back-relations.md` (`ShopAddressSettings.tsx` row), knowledgeMap
row below. No backend change — Front-only page/navigation restructuring.

## Problem

"آدرس فروشگاه" (return address) and "تنظیمات فروشگاه" (default final message) were two separate
pages (`/products/shop`, `/products/settings`) with two separate sidebar items under "کالا و
خدمات", even though both are one-row-per-workspace commerce settings a merchant only visits
occasionally. Requested: put them on the same page.

## Solution

- `/products/settings/page.tsx` now renders BOTH `ShopAddressSettings` and `StoreSettings` as two
  `<section>`s, each with its own visible `<h2>` title (the page's own `<h1>` stays `sr-only`,
  matching the existing convention — the visible page name comes from the breadcrumb). The two
  components are untouched and still fully independent: separate fetch/save hooks
  (`useShopAddress` / `useStoreSettings`), separate permission gates (`order:manage` vs
  `product:edit`), separate forms. This is presentation-only composition, not a merged form.
- `/products/shop/page.tsx` is now a plain server-component redirect to `/products/settings`
  (same pattern as `/settings/page.tsx`), not deleted outright — an old bookmark/link still lands
  somewhere useful instead of 404ing.
- `ConsoleSidebar.tsx` drops the separate "آدرس فروشگاه" (`productsShop`) sub-item; "تنظیمات
  فروشگاه" (`productsStoreSettings`) is now the only nav entry for both. The now-unused
  `Sidebar.productsShop` key was removed from `messages/fa/Console.json`.

## Changes

- `apps/dashboard/src/app/(Console)/products/settings/page.tsx` — renders both sections
- `apps/dashboard/src/app/(Console)/products/shop/page.tsx` — now `redirect('/products/settings')`
- `apps/dashboard/src/components/Layout/ConsoleSidebar.tsx` — removed the `productsShop` item
- `apps/dashboard/src/messages/fa/Console.json` — removed the now-dead `productsShop` key

## Verification

- `ShopAddressSettings.test.tsx` (8), `StoreSettings.test.tsx` (6), `ConsoleSidebar.test.tsx` (8)
  all still pass unchanged — both components and the sidebar generator were not touched, only page
  composition and the nav item list. No page-level test exists for `/products/settings` or
  `/products/shop` to update.
- `pnpm --filter front exec tsc --noEmit` — zero new errors.
- Verified live in the browser: `/products/settings` renders both sections with real data (address
  + saved default final message); `/products/shop` redirects to it; sidebar shows one "تنظیمات
  فروشگاه" item.
