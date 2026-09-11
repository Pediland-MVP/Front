import p2eNumbers from '@/utils/p2eNumber';

/**
 * Every numeric cell in the editor is a TEXT input (CLAUDE.md §18): the merchant types Persian
 * digits, which `<input type="number">` blanks before they can be converted.
 *
 * `parseAmount` is the single place raw input becomes a number; `formatAmount` the single place
 * a number becomes the Persian text shown back.
 */

/** `null` for an empty field — a blank price is a real state in this editor, not zero. */
export const parseAmount = (raw: string): number | null => {
  // p2eNumbers maps ۰-۹ to 0-9 and strips every non-digit, so separators and units fall away.
  const digits = p2eNumbers(String(raw ?? ''));
  return digits === '' ? null : Number(digits);
};

/** Persian digits with thousand separators. `Infinity` renders as ∞ (untracked stock). */
export const formatAmount = (value: number | null | undefined): string => {
  if (value == null) return '';
  if (value === Infinity) return '∞';
  return value.toLocaleString('fa-IR');
};

/** Persian digits for a count inside a sentence ("۳ تنوع"). */
export const formatCount = (value: number): string => value.toLocaleString('fa-IR');

/** Non-global on purpose: a `/g` regex carries `lastIndex` between `.test()` calls. */
const DIGIT = /[0-9۰-۹]/;

/**
 * Reformats an amount input IN PLACE, for the UNCONTROLLED grid cells.
 *
 * A controlled card (`BasePriceSection`) re-renders with `value={formatAmount(...)}` on every
 * keystroke, so its separators are never gone for more than a frame. The grid cells are
 * `register`ed and uncontrolled — that is what keeps 2000 rows responsive — so nothing re-renders
 * them while typing, and `onInputP2EHandler` had just stripped every non-digit, separators
 * included. The number therefore grew as a bare digit string and only "split" on blur.
 *
 * Runs on `onInput`, i.e. BEFORE react-hook-form's `onChange` reads the value (CLAUDE.md §18) —
 * safe, because the cell registers `setValueAs: parseAmount`, which strips separators again.
 */
export const formatAmountInPlace = (element: HTMLInputElement): void => {
  const raw = element.value;
  const next = formatAmount(parseAmount(raw));
  if (next === raw) return;

  // Count DIGITS before the caret, not characters: the separators about to be inserted shift
  // every character index after them, so a character count would drift by one per separator and
  // walk the caret backwards through the number as it grows.
  const caret = element.selectionStart ?? raw.length;
  const digitsBefore = p2eNumbers(raw.slice(0, caret)).length;

  element.value = next;

  let position = 0;
  if (digitsBefore > 0) {
    let seen = 0;
    position = next.length;
    for (let i = 0; i < next.length; i += 1) {
      if (DIGIT.test(next[i])) {
        seen += 1;
        if (seen === digitsBefore) {
          position = i + 1;
          break;
        }
      }
    }
  }
  element.setSelectionRange(position, position);
};
