// Cartesian product of each option's value INDEXES (not the values themselves) — matches
// the backend's positional valueIndexes contract directly, so the caller never has to
// re-map ids to indexes later.
export function generateVariantCombinations(
  optionValueCounts: number[], // e.g. [3, 2] for a 3-value option + a 2-value option
): number[][] {
  if (optionValueCounts.length === 0) return [[]];
  return optionValueCounts.reduce<number[][]>(
    (acc, count) => acc.flatMap((combo) => Array.from({ length: count }, (_, i) => [...combo, i])),
    [[]],
  );
}

export const VARIANT_LIMIT = 2000;
export const OPTION_LIMIT = 3;
