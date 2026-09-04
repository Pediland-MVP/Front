# 2026-09-04 — Orders page visual refactor (`/products/orders`)

Full reference for the screen itself: `knowledge/updates/2026-09-02-buyInDirectPhase3b.update.md`.
This doc covers only the presentation pass on top of it; no data, URL-filter or transition logic
changed.

## Problem

`/products/orders` shipped in phase 3b as a working but visually unfinished screen. Next to
`/products` — one click away, same «کالا و خدمات» group — it read as a different application:

- `OrderCard` was a bare `rounded-lg border p-3` `<button>`: no `Card`, no `bg-card`, no shadow, no
  product image. Flat and washed out against `LayoutCard`'s white gradient.
- One full-width row per order at **every** breakpoint. `/products` and the legacy `/orders` both
  use a responsive grid, so a desktop seller got one sparse 1400px row per order.
- **No loading state at all.** The empty state is guarded on `!isLoading` and there was no loading
  branch, so the panel was simply blank for the whole first fetch.
- The error state was a bare centred `<div>` of text, where every sibling screen renders
  `NoDataError`.
- `LayoutCard` owned the scroll on **every** size, so on desktop the filter bar and the pager
  scrolled away with the grid.
- The filter row was phone-hostile: two `w-32` date inputs crowding the search box, and X clear
  buttons that **mounted and unmounted**, shifting the whole row sideways when a date was set.
- Six status chips wrapped to three lines on a phone.
- `OrderStatusBadge` was the last hardcoded light-only surface on the screen (`bg-amber-100`),
  unreadable against the dark palette `globals.css` defines.

## Solution

Three fixed bands with only the middle one scrolling, and a card that matches its neighbour grid.

**Scroll ownership — desktop only, on purpose.**
`app/(Console)/products/orders/page.tsx` passes **`md:overflow-hidden`** to `LayoutCard`.
`OrdersListPage` becomes `flex flex-col gap-3 md:h-full md:min-h-0` with a `shrink-0` filter header,
a `min-h-[280px] md:min-h-0 md:flex-1 md:overflow-y-auto` list band, and a `shrink-0` pager.
`md:min-h-0` on both the root and the list band is load-bearing: without it a flex child will not
shrink below its content height and the whole column overflows again, restoring the original bug.

The `md:` prefix is not caution, it is a constraint from `packages/ui`'s `SidebarInset`, which is
`overflow-y-auto` below `md` and only `md:overflow-hidden` — its own comment states that mobile is
meant to scroll at the inset level so pages without their own scroll container still reach all their
content. Pinning both bands on a phone would leave roughly **one card** visible between a ~200px
filter header and the pager on a short screen, so below `md` every band is a plain block and the
page scrolls as a whole. `min-h-[280px]` on the list band exists for that mode only: the loader, the
empty state and `NoDataError` all centre with `h-full`, which against an auto-height parent collapses
to content height and crams them against the filter bar.

`LayoutCard` keeps its base `overflow-y-auto` — tailwind-merge treats a `md:` utility as a separate
group from the unprefixed one, so only the desktop value is replaced, not both.

**`OrderCard`** is rebuilt on `Card` with `CommerceProductCard`'s exact skin
(`border-violet-200 shadow-violet-200`, 4:3 media, `p-0` content) — a `<button>` wrapper keeps it
keyboard-reachable, which the flat version already got right. Shows the first line's image (plain
`<img>` + a `PackageIcon`/`FileDigitIcon` fallback tile, same as the product card), the status badge
over the media in the slot that card uses for its stock warning, the line title with a `+N` chip
when the order has more products than the one shown, recipient, Jalali placed date + item count, and
the total. Grid is `md:2 lg:3 2xl:4`, matching legacy `/orders`.

`+N` counts **distinct lines**, not `itemCount` (which sums quantity) — 3× the same shirt is one
line and correctly shows no chip.

**States.** `isLoading` → `LoaderSpin`; `error` → `NoDataError`. The error branch still comes
first, and now beats the loading branch too: SWR keeps `isLoading` true on a retry that has already
failed once, and a spinner that never resolves reads as a hang rather than a failure.

**`NoDataError` gained an optional `message` prop** (defaulting to `ERROR_CODES.FETCH_DATA`, so all
seven existing call sites are unchanged) so the orders screen keeps its specific
«دریافت سفارش‌ها انجام نشد» copy while getting the shared visual treatment.

**Filter bar.** Search is full-width under `sm`, `max-w-xs` above. The two pickers moved into a new
module-level `DateFilterCell` — `grid grid-cols-2` on a phone, natural width from `sm` up. Its clear
button keeps its slot with `invisible` (plus `aria-hidden` / `tabIndex={-1}`) instead of
unmounting, which is what removes the sideways jump. Status chips scroll horizontally in one row
below `sm` and wrap normally above it. A clear-all control now sits in the bar whenever a filter is
active — previously the only reset lived in the *empty* state, so a filtered list that **did** match
something had no way back except unsetting each control one at a time.

**`OrderStatusBadge`** gained a `dark:` pair per status (translucent `/15` tint, not a second opaque
colour) and an optional `className` so the card can position it without another wrapper element.

The load-bearing comment about never importing `packages/ui`'s `DatePicker` (its module body calls
`dayjs.calendar('jalali')` globally) is preserved verbatim, as are `filtersFromParams`,
`dateFromIso`, `isoFromDate` and their exported signatures.

## Changes

| File | Change |
|---|---|
| `apps/dashboard/src/app/(Console)/products/orders/page.tsx` | `md:overflow-hidden` on `LayoutCard` to hand desktop scrolling to the list band |
| `apps/dashboard/src/components/Commerce/Orders/OrdersListPage.tsx` | 3-band layout (pinned from `md`, natural page scroll below), `LoaderSpin`/`NoDataError` states, responsive filter bar, `DateFilterCell`, clear-all control |
| `apps/dashboard/src/components/Commerce/Orders/OrderCard.tsx` | Rebuilt as a `Card` grid card with media, `+N` chip, `memo` |
| `apps/dashboard/src/components/Commerce/Orders/OrderStatusBadge.tsx` | `dark:` variants + optional `className` |
| `apps/dashboard/src/components/Global/NoDataError.tsx` | Optional `message` prop (additive; 7 existing call sites unchanged) |
| `apps/dashboard/src/messages/fa.json` | New `Commerce.Orders.card.more` and `card.tooman` (fa only, per CLAUDE.md §8) |
| `…/OrderCard.test.tsx`, `…/OrdersListPage.test.tsx` | +7 tests (line title, `+N` present/absent, spinner, error-beats-spinner, clear-all shown/hidden) |

Untouched: `OrderDetail`, `OrderDetailPage`, `OrderActions`, `orderTransitions`, the dialogs,
`OrdersExportDrawer`, the legacy `/orders` screen, and everything under `packages/`.

## Verification

- `vitest run src/components/Commerce/` — **393 tests / 35 files pass**, including the two orders
  suites at 23 tests (16 + 7).
- The 4 new behavioural tests were written first and confirmed red before the implementation; the
  clear-all test seeds a **non-empty** order list on purpose, because with `orders: []` the empty
  state's own clear button would satisfy it and it would pass against the old code.
- `tsc --noEmit` — zero errors in any touched file (the app-wide pre-existing baseline is unchanged).
- `eslint` — 0 errors. One `@next/next/no-img-element` warning on the new `<img>`, matching the three
  pre-existing ones in the same folder and `CommerceProductCard`'s own.
- `prettier --check` — clean.
- **Not yet verified in a browser.**
