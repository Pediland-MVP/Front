# Banner Carousel — 2026-07-14

Full reference: `docs/superpowers/specs/2026-07-14-banner-carousel-design.md`, `Back/knowledge/banners/banners.doc.md`.

## Problem

The dashboard home page showed one hardcoded, credit-based help banner with no admin control and no way to target content by workspace label.

## Solution

New admin section (`/banners`) for full CRUD, modeled on the `workspace-categories` page. Dashboard home page now renders a `StableCarousel` of banners fetched from `GET /banners/active`, shuffled once per page load and auto-advancing every 5s.

## Changes

- New admin page `apps/admin/src/app/(main)/banners/` (list, search, create/edit dialog with buttons field array and category multi-select, delete).
- New sidebar nav entry ("بنرها").
- New dashboard hook `apps/dashboard/src/hooks/useActiveBanners.ts` and component `apps/dashboard/src/components/Console/Dashboard/DashboardBannerCarousel.tsx`, replacing `DashboardHelpBanner.tsx` (deleted) in `app/(Console)/page.tsx`.
- New `ERROR_CODES` keys (`BANNER_NOT_FOUND`, `BANNER_CATEGORY_NOT_FOUND`) and a `Banners` translation namespace in admin's `fa.json`; the dead `DashboardHelpBanner` key removed from dashboard's `fa.json`.

## Verification

Manual/e2e smoke (see the design spec's Testing section): global vs. label-specific banner visibility, null-category workspace sees only global banners, inactive toggle takes effect immediately (active cache invalidation), carousel shuffles/auto-advances, internal vs. external button links behave correctly.
