const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
// Index = how many thousand-groups from the right.
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'بیلیون'];

const JOIN = ' و ';

/** 1..999 → words. Returns '' for 0 so callers can drop the group entirely. */
function tripletToWords(n: number): string {
  const parts: string[] = [];

  const hundreds = Math.floor(n / 100);
  const rest = n % 100;

  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);

  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10]);
  } else {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    if (tens > 0) parts.push(TENS[tens]);
    if (ones > 0) parts.push(ONES[ones]);
  }

  return parts.join(JOIN);
}

/**
 * Persian words for the «به حروف» line of an invoice. The unit («تومان») is the
 * caller's to append — this returns the number alone.
 */
export function numberToPersianWords(value: number): string {
  if (!Number.isFinite(value)) return '';

  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'صفر';

  // Split into thousand-groups, least significant first.
  const groups: number[] = [];
  let remaining = n;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const words: string[] = [];
  // Walk most-significant first so the words come out in reading order.
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    // An empty group contributes nothing — without this, 1_000_500 would emit a
    // dangling joiner where the thousands group should be.
    if (group === 0) continue;

    const scale = SCALES[i] ?? '';
    words.push(scale ? `${tripletToWords(group)} ${scale}` : tripletToWords(group));
  }

  const result = words.join(JOIN);
  return value < 0 ? `منفی ${result}` : result;
}
