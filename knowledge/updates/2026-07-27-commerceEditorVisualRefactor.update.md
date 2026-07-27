# Commerce Product Editor — Visual Refactor (2026-07-27)

Second half of applying the claude-design template
`templates/product-variations/ProductVariations.dc.html` (project `Befroosh Design System`).

The first pass (`2026-07-25-commerceEditorRedesign.update.md`) ported the design's **behaviour** —
variation grouping, bulk edit, tags, specs, markdown. It did **not** touch the visual layer: every
section still rendered as a default shadcn `Card` with a `CardHeader`, inside a scrollspy layout
the design does not have. This pass replaces that.

## Problem

The editor looked nothing like the design. Concretely:

- No sticky header, no breadcrumb, no status pill, no numbered steps.
- One scrolling column of generic cards behind a scrollspy nav; the design is a single-scroll form
  with a 308px sticky rail holding Collections and Tags.
- The variation table was a 12-column `<Table>`; the design is a 7-column grid with a tinted
  header band, indented leaf rows, a ∞ stock toggle, a discount pill and a footer summary.
- Bulk edit was an inline bar above the table; the design floats a dark pill at the bottom.
- `--warning`, `--tint2`, `--ln`, `--dtext` and the other 14 tokens added in R4 were declared in
  `:root` **only**, never in `@theme`. Tailwind cannot see a bare custom property, so `bg-tint2`
  and friends compiled to nothing — the tokens were dead the day they were added.
- `basePrice`/`baseCompare`/`baseStock` were added to `ProductFormValues` in R4 with a comment
  claiming they "pre-fill each newly generated variation". Nothing rendered them and nothing read
  them. They were dead fields.

## Solution

### Chrome, in one place

`ProductEditor/ui/editorChrome.ts` holds the design's vocabulary as class strings — card shell,
four input sizes, the dashed "add another" button, tinted sub-box, icon buttons, chips. Exported
as strings rather than wrapper components because most of them land on a plain `<input>` that
already carries a react-hook-form `field` spread, and a wrapper would fight it.

`ui/EditorSection.tsx` renders the numbered step header **outside** the card (so progress through a
long form is visible) plus `EditorRailCard` for the sidebar panels. Step numbers render in Persian
digits — a latin "3" beside "دسته‌بندی" reads as a typo on an all-RTL surface.

The 16 R4 tokens are now registered as `--color-*` entries in `@theme inline`, plus a new `--ink`
(the near-black behind the bulk bar and photo badges). It is named `--ink`, not the design's
`--dark`, because `.dark` is the theme class and a `--dark` token that does *not* mean dark mode
would be misread. `--ink` and the two fixed-lightness text tokens get a `.dark` counterpart; every
other token is a `color-mix` and follows the theme on its own.

### Layout

`ProductEditorPage` is now the design's shell: `EditorTopBar` (breadcrumb, live title, status pill,
revert/cancel/save) over a `minmax(0,1fr) / 308px` grid. `EditorScrollspyNav` and
`BasicInfoSection` were deleted — the design has neither.

Sections, in design order: title (1), description (2), category (3), media (4), base price (5),
base stock (6), options (7), specs (8), variations (9). Steps 10 and 11 are **ours**: the stock
ledger and shipping. The design has no home for either, but both are real saved data, so they
continue the numbering rather than being dropped in a restyle.

### Nothing was dropped to fit the layout

The design's variation row has seven columns. Ours had twelve. The four with nowhere to go — SKU,
the sale window, backorder, and the active flag — moved into a **per-row settings popover**, whose
trigger tints when something inside it is set (so a deactivated variation is still visible at a
glance). Same for `status` and `kind`: the design shows status as a read-only badge, so both keep a
real control in the category card.

### The base fields now do something

`baseSeed.util.ts` defines what "pre-fill" means, with two rules:

- **Price and compare are templates; stock is a quantity.** Twelve sizes at 450,000 is one price
  twelve times. Twelve sizes with 30 in stock is *not* 30 units — it is 360. So the stock seed
  lands on the first new variation only.
- **A seed never overwrites a number already typed.** Regenerating after adding one colour must
  not reset the eleven prices already entered.

`OptionsSection.handleRegenerate` uses it for new combinations; `buildCreatePayload` uses it for the
lone implicit variation of an option-less product — which is the only place that product's price
can come from, since the base fields are never sent.

### Category picker

The design replaces the flat `<select>` with a two-level picker dialog plus inline creation
(`POST /commerce/categories`). A flat option list loses the parent that gives a subcategory its
meaning — "کتانی" under "کفش" versus under "لباس بچه". Creating a category needs `product:edit`,
which is a **different** permission from the `product:create` that lets someone add a product, so
the create rows are hidden in exactly that case rather than 403-ing after a name is typed. Same
split applies to the new inline collection create.

### Options: buttons, not drag

Option order decides the variation tree's top level, so "رنگ then سایز" and "سایز then رنگ" build
visibly different tables from identical data. The dnd-kit drag handle hid that; explicit up/down
buttons carry a tooltip that says it. Values also accept a comma-separated list now, and reject
case-insensitive duplicates (which the backend rejects as one signature anyway).

## Changes

- **New**: `ui/editorChrome.ts`, `ui/EditorSection.tsx`, `ui/EditorTopBar.tsx`,
  `ui/MediaDropzone.tsx`, `CategoryPickerDialog.tsx`, `baseSeed.util.ts` (+ tests),
  `variantIdentity.util.ts`, `sections/TitleSection.tsx`, `sections/DescriptionSection.tsx`,
  `sections/CategorySection.tsx`, `sections/BasePricingSection.tsx`, `sections/OptionsSection.tsx`.
- **Deleted**: `EditorScrollspyNav.tsx` (+ test), `sections/BasicInfoSection.tsx`.
- **Rewritten**: `ProductEditorPage.tsx` (shell + seeding), `sections/VariantsSection.tsx` (grid
  rows, roll-up cells, floating bulk bar, settings popover; options editor moved out),
  `sections/MediaSection.tsx`, `sections/CollectionsSection.tsx`, `sections/TagsSection.tsx`,
  `sections/SpecsSection.tsx`, `sections/ShippingSection.tsx`, `MarkdownDescriptionField.tsx`.
- **Touched**: `sections/InventorySection.tsx` (card → `EditorSection`; its ledger table is data,
  not covered by the design, and is unchanged), `markdownPreview.util.tsx` (italic support —
  bold-first alternation so `**x**` is never read as an empty italic), `styles/globals.css`
  (`@theme` registration + `--ink`), `messages/fa.json` (~90 keys).

## Verification

- `vitest run src/components/Commerce` → **197 passed / 197**, 22 files. Adapted rather than
  weakened: SKU/active assertions now open the settings popover first, the variants harness renders
  `OptionsSection` alongside the table, and the media tests target the new dropzone input.
- `vitest run baseSeed.util.test.ts` → **11 passed / 11** (new).
- `tsc --noEmit` → two errors, both pre-existing and unrelated: the `zodResolver`/`ZodObject`
  version mismatch, and `Badge variant="secondary"` in the inventory ledger (present at HEAD).
- `eslint` → clean, 0 warnings.

## Not done

The design's **product preview dialog** ("پیش‌نمایش" in the header) is not built. It renders an
approximate storefront view — media gallery, axis pickers, price, description — and is a
self-contained feature rather than part of the form surface. The header button is absent rather
than present-and-dead.
