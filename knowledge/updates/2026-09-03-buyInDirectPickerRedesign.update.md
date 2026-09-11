# 2026-09-03 — Buy-in-Direct product picker redesigned to match the «فروش» content type

Reference implementation: `packages/ui/src/automation-builder/Contents/ProductContent.tsx`
(+ `ProductContentItem.tsx`, `ProductContentItemDialog.tsx`) — the `PRODUCT` content type,
labelled «فروش» in `Automations.Contents.buttons.titles`.

## Problem

`BUY_IN_DIRECT` («خرید مستقیم») and `PRODUCT` («فروش») are neighbours in the same content-type
picker and do nearly the same job, but looked nothing alike. «فروش» is a grid of square cover
tiles with a modal picker; Buy-in-Direct was two stacked text sections — a vertical list of
thin rows above an always-open inline grid of small outline buttons with its own search box.
Same task, two unrelated visual languages.

## Solution

Rebuilt Buy-in-Direct on «فروش»'s layout, file-for-file:

| «فروش» | Buy-in-Direct (new) |
|---|---|
| `ProductContent.tsx` | `BuyInDirectContent.tsx` (rewritten) |
| `ProductContentItem.tsx` | `BuyInDirectContentItem.tsx` (new) |
| `ProductContentItemDialog.tsx` | `BuyInDirectContentItemDialog.tsx` (new) |

Same grid (`grid-cols-2 … lg:grid-cols-3`), same `aspect-square` tiles, same floating top bar
(drag handle from two tiles up, trash), same dark hover gradient revealing «تعویض», same flat
gray «انتخاب» add-tile, same `rectSortingStrategy` drag reorder, same cap of **10** with the
same limit message, and the same 3-column `h-56` picker dialog with title/price overlay and
infinite scroll.

## Decisions

Three points where the two content types genuinely differ; all three were put to the user.

1. **Cap: 10, exactly like «فروش».** Worth recording that this was *not* forced by the
   backend. The DM catalogue paginates — `DM_LIMITS.cardsPerPage = 9` plus a «موارد بیشتر»
   card (`Back/apps/core/src/instagramDm/dmCheckout.limits.ts`) — so it would happily serve
   more than ten. Ten is a deliberate parity choice with «فروش», not a platform limit.
2. **Search stays**, added to the dialog (which «فروش» has no equivalent of). A commerce
   catalogue is unbounded where the legacy product list is small, and
   `ReadCommerceProductsDto` already accepts `search`, so it is **server-side** now, not the
   old client-side filter over one 100-item fetch.
3. **The card-to-card warning stays** above the grid. «فروش» has no equivalent because it
   takes no payment; without a configured card-to-card method the DM checkout cannot collect
   money at all, so the banner is functional rather than decorative.

## The one implementation difference from «فروش»

`ProductContentComp` keeps a real empty `{}` row in its field array as the add-target, and
relies on the `products` → `productIds` remap to drop it before submit.

**Buy-in-Direct has no such remap** — form state *is* the backend DTO (`{ productId: string }[]`,
Task 5; `AutomationForm.tsx:280` only maps entity rows *in*, and nothing strips empties on the
way *out*). A placeholder row would therefore be POSTed verbatim and rejected. So the add tile
is a **virtual grid cell that is not a field-array entry**: no row exists until a real product
is chosen. Identical design, no phantom rows.

Two consequences worth knowing:

- The dialog is driven by an `editingIndex` (`null` = append, number = replace in place)
  rather than one dialog mounted per tile. While replacing tile N, tile N's own product stays
  selectable — only the *other* picks are greyed out.
- Tiles need `title`/`coverMediaUrl`, which form state does not carry. They resolve through
  `productById`, seeded from one `limit=100` fetch and then **augmented by whatever the dialog
  returns**, so a product picked from beyond the first 100 still paints correctly.

## Changes

- `Contents/BuyInDirectContent.tsx` — rewritten as the tile grid + single dialog host.
- `Contents/BuyInDirectContentItem.tsx` — new; the square tile. Guards `coverMediaUrl`
  (nullable on a commerce product — `next/image` throws on a null `src`, where the «فروش»
  tile can assume `images[0].url`) and an unresolved `product`. Carries a title caption the
  «فروش» tile does not: commerce covers are routinely near-identical, and a product with no
  media would otherwise be an anonymous grey square.
- `Contents/BuyInDirectContentItemDialog.tsx` — new; the picker. Server-side `search`
  (300 ms debounce), `PAGE_SIZE = 50` infinite scroll, skeletons on first load, already-picked
  products disabled. Paging stops on a short page rather than trusting `meta.totalPages`.
- `types/commerceProduct.ts` — `Item` gains `minPrice`/`maxPrice` (already returned by the
  list route; no backend change). Both nullable, so the price line is omitted when absent, and
  a variant product showing a range renders «از X تومان» rather than understating its floor.
- `Contents/index.ts` — exports the two new files, matching how `ProductContentItem`/`Dialog`
  are exported beside `ProductContent`.
- `messages/fa.json` — `Automations.Contents.BuyInDirect` reworked to mirror
  `…Contents.Product`: `select` / `change` / `cover_image_alt` / `limit` /
  `selection_required` plus a `Dialog` sub-namespace. The five keys the old two-section layout
  used (`pickedTitle`, `emptyHint`, `pickerTitle`, `searchPlaceholder`, `pickerEmpty`) are
  **removed** — checked for other references first; the only hits were an unrelated
  `TemplatePicker` React prop of the same name.

## Verification

- `packages/ui` whole suite: **16 files / 161 tests pass** (`BuyInDirectContent.test.tsx`
  9 → 15). The suite was rewritten around the modal — every add/replace path now opens the
  dialog first.
- New coverage: dialog fetch params, tile order, add-through-dialog, replace-in-place,
  the replaced tile staying selectable, remove, already-picked disabled, the cap hiding the
  add tile and showing `limit`, the add tile present below the cap, a cover-less product
  rendering without crashing, the drag handle appearing only from two tiles up, and reorder.
- **Mutation-proven**, not just green: changing `MAX_PRODUCTS` 10 → 11 fails exactly one test;
  making the dialog always append instead of replacing in place fails exactly one test. Both
  times the other 14 still pass.
- eslint **0 errors**. One warning on `types/commerceProduct.ts` (`no-namespace`) is
  pre-existing — that file already declared a namespace.
- `tsc --noEmit` on `apps/dashboard`: **204 → 206**. Both new errors are
  `TS2307 Cannot find module 'next/image'`, the accepted `packages/ui` pattern — the package
  deliberately does not depend on `next` (see `vitest.config.ts`'s alias comment), the app
  resolves it at build time, and `next.config.mjs` sets `ignoreBuildErrors: true`. Ten files
  already carry the identical error, **including both «فروش» reference files**
  (`ProductContentItem.tsx`, `ProductContentItemDialog.tsx`). Matching «فروش» exactly means
  inheriting it; the alternative was a plain `<img>` and the `no-img-element` warning instead.

## Not verified

Not opened in a browser. The tests cover behaviour and structure, not that the hover gradient,
tile aspect or dialog sizing actually look right in RTL at each breakpoint.
