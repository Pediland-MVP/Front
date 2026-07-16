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
