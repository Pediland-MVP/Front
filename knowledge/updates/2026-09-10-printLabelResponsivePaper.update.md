# 2026-09-10 — برچسب (shipping label) print: responsive to any paper size

Full reference for the print feature this changes:
[`2026-09-09-orderPrintDocumentsCommerce.update.md`](./2026-09-09-orderPrintDocumentsCommerce.update.md)

## Problem

`buildLabelDocument` was written for exactly one sheet: `@page { size: A5 portrait }` plus a
hard-coded `.lbl { height: 190mm }` (A5 minus its two 10mm margins) and every font, logo and
column width frozen in millimetres.

That is fine on A5 and wrong everywhere else, and A5 is *not* what most sellers have loaded:

- **Pinned paper.** `size: A5 portrait` tells the browser which sheet to use, so a seller with A4
  in the tray or a 100×150 thermal roll on the desk cannot simply pick it in the print dialog.
- **On a bigger sheet** the whole label sits in one corner at A5 scale, with the footer floating
  in the middle of the page (`margin-top: auto` against a 190mm box, not against the paper).
- **On a smaller sheet** the 190mm box does not fit at all and the footer spills onto a second
  sheet — on a thermal roll that is a wasted label every time.
- **Landscape** was never considered: three full-width bands stacked down a 100mm-tall page
  overflow, and on A4 landscape a five-field address stretches across 270mm.

## Solution

`@page { size: auto }` — the label commits to no paper, so the print dialog's paper selector is
live and whatever the seller picks is what the CSS lays out against.

**Media queries work on print paper.** In print the media-query viewport *is* the page box, so
`@media (max-width: 120mm)` matches the sheet the user chose, not the screen. That is the whole
reason `size: auto` is worth having: pinning `A5 portrait` would force every query to one answer.

Three mechanisms carry the layout:

1. **Tokens.** Every dimension (`--pad`, `--gap`, `--fs`, `--logo`, `--brand-col`, …) is a custom
   property on `:root`. A paper bucket re-tunes the whole label by overriding a dozen values
   instead of restating the layout once per size. The base values ARE the old A5 numbers, and at
   148×210 with `--pad: 10mm` the old `height: 190mm` and the new `height: 100%` are the same
   number — **A5 portrait output is byte-for-byte the layout it always was.**
2. **The receiver band absorbs the slack.** `.lbl-mid { flex: 1 }` instead of
   `.lbl-foot { margin-top: auto }`, so a taller sheet grows the courier's sticker area rather
   than opening a dead gap above the footer.
3. **Landscape splits the width.** `@media (orientation: landscape)` turns the three stacked bands
   into a two-column grid — sender right, receiver left, footer spanning — with the brand block
   and the sticker area dropping *below* their own party instead of beside it. This halves the
   height the label needs (which is what makes a 150×100 roll fit) and stops A4 landscape
   stretching one address across the full sheet.

### The buckets

| Query | Catches | Effect |
|---|---|---|
| `max-width: 120mm` | 100×150 thermal P, A6 P | ~20% smaller type, 12mm logo, 4mm margins |
| `min-width: 180mm` **and** `min-height: 180mm` | A4 P/L, Letter P/L | ~30% larger type, 24mm logo, 14mm margins |
| `orientation: landscape` | every landscape sheet | two-column, brand/sticker below |
| `orientation: landscape` + `max-width: 240mm` | all landscape except A4 L | address fields go one-per-row |
| `max-height: 130mm` | 150×100 thermal L, A6 L | compact; **last in the file on purpose** — on a short sheet height is the binding constraint, so this overrides whatever width bucket already matched |

`documentShell()`'s `page` parameter gained `'auto'` alongside `'A5' | 'A4'`. `'auto'` also means
zero `@page` margin, because a document that sizes itself to the paper has to own its edge
spacing too — a fixed 10mm margin eats a third of a thermal label and barely shows on A4. **The
invoice is untouched and still pinned to A4 portrait.**

## Changes

- `apps/dashboard/src/components/Commerce/Orders/print/buildLabelDocument.ts` — `LABEL_CSS`
  rewritten as tokens + five buckets; `documentShell(body, 'auto', …)`.
- `apps/dashboard/src/components/Commerce/Orders/print/documentStyles.ts` — `documentShell()`
  accepts `'auto'`; margin now keyed off `A4` rather than "not A5".
- `apps/dashboard/src/components/Commerce/Orders/print/buildLabelDocument.test.ts` — the
  `size: A5 portrait` assertion is now `size: auto` + "no hard-coded page height" + a bucket check.

Nothing outside `print/` changed. No new i18n keys, no UI change, no backend change — the seller
picks the paper in the browser's own print dialog, where they already were.

## Verification

- `vitest run src/components/Commerce/Orders/print/` — 37 pass (16 label, 21 invoice).
- `tsc --noEmit` — 0 errors in `Orders/print/`. (App-wide errors are the pre-existing
  `@hookform/resolvers` zod skew and e2e/playwright noise, untouched by this change.)
- **Rendered to real PDF in Chromium** (Playwright `page.pdf()` at each paper size, two fixtures:
  a normal order and one with a 100-character address, a 28-character recipient name and a long
  shipping-method title), then **page-counted straight out of the PDF** — more than one page means
  it overflowed:

  | Sheet | Portrait | Landscape |
  |---|---|---|
  | 100×150 thermal | 1 page ✅ | 1 page ✅ |
  | A6 (105×148) | 1 page ✅ | 1 page ✅ |
  | A5 (148×210) | 1 page ✅ | 1 page ✅ |
  | A4 (210×297) | 1 page ✅ | 1 page ✅ |
  | Letter (216×279) | 1 page ✅ | 1 page ✅ |

  Both fixtures, all ten combinations. Four of them (thermal P, A5 P, A6 L long, A4 L long) were
  also rasterised and looked at, not just counted.

- **This is how the A5-landscape bug was caught.** The large bucket started as `min-width: 180mm`
  alone. A5 landscape is 210mm wide but only 148mm tall, so it took the A4 treatment — 4.4mm type
  and 14mm margins on a 148mm sheet — and pushed the footer onto a second page. Reading the CSS
  did not show it; printing it and counting pages did. Hence `and (min-height: 180mm)`: scale up
  only when the sheet is big in **both** directions.

### Known limits

- **A7 (74×105) overflows to two pages.** Two full postal addresses plus a sticker area do not fit
  legibly on a business-card-sized sheet, and no seller ships on one — deliberately not chased.
- **Still not printed on paper.** Everything above is Chromium's own print engine via PDF, which
  is exactly what the feature uses (`window.print()` → print-to-PDF), but no one has put a real
  sheet through a real printer, and Firefox/Safari print engines were not exercised.
