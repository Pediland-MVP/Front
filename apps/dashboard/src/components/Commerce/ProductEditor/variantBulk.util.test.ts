import { describe, it, expect } from 'vitest';

import { applyBulkPrice, bulkPrice, fillDownTargets } from './variantBulk.util';

describe('bulkPrice', () => {
  it('set writes the value even to a row that had no price', () => {
    expect(bulkPrice(null, 'set', 420000)).toEqual({ price: 420000, skipped: false });
    expect(bulkPrice(300000, 'set', 420000)).toEqual({ price: 420000, skipped: false });
  });

  it('rounds a percentage change to the nearest 1,000 toman', () => {
    // 420000 * 1.07 = 449,400 -> 449,000
    expect(bulkPrice(420000, 'increase', 7)).toEqual({ price: 449000, skipped: false });
    // 420000 * 0.93 = 390,600 -> 391,000
    expect(bulkPrice(420000, 'decrease', 7)).toEqual({ price: 391000, skipped: false });
  });

  // Skipped, not treated as zero: "+10%" must never turn an un-priced row into a free product.
  it('skips a percentage change on a row with no price, instead of treating it as zero', () => {
    expect(bulkPrice(null, 'increase', 10)).toEqual({ price: null, skipped: true });
    expect(bulkPrice(null, 'decrease', 10)).toEqual({ price: null, skipped: true });
  });

  // The design template computes `1 - amount/100` unguarded, so a >100% discount yields a
  // NEGATIVE price. The database rejects that outright (CHECK "price" >= 0), so the merchant
  // would fill in a whole table and only discover it on save.
  it('clamps a discount over 100% to zero rather than going negative', () => {
    expect(bulkPrice(420000, 'decrease', 150)).toEqual({ price: 0, skipped: false });
    expect(bulkPrice(420000, 'decrease', 100)).toEqual({ price: 0, skipped: false });
  });

  it('leaves a price unchanged for a 0% change', () => {
    expect(bulkPrice(420000, 'increase', 0)).toEqual({ price: 420000, skipped: false });
  });

  it('applies a percentage to a zero price without error', () => {
    expect(bulkPrice(0, 'increase', 50)).toEqual({ price: 0, skipped: false });
  });
});

interface Row {
  id: string;
  price: number | null;
  selected: boolean;
}
const rows: Row[] = [
  { id: 'a', price: 420000, selected: true },
  { id: 'b', price: null, selected: true },
  { id: 'c', price: 100000, selected: false },
];

describe('applyBulkPrice', () => {
  const run = (mode: 'set' | 'increase' | 'decrease', amount: number) =>
    applyBulkPrice(
      rows,
      (r) => r.selected,
      (r) => r.price,
      (r, price) => ({ ...r, price }),
      mode,
      amount,
    );

  it('never touches an unselected row', () => {
    const result = run('set', 999);
    expect(result.rows.find((r) => r.id === 'c')?.price).toBe(100000);
  });

  it('counts the skipped rows so the toast can report them honestly', () => {
    const result = run('increase', 10);

    expect(result.changedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.rows.find((r) => r.id === 'a')?.price).toBe(462000);
    expect(result.rows.find((r) => r.id === 'b')?.price).toBeNull();
  });

  it('skips nothing in set mode, because set has no base to be relative to', () => {
    const result = run('set', 500000);

    expect(result.changedCount).toBe(2);
    expect(result.skippedCount).toBe(0);
    expect(result.rows.find((r) => r.id === 'b')?.price).toBe(500000);
  });

  it('returns a new array without mutating the input', () => {
    const result = run('set', 1000);

    expect(result.rows).not.toBe(rows);
    expect(rows[0].price).toBe(420000);
  });
});

describe('fillDownTargets', () => {
  const group = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('covers the origin and everything below it in the same group', () => {
    expect(fillDownTargets(group, 1).map((r) => r.id)).toEqual(['b', 'c']);
  });

  it('covers the whole group from the first row', () => {
    expect(fillDownTargets(group, 0)).toHaveLength(3);
  });

  // Nothing below it means nothing to fill — the caller uses the empty list to skip a
  // pointless "written to 1 variation" toast.
  it('returns nothing when the origin is the last row', () => {
    expect(fillDownTargets(group, 2)).toEqual([]);
  });

  it('returns nothing for an out-of-range origin', () => {
    expect(fillDownTargets(group, -1)).toEqual([]);
    expect(fillDownTargets(group, 9)).toEqual([]);
  });
});
