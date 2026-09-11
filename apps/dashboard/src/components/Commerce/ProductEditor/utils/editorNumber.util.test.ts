import { describe, it, expect } from 'vitest';
import { parseAmount, formatAmount, formatAmountInPlace, formatCount } from './editorNumber.util';

describe('parseAmount', () => {
  it('reads Persian digits as an English number', () => {
    expect(parseAmount('۴۲۰۰۰۰')).toBe(420000);
  });

  it('ignores thousand separators and stray characters', () => {
    expect(parseAmount('۴۲۰,۰۰۰ تومان')).toBe(420000);
  });

  it('returns null for an empty field, because a blank price is a real state', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('   ')).toBeNull();
  });

  it('returns 0 for a literal zero rather than null', () => {
    expect(parseAmount('۰')).toBe(0);
  });
});

describe('formatAmount', () => {
  it('renders Persian digits with separators', () => {
    expect(formatAmount(420000)).toBe('۴۲۰٬۰۰۰');
  });

  it('renders infinite stock as the infinity sign', () => {
    expect(formatAmount(Infinity)).toBe('∞');
  });

  it('renders null as an empty string so the placeholder shows through', () => {
    expect(formatAmount(null)).toBe('');
  });
});

describe('formatCount', () => {
  it('renders a small count in Persian digits', () => {
    expect(formatCount(3)).toBe('۳');
  });
});

describe('formatAmountInPlace', () => {
  /** A bare input node is enough — the helper only touches `value` and the selection. */
  const cell = (value: string, caret = value.length): HTMLInputElement => {
    const element = document.createElement('input');
    element.type = 'text';
    element.value = value;
    element.setSelectionRange(caret, caret);
    return element;
  };

  it('splits a plain digit string as it is typed', () => {
    const element = cell('420000');

    formatAmountInPlace(element);

    expect(element.value).toBe('۴۲۰٬۰۰۰');
  });

  it('converts Persian digits and drops pasted units and separators', () => {
    const element = cell('۴۲۰,۰۰۰ تومان');

    formatAmountInPlace(element);

    expect(element.value).toBe('۴۲۰٬۰۰۰');
  });

  it('leaves an empty field empty rather than turning it into zero', () => {
    const element = cell('');

    formatAmountInPlace(element);

    expect(element.value).toBe('');
  });

  it('leaves an already-formatted value untouched, selection included', () => {
    const element = cell('۴۲۰٬۰۰۰', 3);

    formatAmountInPlace(element);

    expect(element.value).toBe('۴۲۰٬۰۰۰');
    expect(element.selectionStart).toBe(3);
  });

  /**
   * The caret is put back by DIGIT count, not character index. Counting characters would drift by
   * one for every separator inserted, walking the caret backwards through the number as it grows
   * — after three keystrokes past a separator the merchant would be typing in the wrong place.
   */
  it('keeps the caret on the same digit when a separator is inserted before it', () => {
    // Typing the final "0" of 420000: caret sits after 6 digits, no separators yet.
    const element = cell('420000', 6);

    formatAmountInPlace(element);

    // ۴۲۰٬۰۰۰ — 7 characters, the 6th digit is the last one, so the caret lands at the end.
    expect(element.value).toBe('۴۲۰٬۰۰۰');
    expect(element.selectionStart).toBe(7);
  });

  it('keeps the caret mid-number when editing in the middle', () => {
    // "4200000" with the caret after the 2nd digit → "۴٬۲۰۰٬۰۰۰", still after the 2nd digit.
    const element = cell('4200000', 2);

    formatAmountInPlace(element);

    expect(element.value).toBe('۴٬۲۰۰٬۰۰۰');
    // index 0 = ۴, 1 = ٬, 2 = ۲ → just past the 2nd digit is index 3.
    expect(element.selectionStart).toBe(3);
  });

  it('puts the caret at the start when nothing precedes it', () => {
    const element = cell('420000', 0);

    formatAmountInPlace(element);

    expect(element.selectionStart).toBe(0);
  });
});
