import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';

import { RejectPaymentDialog } from './RejectPaymentDialog';

const copy = messages.Commerce.Orders;

const renderReject = () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <RejectPaymentDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />
    </NextIntlClientProvider>,
  );
  return onConfirm;
};

describe('RejectPaymentDialog', () => {
  it('warns that the buyer reads this text and that reject is terminal', () => {
    renderReject();
    expect(screen.getByText(copy.dialogs.reject.buyerSees)).toBeInTheDocument();
    expect(screen.getByText(copy.dialogs.reject.terminal)).toBeInTheDocument();
  });

  it('fills the textarea when a preset is tapped, and leaves it editable', () => {
    renderReject();
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.presetUnreadable }));
    const box = screen.getByRole('textbox');
    expect(box).toHaveValue(copy.dialogs.reject.presetUnreadable);
    fireEvent.change(box, { target: { value: 'متن دست‌نویس' } });
    expect(box).toHaveValue('متن دست‌نویس');
  });

  it('blocks an empty reason, because the API requires 1..500', () => {
    const onConfirm = renderReject();
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.confirm }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(copy.dialogs.reject.empty)).toBeInTheDocument();
  });

  it('blocks a reason over 500 characters', () => {
    const onConfirm = renderReject();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x'.repeat(501) } });
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.confirm }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(copy.dialogs.reject.tooLong)).toBeInTheDocument();
  });

  it('sends the typed reason when it is valid', async () => {
    const onConfirm = renderReject();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'رسید ناخواناست' } });
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.confirm }));
    expect(onConfirm).toHaveBeenCalledWith('رسید ناخواناست');
  });
});
