// src/utils/jalali.ts
import dayjs from '@/utils/dayjs-jalali';
import { toJalaali } from 'jalaali-js';

// npm i jalaali-js

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * چرا از `Intl.DateTimeFormat` استفاده می‌کنیم، نه `.calendar('gregory')` روی خودِ chain:
 *
 * `packages/ui/src/lib/dayjs-jalali.ts` در بدنه ماژول خودش `dayjs.calendar('jalali')` را صدا
 * می‌زند -- یعنی تقویم پیش‌فرض dayjs را برای کل برنامه، به صورت global، عوض می‌کند. هر فایلی که
 * (مستقیم یا غیرمستقیم، مثلاً از طریق بارِل `@/components/ui`) آن ماژول را ایمپورت کند، همین
 * mutation را روی نمونه global دایجیت فعال می‌کند. این ماژول فرض می‌کند `.year()`/`.month()`/
 * `.date()` مقدار میلادی برمی‌گردانند تا بعد آن را دستی به جلالی تبدیل کند (`toJalaali`)؛ اگر
 * تقویم global از قبل جلالی شده باشد، این مقدارها از قبل جلالی هستند و تبدیل دوباره روی آن‌ها سال
 * ۷۸۴ می‌سازد.
 *
 * راه‌حل بدیهی، زنجیره‌کردن `.calendar('gregory')` است -- اما آن راه با `.tz(tz)` این فایل با هم
 * درست کار نمی‌کند: پلاگین `jalaliday` متد `.calendar()` را با `this.clone()` پیاده کرده، و آن
 * clone یک شیء dayjs کاملاً تازه از `this.toDate()` می‌سازد که offset ناحیه‌زمانیِ `.tz(tz)`
 * (یعنی `$x.$timezone`) را با خودش نمی‌آورد -- در نتیجه زمان به‌جای TZ درخواستی، با TZ سیستم
 * فرمت می‌شود. تست شد: `dayjs.utc(v).tz('Europe/Berlin').calendar('gregory')` وقتی TZ سیستم
 * Asia/Tehran بود، ساعت را با آفست تهران (+۰۳:۳۰) برگرداند، نه برلین -- یک باگ ساکت که کاملاً
 * جدا از پاکسازی global است.
 *
 * `Intl.DateTimeFormat` مقدار سال/ماه/روزِ میلادیِ TZ هدف را مستقیماً از لحظه مطلق (epoch) می‌خواند؛
 * نه به `$C` (پرچم تقویم دایجیت) وابسته است، نه از باگ clone بالا آسیب می‌بیند. این را با
 * `d.year()`/`d.month()`/`d.date()` جایگزین نکن.
 */
const gregorianYMD = (date: Date, tz: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { gy: part('year'), gm: part('month'), gd: part('day') };
};

/**
 * value: ISO/Date/epoch
 * tz: منطقه زمانی هدف (Europe/Berlin یا Asia/Tehran)
 * خروجی: YYYY/MM/DD جلالی (بدون جابه‌جایی روز)
 */
export const toJalaliDate = (value: string | number | Date, tz: string = 'Europe/Berlin') => {
  // 1) ورودی را به صورت لحظه مطلق (epoch) بخوان
  const instant = dayjs.utc(value).toDate();

  // 2) سال/ماه/روز میلادیِ TZ مقصد را بگیر -- مستقل از پرچم تقویم global (بالا را ببین)
  const { gy, gm, gd } = gregorianYMD(instant, tz);

  // 3) تبدیل قطعی به جلالی
  const { jy, jm, jd } = toJalaali(gy, gm, gd);

  return `${jy}/${pad(jm)}/${pad(jd)}`;
};

export const toJalaliDateTime = (value: string | number | Date, tz: string = 'Europe/Berlin') => {
  const date = toJalaliDate(value, tz);
  // `.format('HH:mm')` امن است: پلاگین jalaliday فقط توکن‌های سال/ماه/روز را زیر تقویم جلالی
  // بازنویسی می‌کند، توکن‌های ساعت/دقیقه همیشه از فرمت‌کننده اصلی dayjs عبور می‌کنند -- یعنی حتی
  // زیر پاک‌سازی global هم مقدار درست را می‌دهند. با این حال `.tz(tz)` (بدون `.calendar()` بعد
  // از آن) به کار می‌رود چون خودِ `.tz()` تنها زمانی درست کار می‌کند که چیزی بعدش آن را clone
  // نکرده باشد -- دقیقاً همان چیزی که بالا توضیح داده شد.
  const time = dayjs.utc(value).tz(tz).format('HH:mm');
  return `${date} ${time}`;
};
