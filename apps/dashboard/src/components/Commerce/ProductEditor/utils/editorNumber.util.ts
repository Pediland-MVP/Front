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
