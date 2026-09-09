import { describe, it, expect } from 'vitest';
import { numberToPersianWords } from './numberToPersianWords';
import { toPersianDigits } from './toPersianDigits';

describe('numberToPersianWords', () => {
  it('renders zero', () => {
    expect(numberToPersianWords(0)).toBe('صفر');
  });

  it('renders units and teens', () => {
    expect(numberToPersianWords(1)).toBe('یک');
    expect(numberToPersianWords(11)).toBe('یازده');
    expect(numberToPersianWords(19)).toBe('نوزده');
  });

  it('renders tens with the ezafe joiner', () => {
    expect(numberToPersianWords(21)).toBe('بیست و یک');
    expect(numberToPersianWords(90)).toBe('نود');
  });

  it('renders hundreds', () => {
    expect(numberToPersianWords(100)).toBe('صد');
    expect(numberToPersianWords(690)).toBe('ششصد و نود');
  });

  it('renders the invoice total from the reference design', () => {
    expect(numberToPersianWords(690_000)).toBe('ششصد و نود هزار');
  });

  it('renders millions and above', () => {
    expect(numberToPersianWords(1_000_000)).toBe('یک میلیون');
    expect(numberToPersianWords(2_450_000)).toBe('دو میلیون و چهارصد و پنجاه هزار');
    expect(numberToPersianWords(1_000_000_000)).toBe('یک میلیارد');
  });

  it('skips empty groups instead of emitting a dangling joiner', () => {
    expect(numberToPersianWords(1_000_500)).toBe('یک میلیون و پانصد');
  });

  it('falls back to an empty string for a non-finite value', () => {
    expect(numberToPersianWords(NaN)).toBe('');
  });
});

describe('toPersianDigits', () => {
  it('converts Latin digits and leaves separators alone', () => {
    expect(toPersianDigits('690,000')).toBe('۶۹۰,۰۰۰');
  });

  it('accepts a number', () => {
    expect(toPersianDigits(1405)).toBe('۱۴۰۵');
  });
});
