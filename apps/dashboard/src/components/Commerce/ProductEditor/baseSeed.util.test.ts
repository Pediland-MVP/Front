import { describe, it, expect } from 'vitest';

import {
  applySeedToSingleVariant,
  buildSeededVariant,
  isEmptySeed,
  readBaseSeed,
  type BaseSeed,
} from './baseSeed.util';
import type { ProductFormValues } from './productForm.schema';

type Variant = ProductFormValues['variants'][number];

const seed = (over: Partial<BaseSeed> = {}): BaseSeed => ({
  price: null,
  compare: null,
  stock: null,
  ...over,
});

const variant = (over: Partial<Variant> = {}): Variant => ({
  valueIndexes: [],
  price: 0,
  isActive: true,
  trackInventory: false,
  allowBackorder: false,
  ...over,
});

describe('readBaseSeed / isEmptySeed', () => {
  it('reads the three editor-only fields off the form values', () => {
    expect(readBaseSeed({ basePrice: 100, baseCompare: 200, baseStock: 5 })).toEqual({
      price: 100,
      compare: 200,
      stock: 5,
    });
  });

  it('treats an all-null seed as empty, and zero as a real value', () => {
    expect(isEmptySeed(seed())).toBe(true);
    // 0 is a legitimate price ("free") and a legitimate stock ("none left") — only `null`
    // means the merchant left the field alone.
    expect(isEmptySeed(seed({ price: 0 }))).toBe(false);
    expect(isEmptySeed(seed({ stock: 0 }))).toBe(false);
  });
});

describe('buildSeededVariant', () => {
  it('applies price and compare to every new variation', () => {
    const first = buildSeededVariant([0], ['a'], seed({ price: 450_000, compare: 600_000 }), true);
    const later = buildSeededVariant([1], ['b'], seed({ price: 450_000, compare: 600_000 }), false);

    expect(first.price).toBe(450_000);
    expect(later.price).toBe(450_000);
    expect(first.compareAtPrice).toBe(600_000);
    expect(later.compareAtPrice).toBe(600_000);
  });

  // The rule that matters most: stock is a QUANTITY, not a template. Copying "30 in stock"
  // onto twelve sizes would claim 360 units the merchant never said they had.
  it('applies the stock seed to the first new variation only', () => {
    const first = buildSeededVariant([0], ['a'], seed({ stock: 30 }), true);
    const later = buildSeededVariant([1], ['b'], seed({ stock: 30 }), false);

    expect(first.initialStock).toBe(30);
    expect(first.trackInventory).toBe(true);
    expect(later.initialStock).toBeUndefined();
    expect(later.trackInventory).toBe(false);
  });

  it('falls back to price 0 and leaves compare unset when nothing was seeded', () => {
    const row = buildSeededVariant([0], ['a'], seed(), true);

    expect(row.price).toBe(0);
    expect(row).not.toHaveProperty('compareAtPrice');
    expect(row.trackInventory).toBe(false);
  });

  it('carries the combination and its stable identities through unchanged', () => {
    const row = buildSeededVariant([1, 2], ['red', 'xl'], seed({ price: 10 }), true);

    expect(row.valueIndexes).toEqual([1, 2]);
    expect(row._valueIdentities).toEqual(['red', 'xl']);
  });
});

describe('applySeedToSingleVariant', () => {
  it('seeds the lone implicit variation of an option-less product', () => {
    const [row] = applySeedToSingleVariant(
      [variant()],
      seed({ price: 99_000, compare: 120_000, stock: 7 }),
      false,
    );

    expect(row.price).toBe(99_000);
    expect(row.compareAtPrice).toBe(120_000);
    expect(row.initialStock).toBe(7);
    expect(row.trackInventory).toBe(true);
  });

  // Once options exist the table below is the truth; seeding on top of it would overwrite
  // whatever the merchant typed per-variation.
  it('does nothing when the product has options', () => {
    const rows = [variant()];
    expect(applySeedToSingleVariant(rows, seed({ price: 99_000 }), true)).toBe(rows);
  });

  it('does nothing when there is more than one variation', () => {
    const rows = [variant(), variant()];
    expect(applySeedToSingleVariant(rows, seed({ price: 99_000 }), false)).toBe(rows);
  });

  it('does nothing when the seed is empty', () => {
    const rows = [variant()];
    expect(applySeedToSingleVariant(rows, seed(), false)).toBe(rows);
  });

  // Re-saving an existing product must not rewrite a price the merchant already set.
  it('never overwrites a price, compare or stock the merchant already entered', () => {
    const [row] = applySeedToSingleVariant(
      [variant({ price: 5_000, compareAtPrice: 8_000, initialStock: 2 })],
      seed({ price: 99_000, compare: 120_000, stock: 7 }),
      false,
    );

    expect(row.price).toBe(5_000);
    expect(row.compareAtPrice).toBe(8_000);
    expect(row.initialStock).toBe(2);
  });
});
