import type { ProductFormValues } from './productForm.schema';

type Variant = ProductFormValues['variants'][number];

export interface BaseSeed {
  price: number | null;
  compare: number | null;
  stock: number | null;
}

/**
 * The base price/compare/stock fields (steps 5 and 6) are editor-only: they are never sent to the
 * backend, they only pre-fill variations. This module is where that "pre-fill" is defined, kept
 * out of the components so it can be tested directly.
 *
 * Two rules run through both functions:
 *
 * - **Price and compare are templates; stock is a quantity.** Twelve sizes at 450,000 toman is
 *   one price repeated twelve times. Twelve sizes with 30 in stock is *not* 30 units — it is
 *   360. So the stock seed lands on the FIRST new variation only, and the rest start empty for
 *   the merchant to fill in.
 * - **A seed never overwrites a number the merchant already typed.** Regenerating after adding
 *   one colour must not reset the eleven prices already entered.
 */
export const readBaseSeed = (values: {
  basePrice: number | null;
  baseCompare: number | null;
  baseStock: number | null;
}): BaseSeed => ({
  price: values.basePrice,
  compare: values.baseCompare,
  stock: values.baseStock,
});

/** True when nothing was typed into the base fields — lets callers skip the work entirely. */
export const isEmptySeed = (seed: BaseSeed) =>
  seed.price === null && seed.compare === null && seed.stock === null;

/**
 * Builds a brand-new variation row for `combo`, pre-filled from the seed.
 *
 * `isFirstNew` marks the first row created in this regenerate pass — only that one takes the
 * stock seed, per the quantity rule above.
 */
export const buildSeededVariant = (
  combo: number[],
  identities: string[],
  seed: BaseSeed,
  isFirstNew: boolean,
): Variant => ({
  valueIndexes: combo,
  _valueIdentities: identities,
  // `price` is required and non-nullable in the form contract, so an unseeded row is 0 — the
  // same default the table showed before seeding existed.
  price: seed.price ?? 0,
  ...(seed.compare !== null && { compareAtPrice: seed.compare }),
  ...(isFirstNew && seed.stock !== null && { initialStock: seed.stock, trackInventory: true }),
  isActive: true,
  // Stock is only tracked when an opening quantity was actually given; otherwise the variation
  // sells without a counter, which is what `trackInventory: false` means.
  trackInventory: isFirstNew && seed.stock !== null,
  allowBackorder: false,
});

/**
 * Applies the seed to a product that has **no options** — the single implicit variation.
 *
 * Without this, a merchant who fills in "قیمت" and saves gets a product priced at 0, because the
 * base fields are not part of the payload and nothing else writes that row. Called at submit
 * time rather than on every keystroke so the form stays the single source of truth while typing.
 *
 * Only ever touches a row the merchant has not priced themselves (`price === 0` and no stock),
 * so re-saving an existing product cannot silently rewrite it.
 */
export const applySeedToSingleVariant = (
  variants: Variant[],
  seed: BaseSeed,
  hasOptions: boolean,
): Variant[] => {
  if (hasOptions || variants.length !== 1 || isEmptySeed(seed)) return variants;

  const [only] = variants;
  const next: Variant = { ...only };

  if (seed.price !== null && only.price === 0) next.price = seed.price;
  if (seed.compare !== null && only.compareAtPrice === undefined) {
    next.compareAtPrice = seed.compare;
  }
  if (seed.stock !== null && only.initialStock === undefined) {
    next.initialStock = seed.stock;
    next.trackInventory = true;
  }

  return [next];
};
