import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import type { ContentItemType } from '../schemas/automationForm';

export type DelayUnit = 'hour' | 'min' | 'sec';

export const DELAY_UNIT_MS: Record<DelayUnit, number> = {
  sec: 1000,
  min: 1000 * 60,
  hour: 1000 * 60 * 60,
};

/** Every automation's `contents` array shares this much total DELAY time — mirrors the
 * backend's per-item `@Max(ONE_HOUR_IN_MS * 23)` cap (see
 * `Back/apps/core/src/contentCycle/dto/createContentCycle.dto.ts`), reinterpreted here as
 * a budget shared across every DELAY item in the array rather than a per-item ceiling. */
export const TOTAL_DELAY_BUDGET_MS = 23 * 60 * 60 * 1000;

type DelayLike = Pick<ContentItemType, 'type' | 'delayMs'>;

const isDelayItem = (content: DelayLike) => content.type === AutomationContentTypesEnum.DELAY;

/** Sums `delayMs` across every DELAY item in `contents` except the one at `excludeIndex`.
 * Pass an out-of-range index (e.g. `contents.length`) when there is no "self" yet — i.e.
 * computing the budget for a brand-new item about to be appended. */
export function sumOtherDelaysMs(contents: DelayLike[], excludeIndex: number): number {
  return contents.reduce((sum, content, i) => {
    if (i === excludeIndex || !isDelayItem(content)) return sum;
    return sum + (content.delayMs ?? 0);
  }, 0);
}

export function remainingDelayBudgetMs(contents: DelayLike[], excludeIndex: number): number {
  return TOTAL_DELAY_BUDGET_MS - sumOtherDelaysMs(contents, excludeIndex);
}

/** How many `1..N` options the value select should offer for `unit`, given `remainingMs`
 * left in the shared budget. `min`/`sec` are always capped at 60 — they're meant as
 * sub-hour granularity, not a way to express e.g. "90 minutes" (that's "1.5 hours" via the
 * hour unit). `hour` has no fixed cap beyond the remaining budget itself (which is always
 * ≤ 23h, since the total budget is 23h). Never returns a negative count. */
export function delayUnitOptionsCount(remainingMs: number, unit: DelayUnit): number {
  const raw = Math.floor(remainingMs / DELAY_UNIT_MS[unit]);
  const capped = unit === 'hour' ? raw : Math.min(60, raw);
  return Math.max(0, capped);
}

/** The `1..N` magnitude options a delay item's select should render for `unit`, given
 * `remainingMs` left in the shared budget. Always includes `currentMagnitude` even when it
 * falls outside the computed `1..N` range (e.g. a sibling DELAY item has since consumed
 * more of the shared budget than when this item's value was set) — the select must always
 * be able to display the item's real stored value, never silently fall back to a blank
 * placeholder for a value that's still valid. */
export function magnitudeOptionsFor(
  remainingMs: number,
  unit: DelayUnit,
  currentMagnitude?: number,
): number[] {
  const maxOptions = delayUnitOptionsCount(remainingMs, unit);
  const options = Array.from({ length: maxOptions }, (_, i) => i + 1);
  if (currentMagnitude != null && currentMagnitude > 0 && !options.includes(currentMagnitude)) {
    options.push(currentMagnitude);
    options.sort((a, b) => a - b);
  }
  return options;
}

/** The `delayMs` to store after switching a delay item to `newUnit`. Preserves the exact
 * original value whenever it remains representable (rounds to at least 1 whole `newUnit`)
 * — merely switching the unit dropdown must never truncate a value the user already
 * configured (e.g. converting a 2-hour delay to "minutes", where `min` options cap at 60,
 * previously silently dropped it to 60 minutes). Only bumps the value up to exactly 1
 * `newUnit` when it would otherwise round to under 1 and so become unrepresentable. */
export function convertDelayMsAcrossUnit(currentDelayMs: number, newUnit: DelayUnit): number {
  const rawMagnitude = Math.round(currentDelayMs / DELAY_UNIT_MS[newUnit]);
  return rawMagnitude < 1 ? DELAY_UNIT_MS[newUnit] : currentDelayMs;
}

/** The exact whole-number magnitude of `delayMs` in `unit`, or `undefined` when `delayMs`
 * isn't an exact multiple of that unit. Used for display: rounding a non-exact value (e.g.
 * 45 seconds shown as "1" while the unit selector reads "minutes") would show a magnitude
 * that doesn't match what's actually stored — safer to show nothing selected than a
 * plausible-looking but wrong number the user might unknowingly re-affirm. */
export function exactMagnitudeFor(
  delayMs: number | null | undefined,
  unit: DelayUnit,
): number | undefined {
  if (delayMs == null) return undefined;
  if (delayMs % DELAY_UNIT_MS[unit] !== 0) return undefined;
  return delayMs / DELAY_UNIT_MS[unit];
}
