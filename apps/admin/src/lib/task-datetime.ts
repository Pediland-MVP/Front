import dayjs from "@/lib/dayjs-jalali";

export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export function addToToday(amount: number, unit: "day" | "month"): Date {
  return dayjs().tz("Asia/Tehran").add(amount, unit).toDate();
}

export function recommendedDateLabel(amount: number, unit: "day" | "month"): string {
  const d = dayjs().tz("Asia/Tehran").add(amount, unit).calendar("jalali");
  const day = d.format("D"); // localized (Persian) digits via fa locale
  const monthIdx = Number(d.format("M")) - 1; // 1..12 Jalali month -> 0-based
  return `${day} ${JALALI_MONTHS[monthIdx]}`;
}

// Tehran wall-clock date + "HH:mm" -> true UTC instant ISO string.
export function buildActionDateISO(date: Date, time: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const [hh = "09", mm = "00"] = (time || "09:00").split(":");
  return dayjs.tz(`${y}-${m}-${d} ${hh}:${mm}`, "Asia/Tehran").utc().toISOString();
}

export function formatTaskDate(iso: string): string {
  return dayjs(iso).tz("Asia/Tehran").calendar("jalali").format("YYYY/MM/DD HH:mm");
}
