import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';

import { RejectPaymentDialog } from './RejectPaymentDialog';

const copy = messages.Commerce.Orders;

const renderReject = (result: boolean = true) => {
  // `true` means "the write landed" -- the dialog clears itself only on that.
  const onConfirm = vi.fn().mockResolvedValue(result);
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

  it('blocks a whitespace-only reason, because it cannot be delivered as an Instagram DM', () => {
    // Meta's send API rejects whitespace-only text (error 100 / subcode 2534052). A reason of
    // only spaces would pass the backend's @MinLength(1) but never reach the buyer, while the
    // order is already cancelled and terminal -- so this dialog is stricter than the DTO.
    const onConfirm = renderReject();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
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

  it('sends the trimmed reason when it is valid', async () => {
    const onConfirm = renderReject();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  رسید ناخواناست  ' } });
    // Wrapped in act so the awaited onConfirm + its finally settle before the test ends,
    // instead of leaking a pending state update into whichever test runs next.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.confirm }));
    });
    expect(onConfirm).toHaveBeenCalledWith('رسید ناخواناست');
  });

  it('re-enables the button and clears the textarea and error once confirm resolves', async () => {
    renderReject();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'رسید ناخواناست' } });

    // Wrap the click so the confirm button's async handler is allowed to run to completion
    // (including its `finally`) before we assert -- without this, `isSubmitting`/`reset()`
    // resolve after the test body has already finished reading the DOM.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.confirm }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: copy.dialogs.reject.confirm })).toBeEnabled();
    });
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.queryByText(copy.dialogs.reject.empty)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.dialogs.reject.tooLong)).not.toBeInTheDocument();
  });

  /**
   * The failure path this dialog exists to protect. A transport error resolves `false`; the text
   * the seller typed must survive, because it is up to 500 characters of prose the buyer will
   * read and there is no way to get it back once cleared.
   */
  it('keeps the typed reason when the confirm reports failure', async () => {
    renderReject(false);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'رسید ناخواناست' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: copy.dialogs.reject.confirm }));
    });

    expect(screen.getByRole('textbox')).toHaveValue('رسید ناخواناست');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: copy.dialogs.reject.confirm })).toBeEnabled();
    });
  });
});
