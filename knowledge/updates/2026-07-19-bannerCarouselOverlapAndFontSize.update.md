# Banner Carousel — Nav-Button Overlap & Length-Based Font Size — 2026-07-19

Full reference: `knowledge/updates/2026-07-19-bannerCarouselRtlFix.update.md`.

## Problem

Two follow-up UX issues on the same dashboard-home carousel:

1. The `StableCarouselPrevious`/`StableCarouselNext` buttons (added in the RTL fix) sit absolutely
   positioned over the card's edges with no reserved space, so a long title, description, or the
   banner's own action-button row could render directly underneath them.
2. Title/description used one fixed Tailwind text-size class regardless of content length. A long
   admin-authored title/description wraps onto many lines at that size, making that one slide much
   taller than the others — since every slide in the carousel's flex track stretches to match the
   tallest one (default `align-items: stretch`), a single long banner inflated the whole carousel's
   height for every other banner too.

## Solution

`DashboardBannerCarousel.tsx`:

- `BannerSlide` now reads `totalItems` from `useStableCarousel()` and switches `CardContent` to a
  wider inline gutter (`ps-11 pe-11 md:ps-13 md:pe-13`) whenever nav buttons are actually rendered
  (2+ banners) — matches the buttons' footprint (`start-2`/`end-2` offset + `size-8` button).
- New `fluidTextSizeClass(length, tiers)` picks from 3 character-count tiers per field (title,
  description — different thresholds since descriptions run longer), replacing the single fixed
  size class. Longer text gets a smaller size, keeping line count — and so slide height — closer
  across whatever banners happen to be shuffled in, instead of one long banner ballooning every
  slide's height.

## Changes

- `Front/apps/dashboard/src/components/Console/Dashboard/DashboardBannerCarousel.tsx` only.

## Verification

`tsc --noEmit` on `apps/dashboard`: no new errors from this change (pre-existing app-wide baseline
noise unrelated to this file, confirmed by filtering the output for this file's path). Verified via
an interactive before/after reproduction (Artifact preview) cycling short/medium/long sample
banners. Live in-app check pending — user to verify visually.
