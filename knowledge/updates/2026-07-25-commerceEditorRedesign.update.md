# Commerce Product Editor Redesign (2026-07-25)

Applying the claude-design "Product editor with variations" template
(`templates/product-variations/ProductVariations.dc.html`, project `Befroosh Design System`) to
the dashboard. Backend half:
`Back/knowledge/updates/2026-07-25-commerceCreateTimeMediaAndCollections.update.md` and the
tags/specs commits.

Staged: **R4 tokens + contract**, **R5 variations table**, **R6 tags / specs / markdown** (all in this doc).

## The design, and what it is not

The template is a 1751-line single component with ~60 handlers over one flat `state`, and **no
I/O at all** — every persistence path is ours. It was adopted for its *visual language and
interactions*, not its state model: our editor keeps react-hook-form + zod + `dirtyFields` +
permission gating, which the template has no equivalent of.

Two things in it were deliberately **not** ported:

- `componentDidUpdate` runs `paintSwatches()` (a full `querySelectorAll` + inline style write)
  and `autoCreate()` on **every render**. Free for its nine mock rows; a forced reflow per
  keystroke on a real product.
- Aggregates recomputed inside `render()`. Ours are memoised (`useMemo`) over pure functions.

## R4 — tokens and form contract

The design system's base palette is byte-identical to ours (its own header says it "mirrors the
tokens in Front"), and 13 of the 37 tokens the template uses were already in `globals.css`. Of
the rest, six are Tailwind text sizes and the font stack, and **every genuinely new token except
`--warning` is derived from an existing one via `color-mix`**.

So 16 semantic tokens were added, not a palette: `--warning`/`--success`, `--radius-full`, the
tint/line/glow surface set, and the warning + danger sets that mark an unpriced or zero-stock
row. Because they are `color-mix` over `--primary`/`--border`/`--destructive`/`--ring`, dark
mode follows on its own — only `--wtext`/`--dtext` have fixed lightness and need a `.dark`
counterpart.

`ProductFormValues` gained `tags`, `specs`, and `basePrice`/`baseCompare`/`baseStock`. The base
fields are **editor-only seeds, never persisted**: they pre-fill each newly generated variation
(price/compare on every one, stock on only the first, because a stock count is a quantity, not a
template).

## R5 — the variations table

### Grouping and roll-ups

Variations now render as a two-level tree: one collapsible parent per value of the **first**
option, summarising its leaves. The maths lives in two pure, tested modules rather than the
component, because the component re-renders on every keystroke:

- `variantTree.util.ts` — `aggregate()` (uniform / mixed min–max / empty), `groupVariants()`,
  `flattenGroups()`.
- `variantBulk.util.ts` — `bulkPrice()`, `applyBulkPrice()`, `fillDownTargets()`.

Decisions worth keeping:

- **`null` counts as missing, never as zero.** Folding it in would show a group as
  "0 – 445,000" and make an unpriced product look free.
- **A group with any missing leaf is not `uniform`.** Otherwise collapsing it hides the fact
  that some variations are still unpriced.
- **`Infinity` expresses untracked stock** and aggregates like any number, so an all-untracked
  group reads as "نامحدود" rather than as a mixed range.
- **A group is only a branch when the product has >1 option and the group has >1 leaf.** A
  single-option product would otherwise be a tree of one-child branches saying the same thing
  on the parent and its only leaf.

### Performance: the tree is the windowing

Groups start **collapsed**, and `flattenGroups` only emits an expanded group's leaves. The
backend allows 2000 variations; a 10-colour × 200-size product therefore renders **10 rows**
until the merchant opens one. That removes the need for a virtualiser (and a new dependency) for
the realistic shape. `flattenGroups` still returns a flat list carrying each leaf's owning
group, so a virtualiser can be dropped in later if a single group ever needs it.

### Selection and bulk edit

Selection is keyed by react-hook-form's stable `_vid`, **not array index** — indexes shift under
a regenerate and would silently re-point a selection at other rows. Checking a parent selects
every leaf under it, so the bar's count is the real leaf count. Shift-click extends a range from
the last clicked row (read off the native event, since React's synthetic change event carries no
modifier keys).

`set` writes to every selected row including unpriced ones. `increase`/`decrease` are relative,
so a row with no price is **skipped and counted** rather than treated as 0 — which would turn
"+10%" into "now costs 0" on exactly the rows the merchant had not reached. Percentage changes
round to the nearest 1,000 toman.

### A bug fixed rather than ported

The template computes `1 - amount/100` unguarded, so a discount over 100% produces a **negative
price**. Our database rejects that outright (`CHECK "price" >= 0`), so a merchant would bulk-edit
a whole table and only find out on save. `bulkPrice` clamps at zero, pinned by a test.

### Not changed

`OPTION_LIMIT` (3) and `VARIANT_LIMIT` (2000) were already enforced in `VariantsSection`
(lines ~166/189/313), so the template's unlimited `addAttr` does not apply — our guard stands.
The regenerate-diff logic (stable value identities, survives reorder/removal) is untouched; its
14 existing tests still pass.

## R6 — tags, specs and the markdown description

`TagsSection` and `SpecsSection` are new (nothing equivalent existed), backed by the tags/specs
API shipped earlier the same day. Tags de-duplicate **case-insensitively in the UI too** — the
backend does, and letting the UI disagree would display a tag that silently vanishes on save.
The spec list caps at 50 to match the backend's `@ArrayMaxSize(50)`: better a disabled button
than a 400 after the merchant has typed the 51st row.

### The markdown preview, and why it needs no sanitiser

The description is now markdown with a write/preview toggle and a small toolbar. The repo has
**no markdown library and no sanitiser**, and rather than add `react-markdown` + `rehype-sanitize`
the preview renders the supported subset (`### heading`, `**bold**`, `- list`, `[text](url)`,
paragraphs) **to React elements, never to an HTML string**.

That is the security property, not a style choice: with no `dangerouslySetInnerHTML` anywhere,
raw markup cannot become live DOM no matter what is typed — `<script>` and `<img onerror>` both
render as literal text, pinned by tests. The one real sink left is a link's href, gated by
`safeHref` to http/https/relative/anchor; a `javascript:` or `data:` link degrades to plain text
rather than a clickable anchor.

The stored value stays raw markdown and the preview never writes back, so toggling to preview
and away cannot alter what the merchant typed.

## Changes

- `variantTree.util.ts`, `variantBulk.util.ts` (+ their tests) — new.
- `sections/VariantsSection.tsx` — tree state/memos, selection, bulk bar, `VariantGroupRow`,
  `renderLeaf`, per-row checkbox, Ctrl/Cmd+D fill-down.
- `productForm.schema.ts`, `types/commerce.ts`, `ProductEditorPage.tsx`, `styles/globals.css` —
  R4.
- `sections/TagsSection.tsx`, `sections/SpecsSection.tsx` (+ tests) — new.
- `markdownPreview.util.tsx` (+ tests), `MarkdownDescriptionField.tsx` — new;
  `sections/BasicInfoSection.tsx` swapped its plain `Textarea` for the markdown field.
- `messages/fa.json` — 23 `Commerce.Editor.Variants` keys, plus `Tags` (6), `Specs` (7) and 9
  `Basic` markdown keys.

## Verification

- `vitest src/components/Commerce` → **198 passed / 198**, 23 files (36 tree/bulk util tests,
  9 table-behaviour tests, 14 markdown tests incl. every XSS case, 16 tags/specs tests, and the
  14 pre-existing regenerate tests intact).
- `tsc --noEmit` → 272 lines, unchanged from baseline; nothing from this change. The one
  `VariantsSection.test.tsx` entry is the pre-existing `zodResolver`/`ZodObject` version
  mismatch on a line this change does not touch.
