import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

import { ChooseProductKindDialog } from './ChooseProductKindDialog';

const copy = messages.Commerce.List.ChooseKind;

const renderDialog = (onOpenChange = vi.fn()) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ChooseProductKindDialog open onOpenChange={onOpenChange} />
    </NextIntlClientProvider>,
  );
  return onOpenChange;
};

describe('ChooseProductKindDialog', () => {
  it('shows both cards with their copy', () => {
    renderDialog();
    expect(screen.getByText(copy.physicalTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.physicalDescription)).toBeInTheDocument();
    expect(screen.getByText(copy.digitalTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.digitalDescription)).toBeInTheDocument();
  });

  it('navigates to the physical editor and closes on that card', () => {
    const onOpenChange = renderDialog();
    fireEvent.click(screen.getByText(copy.physicalTitle));
    expect(push).toHaveBeenCalledWith('/products/add?kind=physical');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('navigates to the digital editor and closes on that card', () => {
    const onOpenChange = renderDialog();
    fireEvent.click(screen.getByText(copy.digitalTitle));
    expect(push).toHaveBeenCalledWith('/products/add?kind=digital');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
