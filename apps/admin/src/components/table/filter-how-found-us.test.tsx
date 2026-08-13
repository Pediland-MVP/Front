import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

import { FilterHowFoundUs } from './filter-how-found-us';

const copy = messages.Users;

const renderFilter = (value: string[], onChange: (v: string[]) => void) =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <FilterHowFoundUs value={value} onChange={onChange} />
    </NextIntlClientProvider>,
  );

describe('FilterHowFoundUs', () => {
  beforeEach(() => {
    // Radix Popover reaches for all of these; jsdom implements none of them.
    (Element.prototype as any).hasPointerCapture ??= () => false;
    (Element.prototype as any).setPointerCapture ??= () => {};
    (Element.prototype as any).scrollIntoView ??= () => {};
    (globalThis as any).ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it('shows the generic label while nothing is selected', () => {
    renderFilter([], vi.fn());
    expect(screen.getByText(copy.howFoundUs_filter)).toBeInTheDocument();
  });

  it('lists the selected labels on the trigger', () => {
    renderFilter(['google', 'sms'], vi.fn());
    expect(screen.getByText(`${copy.options.google}، ${copy.options.sms}`)).toBeInTheDocument();
  });

  it('adds a value on select', () => {
    const onChange = vi.fn();
    renderFilter([], onChange);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText(copy.options.google));
    expect(onChange).toHaveBeenCalledWith(['google']);
  });

  it('removes an already-selected value on select', () => {
    const onChange = vi.fn();
    renderFilter(['google', 'sms'], onChange);
    fireEvent.click(screen.getByRole('combobox'));
    // The trigger shows the joined labels, so target the option inside the popover.
    const options = screen.getAllByText(copy.options.google);
    fireEvent.click(options[options.length - 1]);
    expect(onChange).toHaveBeenCalledWith(['sms']);
  });
});
