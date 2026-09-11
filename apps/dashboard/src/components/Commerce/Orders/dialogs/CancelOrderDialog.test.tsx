import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';

import { CancelOrderDialog } from './CancelOrderDialog';

const copy = messages.Commerce.Orders;

const renderCancel = () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <CancelOrderDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />
    </NextIntlClientProvider>,
  );
  return onConfirm;
};

describe('CancelOrderDialog', () => {
  it('is a confirmation, not a reason picker', () => {
    renderCancel();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText(copy.dialogs.cancel.description)).toBeInTheDocument();
  });

  it('confirms with no argument -- the reason is fixed at the call site', () => {
    const onConfirm = renderCancel();
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.cancel.confirm }));
    expect(onConfirm).toHaveBeenCalledWith();
  });
});
