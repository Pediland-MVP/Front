// lib/dayjs-jalali.ts

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import jalaliday from 'jalaliday';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fa';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(jalaliday);
dayjs.extend(relativeTime);
dayjs.locale('fa');
dayjs.calendar('jalali');
dayjs.tz.setDefault('Asia/Tehran');

export default dayjs;
