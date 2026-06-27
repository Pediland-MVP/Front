export default function e2pNumbers(value: string) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return value.replace(/\d/g, (d) => persianDigits[Number.parseInt(d)]);
}
