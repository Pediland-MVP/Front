# 2026-09-02 — Automations pages: stop mobile scroll chaining

## Problem

On mobile, `/automations` and `/automations/:id` had two bugs once a user scrolled
to the end of the page content:

1. A purple/violet gradient div briefly slid up over the layout during the
   bottom-of-scroll rubber-band bounce, and the page felt "stuck".
2. On `/automations/:id`, scrolling back up from the bottom sometimes triggered
   Chrome's native pull-to-refresh, reloading the page.

## Root cause

`SidebarInset` (`packages/ui/src/components/ui/sidebar.tsx`) is the mobile scroll
container, and both routes nest a second independent scroller inside it
(`LayoutCard` for `/automations`, `LayoutPage` for `/automations/:id`) — a known
gap already noted in the 2026-08-14 `fix/settings-mobile-scroll` work. None of
the three set `overscroll-behavior`, so once the inner scroller ran out of
content, the swipe gesture chained all the way up to `body`: the browser's
native rubber-band bounce briefly exposed `SidebarWrapper`'s gradient background
sitting behind everything, and at the top of the page the same chained overscroll
is what Chrome's pull-to-refresh watches for.

## Solution

Added `overscroll-contain` to `SidebarInset`, `LayoutCard`, and `LayoutPage` —
the same pattern already used (and explained in its own comment) on
`SidebarContent` for the identical reason. This stops the swipe from ever
reaching `body`.

## Changes

- `packages/ui/src/components/ui/sidebar.tsx`: `SidebarInset` — `overscroll-contain`.
- `apps/dashboard/src/components/Layout/LayoutCard.tsx`: `overscroll-contain`.
- `apps/dashboard/src/components/Layout/LayoutPage.tsx`: `overscroll-contain`.

## Verification

- `pnpm --filter front exec tsc --noEmit`: no new errors in the 3 touched files
  (pre-existing repo-wide baseline errors elsewhere, unrelated).
- `vitest run` on `ConsoleSidebar.test.tsx` (11 tests) and the `/automations`
  `page.test.tsx` (2 tests): all pass.
- **Live mobile-viewport check skipped** on the user's instruction — worth a
  manual check on a real phone.
- Committed directly on `main` (commit `2be1b5bf`), per the user's explicit
  instruction — the main checkout had unrelated pending staged work from
  another session at the time, which was left untouched (only these 3 files
  were staged and committed).
- **Deployed to live prod 2026-09-02** (`ssh back`): full `git archive HEAD`
  (commit `2be1b5bf`, includes 5 other already-merged-but-previously-undeployed
  commits — admin finance-section MANAGER restriction, admin users-count metric,
  admin howFoundUs chart) shipped into `SourcesNew/Front` (prior tree backed up
  to `SourcesNew/Front.bak-20260902111747` before overwrite), `.deployed-commit`
  updated, then `frontcore.sh` rolling-rebuilt `front2-green` then `front1-green`
  (zero downtime, both healthy). Verified live: `overscroll-contain` present in
  the built CSS and SSR JS chunks on `front1-green`, `/automations`,
  `/automations/[id]`, and `/automations/welcome` all still present in the route
  manifest, `my.befroosh.app/automations` responds 307 (auth redirect, expected).
  Admin panel (`frontadmin1-green`) was not rebuilt — out of scope, already
  current from its own 2026-09-01 deploy.
