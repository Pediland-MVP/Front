// src/utils/dayjs-jalali.ts

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import jalaliday from 'jalaliday';

dayjs.extend(utc);
dayjs.extend(timezone);
// `utils/jalali.ts` reads Gregorian date fields via `Intl.DateTimeFormat` instead of dayjs's own
// `.year()`/`.month()`/`.date()`, precisely so it does NOT depend on this plugin or on dayjs's
// calendar flag at all (see that file's docstring for why -- `.calendar('gregory')` does not
// compose safely with `.tz()` here). This module itself never calls `dayjs.calendar('jalali')`,
// so it stays Gregorian by default. The plugin is extended here only so `.calendar()` EXISTS on
// the shared dayjs singleton for `jalali.test.ts` to call, simulating the real-world pollution
// that `packages/ui/src/lib/dayjs-jalali.ts` causes in production without importing that module.
dayjs.extend(jalaliday);

export default dayjs;
