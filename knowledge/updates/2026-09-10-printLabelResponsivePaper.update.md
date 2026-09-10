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

1. **Two scale units, and everything is a multiple of one of them.** `--su` (space) is
   `calc(100vmin / 148)` — pure proportion, no floor, no ceiling. `--tu` (type) is
   `max(0.82mm, 100vmin / 148)` — the same proportion with a legibility floor. 148 is A5
   portrait's short edge, so both are *exactly* 1mm there and every multiplier in the file is
   literally the millimetre number the label used to hard-code.
2. **The receiver band absorbs the slack.** `.lbl-mid { flex: 1 }` instead of
   `.lbl-foot { margin-top: auto }`, so a taller sheet grows the courier's sticker area rather
   than opening a dead gap above the footer.
3. **Landscape splits the width.** `@media (orientation: landscape)` turns the three stacked bands
   into a two-column grid — sender right, receiver left, footer spanning — with the brand block
   and the sticker area dropping *below* their own party instead of beside it. This halves the
   height the label needs (which is what makes a 150×100 roll fit) and stops A4 landscape
   stretching one address across the full sheet.

### Why not size buckets — the A3-and-up failure

The first version of this used five width/height media-query buckets. It was wrong upward, and
visibly so: **A3, A2, A1 and A0 all matched the same `min-width: 180mm` rule**, so an A0 sheet got
A4-sized type — a small label marooned in the middle of a sheet sixteen times its area. Buckets
step; they do not scale.

Scale is now continuous and structure alone is by breakpoint. Measured body type, one Chromium
render per sheet:

| Sheet | short edge | body type |
|---|---|---|
| 100×150 thermal / A7 / A6 | 74–105mm | 2.79mm ← floor holding |
| A5 | 148mm | **3.40mm** ← the original, unchanged |
| A4 | 210mm | 4.83mm |
| Letter | 216mm | 4.96mm |
| A3 | 297mm | 6.83mm |
| A2 | 420mm | 9.65mm |
| A1 | 594mm | 13.65mm |
| A0 | 841mm | 19.32mm |

Each A-step is √2 from the last, which is what "the same design, photographically resized" means.
Below A6 the `--tu` floor deliberately breaks proportion the other way: a courier reads a thermal
label from the same distance as an A4 one, so type is the one thing that must not keep shrinking.
That is also why the `max-height: 130mm` query tightens leading — it pays for the floor holding
type above its proportional size on a short sheet.

**The floor is also the failure mode.** The label prints inside a hidden 0×0 iframe. If a browser
ever resolved `vmin` against that iframe instead of the page box, `max()` still yields 0.82mm and
the label prints small-but-correct instead of collapsing to zero-height text. Chromium resolves it
against the page box (measured below); the floor means we do not have to bet on it.

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

- `vitest run src/components/Commerce/Orders/print/` — 38 pass (17 label, 21 invoice).
- `tsc --noEmit` — 0 errors in `Orders/print/`. (App-wide errors are the pre-existing
  `@hookform/resolvers` zod skew and e2e/playwright noise, untouched by this change.)
- **Rendered to real PDF in Chromium** (Playwright `page.pdf()`, two fixtures: a normal order and
  one with a 100-character address, a 28-character recipient name and a long shipping-method
  title), then **page-counted straight out of the PDF** — more than one page means it overflowed.
  100×150 thermal, A7, A6, A5, A4, Letter, A3, A2, A1, A0 — **portrait and landscape, both
  fixtures: all one page** (except A7, see Known limits).
- Body type was **measured** on each sheet in the same pass (the table under "Why not size
  buckets"), which is what proves `vmin` resolves against the page box and not the iframe.
- A5 portrait was **pixel-diffed against a render from before this change**: every box and every
  baseline lands identically. The only difference is antialiasing halo from a **−0.066%** scale
  deviation, because the browser rounds the page box to whole CSS pixels (148mm → 559px, not
  559.37px). That is 0.007mm on a 10mm margin. Measured, not assumed — the label is *not*
  bit-identical at A5, it is geometrically identical to within that rounding.
- A0 portrait and A3 landscape were rasterised and looked at, not just counted, to confirm the
  design is proportionally the same at 8× the linear size.

- **Two bugs this method caught that reading the CSS did not.** (1) The original large bucket was
  `min-width: 180mm` alone; A5 landscape is 210mm wide but only 148mm tall, took the A4 treatment
  and pushed the footer onto a second page. (2) The bucket approach itself — A3/A2/A1/A0 all
  matching one rule — only became obvious once type size was measured per sheet rather than eyeballed
  at A4 and below.

### Deployed to back2 test (2026-09-10)

Front-only change, so **only `front-test` was rebuilt** — `back-test`, `back-admin-test` and
`front-admin-test` were left running and untouched (no `sync-deploy-all.sh`, which would have
rebuilt all four for nothing on a RAM-tight box).

- Synced by `rsync` into `SourcesTest/Front` (that box's Front checkout is rsync-fed, not
  git-push-fed). A dry run first showed the transfer set was exactly this commit's files and
  nothing else. **Gotcha worth remembering:** in a git *worktree* `.git` is a FILE, not a
  directory, so an `--exclude '.git/'` (trailing slash) does not match it and `rsync --delete`
  will happily delete the server's entire `.git` directory. Caught by the dry run.
- Stopped `front-test`, built the image alone in a detached `screen` (`EXIT_CODE:0`), then brought
  it up — the build discipline in the box's own `/root/CLAUDE.md` §2.1.
- Verified by hand, not by the script's say-so: `127.0.0.1:42001` → HTTP 307, and through the LB
  with `Host: beftest-xtest-1059.befroosh.app` → HTTP 307.
- **Proved the new CSS is in the shipped bundle**, not just that the container restarted: all four
  markers (`size: auto`, `min-height: 180mm`, `orientation: landscape`, `max-height: 130mm`) are
  present in both the SSR chunk and the client chunk. `A5 portrait` / `height: 190mm` survive only
  inside the `.js.map` source map — this file's own JSDoc quotes them as history — and appear
  nowhere in the executable chunk.

### Known limits

- **A7 (74×105) overflows to two pages.** Two full postal addresses plus a sticker area do not fit
  legibly on a business-card-sized sheet, and no seller ships on one — deliberately not chased.
- **Still not printed on paper.** Everything above is Chromium's own print engine via PDF, which
  is exactly what the feature uses (`window.print()` → print-to-PDF), but no one has put a real
  sheet through a real printer, and Firefox/Safari print engines were not exercised.
