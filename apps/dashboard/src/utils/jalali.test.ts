import { describe, it, expect, afterEach } from 'vitest';
import dayjs from 'dayjs';

import { toJalaliDate, toJalaliDateTime } from './jalali';

/**
 * Regression guard for the defect documented in `utils/jalali.ts`'s docstring:
 * `packages/ui/src/lib/dayjs-jalali.ts` calls `dayjs.calendar('jalali')` in its module BODY --
 * a GLOBAL mutation of the shared dayjs default calendar. Any file that imports (directly or
 * transitively, e.g. through the `@/components/ui` barrel) that module flips the default for the
 * whole process, including this module's own `dayjs.utc(value).tz(tz)` chain.
 *
 * These tests reproduce that pollution directly on the shared `dayjs` singleton -- rather than
 * importing `packages/ui` (forbidden for this fix, and unnecessary: the mutation is just
 * `dayjs.calendar('jalali')`) -- and prove `toJalaliDate`/`toJalaliDateTime` still read Gregorian
 * fields regardless, because they pin `.calendar('gregory')` themselves before reading
 * `.year()`/`.month()`/`.date()`/`.hour()`/`.minute()`.
 *
 * If the `.calendar('gregory')` pin in `utils/jalali.ts` is removed, these tests fail: the
 * already-Jalali `.year()` (e.g. 1405) gets run back through `toJalaali()` a second time and
 * produces a year-784 date instead of the current-era one. Verified by hand: removing the pin
 * turned both assertions below into `784/03/21`-shaped failures; restoring the pin made them pass
 * again.
 */
describe('toJalaliDate / toJalaliDateTime stay correct under a polluted global dayjs calendar', () => {
  afterEach(() => {
    // Restore the shared instance to Gregorian so this test's pollution can't leak into any test
    // that runs later in this same file.
    dayjs.calendar('gregory');
  });

  it('still returns a current-era Jalali date after the shared dayjs default calendar is switched to Jalali', () => {
    // Simulates packages/ui/src/lib/dayjs-jalali.ts's module-body mutation.
    dayjs.calendar('jalali');

    expect(toJalaliDate('2026-09-02T10:00:00.000Z')).toBe('1405/06/11');
  });

  it('still formats date+time correctly under the same pollution', () => {
    dayjs.calendar('jalali');

    expect(toJalaliDateTime('2026-09-02T10:00:00.000Z')).toMatch(/^1405\/06\/11 \d{2}:\d{2}$/);
  });
});
