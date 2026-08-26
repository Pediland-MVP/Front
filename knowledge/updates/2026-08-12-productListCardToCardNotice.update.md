# Product List Card-to-Card Notice (2026-08-12)

## Problem

`ProductListPage` (`/products`) only disabled the header "add product" button when the
merchant had no `cardToCard` payment method configured
(`disabled={error || !cardToCardData}`), with no explanation anywhere on the page. A
merchant landing on the page with a disabled button and no context had no way to know
why, or where to go fix it. Design explored via an interactive artifact mockup with two
candidate treatments (full-page takeover vs. banner + locked grid); user picked the
banner + locked grid option (existing products stay browsable, but nothing reads as
actionable).

## Solution

`apps/dashboard/src/components/Commerce/ProductList/ProductListPage.tsx`:

- Hoisted `canCreate = can('product:create')` (was inlined in the header button memo)
  and derived `hasCardToCard = Boolean(cardToCardData)` /
  `showCardToCardNotice = canCreate && !hasCardToCard`.
- When `showCardToCardNotice` is true, renders an amber banner above the grid — matches
  the approved artifact mockup, not the codebase's existing `ConnectInstagramAlert`/
  `Alert` pattern (stacked title+description block with a separate full-width button
  below), which was tried first and rejected as visually different from the mockup.
  Styled with the app's real (previously component-unused) warning tokens
  `border-wline`/`bg-wtint`/`text-wtext` from `globals.css`, not the `Alert` component's
  hardcoded `amber-*` `note` variant.
  - First revision was a thin single-row strip (icon + one flowing sentence + inline
    button) sitting above the grid.
  - User asked for it bigger, to fill the width of the product grid area with a
    stronger background — rebuilt as a standalone card above the grid (boxed icon
    badge, bold title + description paragraph, full-size CTA), but this was still a
    fixed-size card, not sized to the table.
  - User clarified further: the notice's *height* must equal the product table's own
    height, not an arbitrary card size. Final shape: the small "read-only" pill overlay
    that sat on top of the blurred grid was replaced by the notice itself — the whole
    icon+title+description+button panel now renders as `absolute inset-0` inside the
    same `relative` wrapper that holds the grid, so its bounding box is always exactly
    the grid's bounding box (opaque `bg-card` + `border-wline` panel, `bg-wtint` only on
    the circular icon badge for a color pop). The separate banner above the chips row
    was removed — there's only one notice now, and it lives where the table lives.
    `products.length === 0` case gets a `min-h-[280px]` floor on the wrapper so the
    notice still has a reasonable height even with nothing to overlay. The product grid
    itself gets `pointer-events-none opacity-40 blur-[2px]` while the panel is showing,
    so existing products stay visible for browsing but aren't reachable. Now-unused
    `Commerce.List.NoCardToCard.readOnly` key dropped from `fa.json` (superseded by the
    panel's own title/description).
- Header "add product" button logic unchanged in effect (`disabled={error ||
  !hasCardToCard}`), just reads from the hoisted `canCreate`/`hasCardToCard`.

`apps/dashboard/src/messages/fa.json` (`Commerce.List` namespace): added
`NoCardToCard.{title,description,action}`. `en.json` intentionally left untouched per
CLAUDE.md § 8 (fa.json first, en.json translated later).

## Stale-cache follow-up bug (same day)

**Problem:** after saving a card-to-card method on `/settings/card`, the notice above
kept showing on `/products` — saving didn't clear it without a hard page reload.
`settings/card/page.tsx`'s `onSubmit` POSTed to `/payments/cardToCard` but never called
SWR's `mutate` afterward. Both that page and `ProductListPage` hold their own
`useSWRImmutable('/payments/cardToCard')` (immutable = no revalidate-on-focus/reconnect),
so neither cache entry ever refreshed after the POST.

**Fix:** `apps/dashboard/src/app/(Console)/settings/card/page.tsx` — added
`import { mutate } from 'swr'` and `await mutate('/payments/cardToCard')` right after
`toast.success(...)` in the success branch, matching the existing convention already
used by `settings/zarinpal/page.tsx` (`mutate('/payments/methods')` in the same spot).
Exact-string key, `revalidate: true` (default) — refetches for every consumer sharing
that key, not just this page.

Per explicit instruction, the notice UI itself (`ProductListPage.tsx`) was **not**
touched for this fix — only the settings page's save handler.

## Changes

- `apps/dashboard/src/components/Commerce/ProductList/ProductListPage.tsx`
- `apps/dashboard/src/components/Commerce/ProductList/ProductListPage.test.tsx`
- `apps/dashboard/src/messages/fa.json`
- `apps/dashboard/src/app/(Console)/settings/card/page.tsx`

## Verification

`npx vitest run src/components/Commerce/ProductList/ProductListPage.test.tsx` — 17/17
pass (14 existing + 3 new: notice+lock shown when creatable and no card-to-card, notice
hidden once configured, notice hidden when the viewer lacks `product:create`). `fa.json`
validated as parseable JSON. The `settings/card/page.tsx` mutate fix has no existing test
file and was not run against a live API — not smoke-tested in a browser.
