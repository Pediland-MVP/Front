'use client'
import dayjs from "@/utils/dayjs-jalali";
import { toJalaali } from "jalaali-js";

// npm i jalaali-js

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * value: ISO/Date/epoch
 * tz: منطقه زمانی هدف (Europe/Berlin یا Asia/Tehran)
 * خروجی: YYYY/MM/DD جلالی (بدون جابه‌جایی روز)
 */
export const toJalaliDate = (
  value: string | number | Date,
  tz: string = "Europe/Berlin"
) => {
  // 1) ورودی Z را به صورت UTC بخوان و به TZ مقصد ببرد
  const d = dayjs.utc(value).tz(tz);

  // 2) سال/ماه/روز میلادیِ محلی را بگیر
  const gy = d.year();
  const gm = d.month() + 1; // dayjs: 0-11 → jalaali-js: 1-12
  const gd = d.date();

  // 3) تبدیل قطعی به جلالی
  const { jy, jm, jd } = toJalaali(gy, gm, gd);

  return `${jy}/${pad(jm)}/${pad(jd)}`;
};

export const toJalaliDateTime = (
  value: string | number | Date,
  tz: string = "Europe/Berlin"
) => {
  const d = dayjs.utc(value).tz(tz);
  const date = toJalaliDate(value, tz);
  const time = d.format("HH:mm");
  return `${date} ${time}`;
};
