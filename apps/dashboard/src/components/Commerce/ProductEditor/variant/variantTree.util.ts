/**
 * The pure part of the variant table: which axes exist, which combinations they imply, how a
 * parent row rolls its children up, and which rows have gone stale after an axis edit.
 *
 * No React import. The roll-up and regeneration rules are the easiest thing on this page to get
 * subtly wrong, and keeping them here means they can be exercised without rendering anything.
 */

export interface TreeAxis {
  id: string;
  values: Array<{ id: string }>;
}

export interface TreeRow {
  /** One option-value id per axis, in axis order. */
  valueIds: string[];
  price: number | null;
  compare: number | null;
  stock: number | null;
  infinite: boolean;
}

/** Only options that actually have values take part in the cartesian product. */
export const axesOf = <A extends TreeAxis>(options: A[]): A[] =>
  options.filter((option) => option.values.length > 0);

/**
 * Canonical identity of a combination. Order-sensitive on purpose: the axis order IS part of the
 * key space, so reordering axes invalidates every key — which is why callers clear their
 * suppressed list when an axis moves.
 */
export const comboKey = (valueIds: readonly string[]): string => valueIds.join('|');

/** The tree's first level is the first axis. `'all'` is the single group of an axis-less product. */
export const topKeyOf = (valueIds: readonly string[]): string => valueIds[0] ?? 'all';

/** Every combination the current axes imply, in axis order. */
export const combosOf = (axes: TreeAxis[]): string[][] => {
  const live = axesOf(axes);
  if (!live.length) return [];
  let out: string[][] = [[]];
  for (const axis of live) {
    const next: string[][] = [];
    for (const partial of out) {
      for (const value of axis.values) next.push([...partial, value.id]);
    }
    out = next;
  }
  return out;
};

/**
 * Combinations with no row yet, minus the ones the merchant deleted on purpose.
 *
 * Without the `suppressed` filter the caller would regenerate every row it just removed, so the
 * delete buttons would appear to do nothing — which is exactly what the source design does.
 */
export const missingCombos = (
  axes: TreeAxis[],
  rows: Array<Pick<TreeRow, 'valueIds'>>,
  suppressed: readonly string[],
): string[][] => {
  const have = new Set(rows.map((row) => comboKey(row.valueIds)));
  const skip = new Set(suppressed);
  return combosOf(axes).filter((combo) => {
    const key = comboKey(combo);
    return !have.has(key) && !skip.has(key);
  });
};

/**
 * A row's `valueIds` re-sorted into the CURRENT axis order, or `null` when the row does not carry
 * exactly one live value per axis.
 *
 * This exists because `valueIds` is positional — slot `i` belongs to axis `i` — so MOVING an axis
 * invalidates every row's array even though not one combination has changed. Without this, a
 * cosmetic "move up" click makes `orphanRowIndexes` flag every row in the product, and the
 * regeneration that follows drops every variant id and every field that has no control on this
 * page (sku, weight, the sale window, isActive). Reordering in place instead keeps the rows
 * exactly as they are; only the order inside each array changes.
 *
 * `null` is returned for a genuine orphan — a row that predates an axis, points at a value that
 * has since been deleted, or somehow carries two values from the same axis. That set is exactly
 * what `orphanRowIndexes` reports, so a caller that realigns first can keep using it unchanged.
 */
export const realignValueIds = (axes: TreeAxis[], valueIds: readonly string[]): string[] | null => {
  const live = axesOf(axes);
  if (valueIds.length !== live.length) return null;

  const axisOfValue = new Map<string, number>();
  live.forEach((axis, axisIndex) =>
    axis.values.forEach((value) => axisOfValue.set(value.id, axisIndex)),
  );

  const slots: Array<string | null> = new Array(live.length).fill(null);
  for (const valueId of valueIds) {
    const axisIndex = axisOfValue.get(valueId);
    // Unknown value, or a second value claiming an axis that is already filled.
    if (axisIndex == null || slots[axisIndex] != null) return null;
    slots[axisIndex] = valueId;
  }
  return slots.every((id): id is string => id != null) ? (slots as string[]) : null;
};

/**
 * Rows that no longer describe a valid combination — either they predate an axis (too few ids)
 * or they point at a value that has since been deleted. Returned as INDEXES so the caller can
 * feed them straight to react-hook-form's `remove()`.
 */
export const orphanRowIndexes = (
  axes: TreeAxis[],
  rows: Array<Pick<TreeRow, 'valueIds'>>,
): number[] => {
  const live = axesOf(axes);
  const allowed = live.map((axis) => new Set(axis.values.map((value) => value.id)));
  const orphans: number[] = [];
  rows.forEach((row, index) => {
    if (row.valueIds.length !== live.length) {
      orphans.push(index);
      return;
    }
    if (row.valueIds.some((valueId, axisIndex) => !allowed[axisIndex].has(valueId))) {
      orphans.push(index);
    }
  });
  return orphans;
};

export type Aggregate =
  | { state: 'empty'; missing: number }
  | { state: 'uniform'; value: number }
  | { state: 'mixed'; min: number; max: number; missing: number };

/**
 * Rolls a parent row up from its children.
 *
 * `Infinity` stands in for ∞ stock so a group mixing "۵" and "∞" reports as mixed rather than
 * pretending the ∞ rows are blank. A group where some children are blank is ALSO mixed even if
 * the known values agree — showing "۱۰۰ → ۱۰۰" would hide the blanks.
 */
export const aggregate = (rows: TreeRow[], field: 'price' | 'compare' | 'stock'): Aggregate => {
  const values = rows.map((row) =>
    field === 'stock' && row.infinite ? Infinity : (row[field] as number | null),
  );
  const known = values.filter((value): value is number => value != null);
  if (!known.length) return { state: 'empty', missing: values.length };
  const min = Math.min(...known);
  const max = Math.max(...known);
  const missing = values.length - known.length;
  if (!missing && min === max) return { state: 'uniform', value: min };
  return { state: 'mixed', min, max, missing };
};

export const discountPercent = (price: number | null, compare: number | null): number | null =>
  price != null && compare != null && compare > price
    ? Math.round((1 - price / compare) * 100)
    : null;
