# Dashboard banner cleanup — design

Date: 2026-08-01

## Context

`Front/apps/dashboard/src/app/(Console)/page.tsx` renders two unrelated "banner"
concepts:

1. `DashboardBannerCarousel` — the real, admin-managed banner system (DB-backed
   `Banner`/`BannerButton` entities, CRUD in admin, served from
   `GET /banners/active`). Currently rendered first on the page.
2. `DashboardTelegramBanner` and `DashboardInstagramBanner` — two hardcoded,
   non-admin-managed React components (fixed copy/URL/color), rendered as a
   `fa`-only 2-column grid below `SubscriptionBoard` and `DashboardStats`.
   No backend support exists for these at all.

Confirmed via grep: these two components are referenced only from `page.tsx`
and from fully-commented-out export lines in
`Front/apps/dashboard/src/components/Console/Dashboard/index.ts`. No other
call sites, no i18n keys unique to them beyond their own component files, no
backend involvement.

## Change

Front-only, no backend changes.

- Delete `Front/apps/dashboard/src/components/Console/Dashboard/DashboardTelegramBanner.tsx`
  and `DashboardInstagramBanner.tsx`.
- In `page.tsx`: remove their imports, remove the `locale === 'fa'` grid block
  that rendered them, and move `<DashboardBannerCarousel />` down to the
  bottom of the page — the exact position the deleted grid occupied.
- New render order: `SubscriptionBoard` → `DashboardStats` →
  `DashboardBannerCarousel`.
- Remove the two dead commented-out export lines in
  `Dashboard/index.ts` that reference the files being deleted.

## Out of scope

- No change to the admin-managed `Banner`/`BannerButton` data model, admin
  CRUD, or the `/banners/active` endpoint.
- No new i18n keys (none introduced or removed beyond deleting the two
  component files, which held their own inline copy).
