# Dashboard — Removed Static Telegram/Instagram Banners, Repositioned Carousel — 2026-08-01

Full reference: `docs/superpowers/specs/2026-08-01-dashboard-banner-cleanup-design.md`.

## Problem

The dashboard home rendered two unrelated "banner" concepts:

1. `DashboardBannerCarousel` — the real, admin-managed banner system (see
   `2026-07-14-bannerCarousel.update.md`), rendered first on the page.
2. `DashboardTelegramBanner`/`DashboardInstagramBanner` — two hardcoded,
   non-admin-managed React components (fixed copy/URL/color, no DB backing,
   `fa`-only), rendered as a 2-column grid below `SubscriptionBoard` and
   `DashboardStats`.

The static pair couldn't be edited, disabled, or reordered without a code
deploy, and duplicated the same card shell twice for no functional reason.

## Solution

- Deleted `DashboardTelegramBanner.tsx` and `DashboardInstagramBanner.tsx`.
- In `page.tsx`, removed their imports and the `locale === 'fa'` grid block,
  and moved `<DashboardBannerCarousel />` down to the bottom of the page —
  the position the deleted grid occupied.
- New render order: `SubscriptionBoard` → `DashboardStats` →
  `DashboardBannerCarousel`.
- Removed the two dead commented-out export lines referencing the deleted
  files in `Dashboard/index.ts`.

No backend changes — the static components had no DB/API support to begin
with. The admin-managed `Banner`/`BannerButton` system is untouched.

## Changes

- `Front/apps/dashboard/src/app/(Console)/page.tsx`
- `Front/apps/dashboard/src/components/Console/Dashboard/DashboardTelegramBanner.tsx` (deleted)
- `Front/apps/dashboard/src/components/Console/Dashboard/DashboardInstagramBanner.tsx` (deleted)
- `Front/apps/dashboard/src/components/Console/Dashboard/index.ts`

## Verification

Grepped for remaining references to the deleted components across
`apps`/`packages` — none found outside the removed files. No tests exist for
these components. Build/typecheck not run per user's standing preference to
ask before running builds; recommend running `pnpm --filter front tsc --noEmit`
or a dev-server visual check before merging.
