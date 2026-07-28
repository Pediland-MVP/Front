import { describe, it, expect } from 'vitest';
import { parseAmount, formatAmount, formatCount } from './editorNumber.util';

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
