/**
 * Bulk price/stock maths for the variations table's selection bar.
 *
 * Pure so the rounding and skip rules are testable on their own — they are the part users
 * notice when they get them wrong ("why is this one still 420,000?").
 */

export type BulkPriceMode = 'set' | 'increase' | 'decrease';

/** Prices are toman; a percentage change lands on a round figure, not 431,247. */
const PRICE_ROUNDING_STEP = 1000;

export interface BulkPriceResult {
  /** New price, or `null` to leave the row untouched. */
  price: number | null;
  /** True when the row was skipped because a percentage change had nothing to apply to. */
  skipped: boolean;
}

/**
 * One row's new price under a bulk edit.
 *
 * `set` writes the value to every selected row, including rows that had no price — that is the
 * whole point of it, and the main way a merchant fills a freshly generated table.
 *
 * `increase`/`decrease` are relative, so a row with no price has nothing to be relative TO. It
 * is skipped and reported, rather than silently treated as 0 — which would turn "+10%" into
 * "now costs 0" on exactly the rows the merchant had not got to yet.
 */
export function bulkPrice(
  current: number | null,
  mode: BulkPriceMode,
  amount: number,
): BulkPriceResult {
  if (mode === 'set') return { price: amount, skipped: false };
  if (current == null) return { price: null, skipped: true };

  const factor = mode === 'increase' ? 1 + amount / 100 : 1 - amount / 100;
  const raw = current * factor;

  // Clamped at zero: a decrease over 100% would otherwise produce a negative price, which the
  // database rejects outright (CHECK "price" >= 0) — the merchant would fill in a whole table
  // and only find out on save.
  const rounded = Math.round(Math.max(raw, 0) / PRICE_ROUNDING_STEP) * PRICE_ROUNDING_STEP;
  return { price: rounded, skipped: false };
}

export interface BulkPriceSummary<TRow> {
  rows: TRow[];
  changedCount: number;
  skippedCount: number;
}

/** Applies {@link bulkPrice} across a selection, reporting how many rows it could not touch. */
export function applyBulkPrice<TRow>(
  rows: TRow[],
  isSelected: (row: TRow) => boolean,
  getPrice: (row: TRow) => number | null,
  setPrice: (row: TRow, price: number) => TRow,
  mode: BulkPriceMode,
  amount: number,
): BulkPriceSummary<TRow> {
  let changedCount = 0;
  let skippedCount = 0;

  const next = rows.map((row) => {
    if (!isSelected(row)) return row;
    const { price, skipped } = bulkPrice(getPrice(row), mode, amount);
    if (skipped) {
      skippedCount += 1;
      return row;
    }
    changedCount += 1;
    return setPrice(row, price as number);
  });

  return { rows: next, changedCount, skippedCount };
}

/**
 * Indexes of the rows a fill-down covers: the origin and everything below it **within its own
 * group**.
 *
 * Group-scoped on purpose — filling "۴۲" 's price down should not leak into the next colour.
 * Returns an empty list when the origin is the last row, so the caller can skip a no-op toast.
 */
export function fillDownTargets<TRow>(groupRows: TRow[], originIndex: number): TRow[] {
  if (originIndex < 0 || originIndex >= groupRows.length) return [];
  const targets = groupRows.slice(originIndex);
  return targets.length > 1 ? targets : [];
}
