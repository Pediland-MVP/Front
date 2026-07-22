import { describe, expect, it } from 'vitest';

import { generateVariantCombinations, OPTION_LIMIT, VARIANT_LIMIT } from './variantMatrix.util';

describe('generateVariantCombinations', () => {
  it('returns a single empty-combo variant when there are no options', () => {
    expect(generateVariantCombinations([])).toEqual([[]]);
  });

  it('produces the cartesian product of value indexes for [3, 2]', () => {
    const combos = generateVariantCombinations([3, 2]);

    expect(combos).toHaveLength(6);
    expect(combos).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 0],
      [2, 1],
    ]);
  });

  it('handles a single option', () => {
    expect(generateVariantCombinations([4])).toEqual([[0], [1], [2], [3]]);
  });

  it('handles three options (max OPTION_LIMIT)', () => {
    const combos = generateVariantCombinations([2, 2, 2]);
    expect(combos).toHaveLength(8);
    expect(combos[0]).toEqual([0, 0, 0]);
    expect(combos[7]).toEqual([1, 1, 1]);
  });

  it('returns an empty array of combos when any option has zero values', () => {
    // An option row the user hasn't added a value to yet contributes 0 possibilities —
    // the caller (VariantsSection) is responsible for blocking regeneration in this case,
    // this function just reflects the math faithfully.
    expect(generateVariantCombinations([3, 0])).toEqual([]);
  });

  it("does not throw or truncate for a combination count above VARIANT_LIMIT — that guard is the caller's job", () => {
    // 2001 possibilities from a single option: still a pure, un-throwing calculation.
    const combos = generateVariantCombinations([VARIANT_LIMIT + 1]);
    expect(combos).toHaveLength(VARIANT_LIMIT + 1);
  });

  it('exposes the expected limit constants', () => {
    expect(VARIANT_LIMIT).toBe(2000);
    expect(OPTION_LIMIT).toBe(3);
  });
});
