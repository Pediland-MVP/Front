# Product Editor — attributes notice layout and variant error tone (2026-08-13)

Reference: `Front/knowledge/updates/2026-07-22-commerceProductManagementFoundation.update.md`
(the editor itself), `apps/dashboard/src/components/Commerce/ProductEditor/`.

Two unrelated visual bugs in the product editor, both found by looking at the rendered page
rather than the code.

## Problem 1 — the "use مشخصات instead" notice rendered as five columns

`AttributesSection` explains, above step ۷, that variation axes are for things the buyer
*chooses* (size, colour) and that fixed facts (جنس, کشور سازنده) belong in step ۸ (مشخصات).
The sentence marks up both section names with `t.rich`, so it compiles to **five sibling
nodes**: text, `<strong>`, text, `<strong>`, text.

Those five nodes were handed straight to `AlertDescription`, which is a flex **row**. Each
node became its own flex item, so one sentence was laid out as five narrow side-by-side
columns, each wrapping independently — the phrases read as if stacked inside one another.

A second, separate fault in the same block: the component returned a fragment, and the page
stacks its steps in a `flex-col gap-6`. The fragment spilled the notice and the section into
that stack as two loose siblings, so the notice floated 24px clear of the heading it belongs
to and read as a footnote on the **previous** step (price/stock).

## Problem 2 — a missing stock count was tinted amber, not red

`VariantNumberCell` picks its error tint with:

```ts
const shown: VariantCellTone = hasError ? (field === 'price' ? 'empty' : 'zero') : tone;
```

The intent was "missing is red, present-but-wrong is amber". But `stock` fell into the `else`
branch and got amber, even though a stock zod issue only ever fires for a **missing** value —
`0` is a valid stock count and never trips the validator.

## Solution

`sections/AttributesSection.tsx`:

- Wrapped `t.rich`'s output in a `<p className="m-0 text-pretty">`. That makes the whole
  sentence a single flex item, so it flows as normal inline text with both `<strong>`s sitting
  mid-sentence where they belong.
- Replaced the fragment with `<div className="flex min-w-0 flex-col gap-2.5">`, so the page
  sees **one** step and the tight inner gap says the notice and the card belong together.
- `items-start` on the `Alert` plus `[&>div:first-child]:shrink-0` on the description, because
  the message runs to two or three lines: both default to `items-center`, which floated the
  icon halfway down the paragraph, and the icon wrapper carries no `shrink-0` of its own.

`variant/VariantNumberCell.tsx`: inverted the condition to name the real exception —

```ts
const shown: VariantCellTone = hasError ? (field === 'compare' ? 'zero' : 'empty') : tone;
```

`compare` is the only field whose issue *always* fires on a value that is present and wrong, so
it is the only amber one. Verified against the `superRefine` in `productEditor.schema.ts`:

| field | issues it can raise | tone |
| --- | --- | --- |
| `stock` | `stockRequired` (missing only — `0` is valid and never trips it) | red |
| `compare` | `compareInvalid` (present, not above price) | amber |
| `price` | `priceRequired` (missing), plus `salePriceInvalid` and `amountMax` on a present value | red |

So `price` is not purely a missing-value field — the sale-price issue is reported on the `price`
path deliberately, "the price cell is the one on screen, and it is the one the merchant can act
on". Its tint is unchanged by this fix (red before and after). **The only behaviour that changes
is `stock`, which used to be tinted amber for a value that was simply absent.**

## Changes

- `apps/dashboard/src/components/Commerce/ProductEditor/sections/AttributesSection.tsx`
- `apps/dashboard/src/components/Commerce/ProductEditor/sections/AttributesSection.test.tsx`
- `apps/dashboard/src/components/Commerce/ProductEditor/variant/VariantNumberCell.tsx`

The new test asserts the **DOM shape**, not the styling, because that is where the fault lives:
as long as every text run and both `<strong>`s share one non-flex parent, the sentence flows.

```ts
expect(paragraph!.className).not.toMatch(/\bflex\b/);
expect(parents.size).toBe(1);
```

## Verification

`npx vitest run src/components/Commerce/ProductEditor` — see the commit's test run.
`VariantNumberCell`'s tone change has no direct unit test; it was verified by reading the
`superRefine` block in `productEditor.schema.ts` to confirm which issues each field can raise
(table above).
