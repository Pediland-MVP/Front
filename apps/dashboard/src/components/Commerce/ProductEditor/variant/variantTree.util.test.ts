import { describe, it, expect } from 'vitest';
import {
  aggregate,
  axesOf,
  comboKey,
  combosOf,
  discountPercent,
  missingCombos,
  orphanRowIndexes,
  realignValueIds,
  topKeyOf,
} from './variantTree.util';

const colour = { id: 'color', values: [{ id: 'c1' }, { id: 'c2' }] };
const size = { id: 'size', values: [{ id: 's1' }, { id: 's2' }, { id: 's3' }] };
const empty = { id: 'material', values: [] };

const row = (
  valueIds: string[],
  over: Partial<{
    price: number | null;
    compare: number | null;
    stock: number | null;
    infinite: boolean;
  }> = {},
) => ({
  valueIds,
  price: 100,
  compare: null,
  stock: 5,
  infinite: false,
  ...over,
});

describe('axesOf', () => {
  it('ignores an option that has no values yet', () => {
    expect(axesOf([colour, empty, size]).map((a) => a.id)).toEqual(['color', 'size']);
  });
});

describe('comboKey', () => {
  it('is order-sensitive, because the axis order defines the key space', () => {
    expect(comboKey(['c1', 's1'])).toBe('c1|s1');
    expect(comboKey(['s1', 'c1'])).not.toBe(comboKey(['c1', 's1']));
  });
});

describe('topKeyOf', () => {
  it('groups by the FIRST axis value', () => {
    expect(topKeyOf(['c1', 's1'])).toBe('c1');
    expect(topKeyOf(['c1', 's2'])).toBe('c1');
  });

  it('returns the all-group for a product with no axes', () => {
    expect(topKeyOf([])).toBe('all');
  });
});

describe('combosOf', () => {
  it('expands the cartesian product in axis order', () => {
    expect(combosOf([colour, size])).toEqual([
      ['c1', 's1'],
      ['c1', 's2'],
      ['c1', 's3'],
      ['c2', 's1'],
      ['c2', 's2'],
      ['c2', 's3'],
    ]);
  });

  it('is empty when there are no axes', () => {
    expect(combosOf([])).toEqual([]);
  });
});

describe('missingCombos', () => {
  it('returns only the combinations that have no row', () => {
    const rows = [row(['c1', 's1']), row(['c1', 's2'])];
    expect(missingCombos([colour, size], rows, [])).toEqual([
      ['c1', 's3'],
      ['c2', 's1'],
      ['c2', 's2'],
      ['c2', 's3'],
    ]);
  });

  it('never returns a combination the merchant deleted on purpose', () => {
    const rows = [row(['c1', 's1'])];
    const suppressed = [comboKey(['c1', 's2'])];
    const result = missingCombos([colour, size], rows, suppressed);
    expect(result).not.toContainEqual(['c1', 's2']);
    expect(result).toContainEqual(['c1', 's3']);
  });
});

describe('orphanRowIndexes', () => {
  it('flags a row whose length no longer matches the axis count', () => {
    const rows = [row(['c1', 's1']), row(['c1'])];
    expect(orphanRowIndexes([colour, size], rows)).toEqual([1]);
  });

  it('flags a row pointing at a value that was deleted', () => {
    const rows = [row(['c1', 's1']), row(['c9', 's1'])];
    expect(orphanRowIndexes([colour, size], rows)).toEqual([1]);
  });

  it('flags nothing when every row is well formed', () => {
    expect(orphanRowIndexes([colour, size], [row(['c1', 's1'])])).toEqual([]);
  });
});

describe('realignValueIds', () => {
  it('re-sorts a row into the new axis order after a reorder', () => {
    expect(realignValueIds([size, colour], ['c1', 's2'])).toEqual(['s2', 'c1']);
  });

  it('returns the same order when nothing moved', () => {
    expect(realignValueIds([colour, size], ['c1', 's2'])).toEqual(['c1', 's2']);
  });

  it('ignores an axis that has no values, exactly like axesOf', () => {
    expect(realignValueIds([colour, empty], ['c1'])).toEqual(['c1']);
  });

  it('returns null for a row that predates an axis, so the caller still orphans it', () => {
    expect(realignValueIds([colour, size], ['c1'])).toBeNull();
  });

  it('returns null for a row pointing at a value that was deleted', () => {
    expect(realignValueIds([colour, size], ['c9', 's1'])).toBeNull();
  });

  it('returns null when two ids claim the same axis', () => {
    expect(realignValueIds([colour, size], ['c1', 'c2'])).toBeNull();
  });

  it('accepts the axis-less product’s single empty row', () => {
    expect(realignValueIds([], [])).toEqual([]);
  });
});

describe('aggregate', () => {
  it('reports uniform when every child agrees', () => {
    expect(aggregate([row([], { price: 100 }), row([], { price: 100 })], 'price')).toEqual({
      state: 'uniform',
      value: 100,
    });
  });

  it('reports mixed with the range when children disagree', () => {
    expect(aggregate([row([], { price: 100 }), row([], { price: 300 })], 'price')).toEqual({
      state: 'mixed',
      min: 100,
      max: 300,
      missing: 0,
    });
  });

  it('reports empty when no child has a value', () => {
    expect(aggregate([row([], { price: null }), row([], { price: null })], 'price')).toEqual({
      state: 'empty',
      missing: 2,
    });
  });

  it('counts blanks alongside a known value as mixed, not uniform', () => {
    expect(aggregate([row([], { price: 100 }), row([], { price: null })], 'price')).toEqual({
      state: 'mixed',
      min: 100,
      max: 100,
      missing: 1,
    });
  });

  it('treats infinite stock as a value, so ∞ mixed with a number is mixed', () => {
    const result = aggregate(
      [row([], { stock: 5 }), row([], { stock: null, infinite: true })],
      'stock',
    );
    expect(result).toEqual({ state: 'mixed', min: 5, max: Infinity, missing: 0 });
  });
});

describe('discountPercent', () => {
  it('computes the percentage off', () => {
    expect(discountPercent(420000, 480000)).toBe(13);
  });

  it('is null when compare is not above price', () => {
    expect(discountPercent(500, 500)).toBeNull();
    expect(discountPercent(500, 400)).toBeNull();
    expect(discountPercent(null, 400)).toBeNull();
  });
});
