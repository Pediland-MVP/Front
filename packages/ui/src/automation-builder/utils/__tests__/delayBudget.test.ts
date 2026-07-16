import { describe, it, expect } from 'vitest';
import { AutomationContentTypesEnum } from '../../constants/automationContent.enum';
import {
  DELAY_UNIT_MS,
  TOTAL_DELAY_BUDGET_MS,
  delayUnitOptionsCount,
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
});
