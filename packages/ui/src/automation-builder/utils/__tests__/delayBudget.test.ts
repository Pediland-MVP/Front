import { describe, it, expect } from 'vitest';
import { AutomationContentTypesEnum } from '../../constants/automationContent.enum';
import {
  DELAY_UNIT_MS,
  TOTAL_DELAY_BUDGET_MS,
  availableDelayUnits,
  convertDelayMsAcrossUnit,
  delayUnitOptionsCount,
  exactMagnitudeFor,
  magnitudeOptionsFor,
  remainingDelayBudgetMs,
  sumOtherDelaysMs,
} from '../delayBudget';

const delay = (delayMs: number) => ({ type: AutomationContentTypesEnum.DELAY, delayMs });
const text = () => ({ type: AutomationContentTypesEnum.TEXT, delayMs: null });

describe('delayBudget', () => {
  it('TOTAL_DELAY_BUDGET_MS is exactly 23 hours', () => {
    expect(TOTAL_DELAY_BUDGET_MS).toBe(23 * 60 * 60 * 1000);
  });

  describe('sumOtherDelaysMs', () => {
    it('sums delayMs across DELAY items, excluding the given index', () => {
      const contents = [delay(DELAY_UNIT_MS.hour), delay(DELAY_UNIT_MS.hour * 2), text()];
      expect(sumOtherDelaysMs(contents, 0)).toBe(DELAY_UNIT_MS.hour * 2);
      expect(sumOtherDelaysMs(contents, 1)).toBe(DELAY_UNIT_MS.hour);
    });

    it('ignores non-DELAY items entirely, even if they happen to carry a delayMs value', () => {
      const contents = [{ type: AutomationContentTypesEnum.TEXT, delayMs: 999999 }];
      expect(sumOtherDelaysMs(contents, -1)).toBe(0);
    });

    it('treats a missing/null delayMs on a DELAY item as 0', () => {
      const contents = [{ type: AutomationContentTypesEnum.DELAY, delayMs: null }];
      expect(sumOtherDelaysMs(contents, -1)).toBe(0);
    });

    it('sums every DELAY item when excludeIndex is out of range (brand-new item not yet appended)', () => {
      const contents = [delay(DELAY_UNIT_MS.hour), delay(DELAY_UNIT_MS.hour)];
      expect(sumOtherDelaysMs(contents, contents.length)).toBe(DELAY_UNIT_MS.hour * 2);
    });
  });

  describe('remainingDelayBudgetMs', () => {
    it('is the full 23h budget when there are no other DELAY items', () => {
      expect(remainingDelayBudgetMs([], 0)).toBe(TOTAL_DELAY_BUDGET_MS);
    });

    it('subtracts every other DELAY item, excluding the item at excludeIndex', () => {
      const contents = [delay(DELAY_UNIT_MS.hour), delay(0)];
      // Editing item 1: only item 0's 1h counts against the budget.
      expect(remainingDelayBudgetMs(contents, 1)).toBe(TOTAL_DELAY_BUDGET_MS - DELAY_UNIT_MS.hour);
    });

    it('can go negative when other items already exceed the 23h budget (pre-existing over-budget data)', () => {
      const contents = [delay(TOTAL_DELAY_BUDGET_MS + DELAY_UNIT_MS.hour)];
      expect(remainingDelayBudgetMs(contents, 1)).toBe(-DELAY_UNIT_MS.hour);
    });
  });

  describe('delayUnitOptionsCount', () => {
    it('hour: floors remaining ms to whole hours, no fixed cap beyond the budget itself', () => {
      // One existing 1h delay consumed -> 22h left -> hour select shows 1-22.
      expect(delayUnitOptionsCount(TOTAL_DELAY_BUDGET_MS - DELAY_UNIT_MS.hour, 'hour')).toBe(22);
      expect(delayUnitOptionsCount(TOTAL_DELAY_BUDGET_MS, 'hour')).toBe(23);
    });

    it('min: floors remaining ms to whole minutes, capped at 60 even with a huge remaining budget', () => {
      expect(delayUnitOptionsCount(TOTAL_DELAY_BUDGET_MS, 'min')).toBe(60);
      // 22.5h already consumed elsewhere -> 30 min left -> minute select shows 1-30.
      const remaining = TOTAL_DELAY_BUDGET_MS - (DELAY_UNIT_MS.hour * 22 + DELAY_UNIT_MS.min * 30);
      expect(delayUnitOptionsCount(remaining, 'min')).toBe(30);
    });

    it('sec: floors remaining ms to whole seconds, capped at 60 even with a huge remaining budget', () => {
      expect(delayUnitOptionsCount(TOTAL_DELAY_BUDGET_MS, 'sec')).toBe(60);
      expect(delayUnitOptionsCount(DELAY_UNIT_MS.sec * 45, 'sec')).toBe(45);
    });

    it('returns 0 (never negative) when remaining is 0 or negative', () => {
      expect(delayUnitOptionsCount(0, 'hour')).toBe(0);
      expect(delayUnitOptionsCount(-DELAY_UNIT_MS.hour, 'sec')).toBe(0);
    });

    it('returns 0 when remaining is positive but smaller than one unit of granularity', () => {
      expect(delayUnitOptionsCount(500, 'sec')).toBe(0);
      expect(delayUnitOptionsCount(DELAY_UNIT_MS.min - 1, 'min')).toBe(0);
    });
  });

  describe('magnitudeOptionsFor', () => {
    it('returns 1..N when the current magnitude already fits within the computed range', () => {
      expect(magnitudeOptionsFor(TOTAL_DELAY_BUDGET_MS, 'hour', 5)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
      ]);
    });

    it('inserts the current magnitude when it falls outside the budget-derived range, instead of dropping it', () => {
      // A sibling DELAY item consumed budget after this item's own 23h value was set, so
      // the recomputed range only goes up to 22 — the item's real value (23) must still
      // appear, not silently disappear from the option list.
      const remaining = TOTAL_DELAY_BUDGET_MS - DELAY_UNIT_MS.hour;
      expect(magnitudeOptionsFor(remaining, 'hour', 23)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
      ]);
    });

    it('inserts the current magnitude above the min/sec 60-cap when the stored value exceeds it', () => {
      expect(magnitudeOptionsFor(TOTAL_DELAY_BUDGET_MS, 'sec', 3600)).toContain(3600);
      expect(magnitudeOptionsFor(TOTAL_DELAY_BUDGET_MS, 'sec', 3600).at(-1)).toBe(3600);
    });

    it('ignores a current magnitude of 0 or undefined (no value set yet)', () => {
      expect(magnitudeOptionsFor(DELAY_UNIT_MS.hour * 3, 'hour', 0)).toEqual([1, 2, 3]);
      expect(magnitudeOptionsFor(DELAY_UNIT_MS.hour * 3, 'hour', undefined)).toEqual([1, 2, 3]);
    });

    it('never duplicates the current magnitude when it is already present in the range', () => {
      const options = magnitudeOptionsFor(DELAY_UNIT_MS.hour * 5, 'hour', 3);
      expect(options.filter((n) => n === 3)).toHaveLength(1);
    });
  });

  describe('convertDelayMsAcrossUnit', () => {
    it('preserves the exact delayMs when it remains representable in the new unit (>=1 whole unit)', () => {
      // 2 hours converted to minutes is 120 whole minutes -- well above 1, so the exact
      // millisecond value must be kept untouched, even though the minute select's rendered
      // option range is capped at 60 (that cap is a display concern, not a data-loss trigger).
      expect(convertDelayMsAcrossUnit(DELAY_UNIT_MS.hour * 2, 'min')).toBe(DELAY_UNIT_MS.hour * 2);
    });

    it('preserves an exact multiple of the new unit unchanged', () => {
      expect(convertDelayMsAcrossUnit(DELAY_UNIT_MS.min * 90, 'hour')).toBe(DELAY_UNIT_MS.min * 90);
    });

    it('bumps up to exactly 1 new-unit when the value would round to under 1 in the new unit', () => {
      // 1 second converted to hours would round to 0 whole hours -- unrepresentable, so it's
      // floored up to exactly 1 hour instead of vanishing.
      expect(convertDelayMsAcrossUnit(DELAY_UNIT_MS.sec, 'hour')).toBe(DELAY_UNIT_MS.hour);
    });
  });

  describe('exactMagnitudeFor', () => {
    it('returns the exact whole-number magnitude when delayMs is a clean multiple of unit', () => {
      expect(exactMagnitudeFor(DELAY_UNIT_MS.hour * 2, 'hour')).toBe(2);
      expect(exactMagnitudeFor(DELAY_UNIT_MS.min * 45, 'min')).toBe(45);
    });

    it('returns undefined when delayMs is not an exact multiple of unit, instead of a misleading rounded value', () => {
      // 45 seconds is not a whole number of minutes (0.75) -- must not silently display "1".
      expect(exactMagnitudeFor(45 * DELAY_UNIT_MS.sec, 'min')).toBeUndefined();
      // 90 minutes (1.5h) is not a whole number of hours -- must not silently display "2".
      expect(exactMagnitudeFor(DELAY_UNIT_MS.min * 90, 'hour')).toBeUndefined();
    });

    it('returns undefined for null/undefined delayMs', () => {
      expect(exactMagnitudeFor(null, 'hour')).toBeUndefined();
      expect(exactMagnitudeFor(undefined, 'hour')).toBeUndefined();
    });
  });

  describe('availableDelayUnits', () => {
    it('returns all three units when the full budget is available', () => {
      expect(availableDelayUnits(TOTAL_DELAY_BUDGET_MS)).toEqual(['sec', 'min', 'hour']);
    });

    it('excludes "hour" when less than 1 hour remains, keeping "min"/"sec"', () => {
      // 45 minutes remain -- no room for a whole hour, but min/sec still have room.
      expect(availableDelayUnits(DELAY_UNIT_MS.min * 45)).toEqual(['sec', 'min']);
    });

    it('excludes "hour" and "min" when less than 1 minute remains, keeping only "sec"', () => {
      expect(availableDelayUnits(DELAY_UNIT_MS.sec * 30)).toEqual(['sec']);
    });

    it('returns an empty array when under 1 second remains -- no unit is affordable', () => {
      expect(availableDelayUnits(500)).toEqual([]);
      expect(availableDelayUnits(0)).toEqual([]);
      expect(availableDelayUnits(-1)).toEqual([]);
    });
  });
});
