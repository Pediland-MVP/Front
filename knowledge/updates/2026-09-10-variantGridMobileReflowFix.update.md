# 2026-09-10 — Fixed: variant grid's mobile reflow put values in the wrong cell

Full reference: the block comment above the variation-grid rules in
`apps/dashboard/src/styles/globals.css` ("Commerce product editor: the rules Tailwind cannot
express"). Front-only bug fix, no backend change.

## Problem

Below the 760px breakpoint, the variant grid reflowed each row into a 4-cell
`grid-template-areas` card, with plain CSS `nth-child(N)` picking which DOM child landed in which
area (`chk` / `label` / `media` / `price` / `stock` / `cmp` / `act`). Radix's `Checkbox` renders a
hidden native `<input>` as an invisible SIBLING of its own button (for native form participation).
Every row placed a bare `<Checkbox />` directly among its cells, so that hidden input became an
extra, uncounted child — every `nth-child` rule after it pointed one cell too far, and the stock
input silently rendered inside the 56px delete-button column on mobile.

## Solution

- Every `<Checkbox>` in `VariantGroupRow`/`VariantLeafRow`/`VariantsSection`'s header row is now
  wrapped in its own `data-cell="chk"` element, so the hidden input can never leak out and become
  an extra child again.
- Mobile styling no longer does position/area math at all (`nth-child`, `grid-template-areas`).
  Below 760px each row is a plain stacked flex list; every real cell carries a `data-cell` name
  (`chk`/`label`/`media`/`price`/`cmp`/`stock`) and, since the desktop column headers are hidden
  at this width, an inline `<span>` label of its own (`text-mut hidden text-xs font-bold
  max-[760px]:block`).
- The header row (`[data-vg][data-head]`) keeps only the "select all" checkbox at this width, plus
  a plain non-`columnheader` `<span>` label next to it (a real `columnheader` role would be hidden
  by the same rule that hides the others).
- Desktop `grid-template-columns` widened the stock column from `minmax(120px, 0.9fr)` to
  `minmax(130px, 1fr)` to match the price column, a minor side effect of touching that rule.

## Changes

- `apps/dashboard/src/components/Commerce/ProductEditor/variant/VariantGroupRow.tsx` — checkbox
  wrapper cell, `data-cell` on every gridcell, inline mobile field labels.
- `apps/dashboard/src/components/Commerce/ProductEditor/variant/VariantLeafRow.tsx` — same pattern.
- `apps/dashboard/src/components/Commerce/ProductEditor/variant/VariantsSection.tsx` — header row
  checkbox wrapper + mobile-only "select all" label; `min-w-[900px]` no longer forced below 760px.
- `apps/dashboard/src/styles/globals.css` — mobile block rewritten from `grid-template-areas` +
  `nth-child` to a stacked flex list keyed by `data-cell`; postmortem comment added.

## Verification

- `VariantsSection.test.tsx` (16 tests, unchanged) and the full `src/components/Commerce` suite
  (263 tests) pass unchanged against the new structure.
- `pnpm --filter front exec tsc --noEmit` — zero new errors on touched files.
- No new regression test was added for the nth-child offset itself (jsdom has no viewport, so the
  mobile-only CSS reflow isn't exercisable in vitest) and this was not re-verified live in a mobile
  browser — flag that if a report comes back on the mobile grid again.
