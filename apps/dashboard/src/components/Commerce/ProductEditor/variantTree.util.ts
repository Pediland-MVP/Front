/**
 * Grouping and roll-up maths for the variations table.
 *
 * The redesign shows variations as a two-level tree: one collapsible parent per value of the
 * FIRST option ("رنگ: مشکی"), with every variation carrying that value as its leaves. A parent
 * summarises its leaves — one price if they all agree, a min–max range if they don't — and
 * editing the parent writes that single value across all of them.
 *
 * All of it lives here as pure functions rather than inside the component because the component
 * re-renders on every keystroke: these results get memoised by the caller. The design template
 * recomputed its aggregates inside `render()` and re-scanned the DOM on every
 * `componentDidUpdate`, which is fine for its nine mock rows and is not fine at the 2000
 * variations the backend allows.
 */

/** Group key for variations that have no options at all (the single default variation). */
export const SINGLE_GROUP_KEY = 'all';

export type VariantAggregate =
  /** No leaf has a value — the column shows "—". `missing` is the leaf count. */
  | { state: 'empty'; missing: number }
  /** Every leaf that has a value agrees on it. */
  | { state: 'uniform'; value: number; missing: number }
  /** Leaves disagree — the column shows a min–max range. */
  | { state: 'mixed'; min: number; max: number; missing: number };

/**
 * Rolls a column of leaf values up into one summary.
 *
 * `null` means "not set yet" and is counted in `missing` rather than treated as zero — an
 * unpriced variation must not drag a group's minimum to 0. `Infinity` is how the caller
 * expresses untracked ("infinite") stock, and it aggregates like any other number, so a group
 * of all-infinite leaves reads as uniform rather than mixed.
 */
export function aggregate(values: Array<number | null>): VariantAggregate {
  const known = values.filter((value): value is number => value != null);
  const missing = values.length - known.length;

  if (!known.length) return { state: 'empty', missing };

  let min = known[0];
  let max = known[0];
  for (const value of known) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  // A group where some leaves are unset is NOT uniform even if the set ones agree: the parent
  // must not claim a price the whole group does not actually have.
  if (min === max && missing === 0) return { state: 'uniform', value: min, missing: 0 };
  return { state: 'mixed', min, max, missing };
}

/**
 * The group a variation belongs to: the index of its selected value on the first option.
 *
 * Positional, matching the form's `valueIndexes` contract. A variation with no options (the
 * implicit single variation) falls into one shared group so the table still has exactly one
 * level of structure to render.
 */
export function topKeyOf(valueIndexes: number[]): string {
  return valueIndexes.length > 0 ? String(valueIndexes[0]) : SINGLE_GROUP_KEY;
}

export interface VariantGroup<TRow> {
  key: string;
  /** The first option's value at this index, e.g. "مشکی". Empty when there are no options. */
  label: string;
  rows: TRow[];
  /**
   * Whether this group renders as a collapsible parent with a roll-up row.
   *
   * False when there is only one option (the group and its single leaf would say the same
   * thing twice) or when the group holds one leaf. Those render flat instead — which is what
   * stops a single-option product from becoming a tree of one-child branches.
   */
  isBranch: boolean;
}

/**
 * Buckets variations into groups by their first option value, preserving input order both
 * between groups and within them.
 *
 * `optionCount` is passed in rather than derived because a group's branch-ness depends on how
 * many options the PRODUCT has, not on how many this group's rows happen to use.
 */
export function groupVariants<TRow>(
  rows: TRow[],
  getValueIndexes: (row: TRow) => number[],
  firstOptionValueLabels: string[],
  optionCount: number,
): Array<VariantGroup<TRow>> {
  const byKey = new Map<string, TRow[]>();

  for (const row of rows) {
    const key = topKeyOf(getValueIndexes(row));
    const bucket = byKey.get(key);
    if (bucket) bucket.push(row);
    else byKey.set(key, [row]);
  }

  return [...byKey.entries()].map(([key, groupRows]) => ({
    key,
    label: key === SINGLE_GROUP_KEY ? '' : (firstOptionValueLabels[Number(key)] ?? ''),
    rows: groupRows,
    isBranch: optionCount > 1 && groupRows.length > 1,
  }));
}

/**
 * The rows the table actually renders, parents included, given which groups are expanded.
 *
 * Flattening here (rather than nesting components) is what lets the caller hand a single flat
 * list to a virtualiser: with 3 options the backend allows up to 2000 variations, and every one
 * of them carries live inputs.
 */
export type FlatRow<TRow> =
  | { kind: 'group'; group: VariantGroup<TRow> }
  | { kind: 'leaf'; row: TRow; group: VariantGroup<TRow> };

export function flattenGroups<TRow>(
  groups: Array<VariantGroup<TRow>>,
  expandedKeys: ReadonlySet<string>,
): Array<FlatRow<TRow>> {
  const out: Array<FlatRow<TRow>> = [];
  for (const group of groups) {
    if (!group.isBranch) {
      // Flat group: its leaves stand on their own, with no parent row above them.
      for (const row of group.rows) out.push({ kind: 'leaf', row, group });
      continue;
    }
    out.push({ kind: 'group', group });
    if (expandedKeys.has(group.key)) {
      for (const row of group.rows) out.push({ kind: 'leaf', row, group });
    }
  }
  return out;
}
