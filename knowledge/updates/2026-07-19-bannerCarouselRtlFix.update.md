# Banner Carousel — RTL Navigation Fix — 2026-07-19

Full reference: `knowledge/updates/2026-07-14-bannerCarousel.update.md`.

## Problem

On the dashboard home page (Persian locale, `dir="rtl"`), the banner carousel only ever showed
the first banner. Advancing (autoplay or dots) to slide 2/3 revealed empty space instead of the
next banner. The carousel also had no previous/next buttons.

## Root cause

`StableCarouselContent` (`packages/ui/src/components/ui/stable-carousel.tsx`) is a plain flex
row with `transform: translateX(-index * 100%)`. Per the CSS Flexbox spec, a `row` main axis
follows the ambient `direction` — under `dir="rtl"` (the app's default, since dashboard locale is
Persian-first) the first slide already fills the viewport by coincidence (it's exactly the
container's width), but the fixed `-index * 100%` shift moves the track further in the *wrong*
physical direction for slide 2+, since RTL lays subsequent flex children out to the left instead
of the right.

## Solution

`StableCarousel` now detects the resolved text direction (`getComputedStyle(container).direction`)
and exposes `isRtl` via `useStableCarousel()`. `StableCarouselContent` flips the translate sign
for RTL so the track always shifts toward the slide that's actually there. Also added
`StableCarouselPrevious`/`StableCarouselNext` nav buttons (logical `start-2`/`end-2` positioning,
`rtl:rotate-180` chevrons, self-hide under 2 slides — matching the existing dots' threshold).

## Changes

- `Front/packages/ui/src/components/ui/stable-carousel.tsx` — RTL-aware translate sign; new
  `StableCarouselPrevious`/`StableCarouselNext` exports.
- `Front/apps/dashboard/src/components/Console/Dashboard/DashboardBannerCarousel.tsx` — wired the
  new prev/next buttons alongside the existing dots.

## Verification

TypeScript typecheck of `packages/ui` shows no new errors from this change (pre-existing,
unrelated `@types/react` resolution errors when running bare `tsc` outside the Next.js build
pipeline affect every file in the package, not just this one). Manually verified via an
interactive side-by-side reproduction of the old vs. new transform math in both `dir="rtl"` and
`dir="ltr"`. Live in-app smoke test in a running dev server still pending — user to verify
visually.
