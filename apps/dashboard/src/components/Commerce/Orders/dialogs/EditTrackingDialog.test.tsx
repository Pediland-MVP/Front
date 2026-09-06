import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';

import { EditTrackingDialog } from './EditTrackingDialog';

const copy = messages.Commerce.Orders.dialogs.tracking;

const renderEdit = (current: string | null, result: boolean = true) => {
  const onConfirm = vi.fn().mockResolvedValue(result);
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <EditTrackingDialog open current={current} onOpenChange={vi.fn()} onConfirm={onConfirm} />
    </NextIntlClientProvider>,
  );
  return onConfirm;
};

describe('EditTrackingDialog', () => {
  it('pre-fills the field with the current code, so a seller corrects a typo rather than retyping', () => {
    renderEdit('RA123456785IR');
    expect(screen.getByTestId('tracking-code')).toHaveValue('RA123456785IR');
  });

  it('starts blank when the order has no code yet', () => {
    renderEdit(null);
    expect(screen.getByTestId('tracking-code')).toHaveValue('');
  });

  it('defaults the notify checkbox to unchecked', () => {
    renderEdit(null);
    expect(screen.getByTestId('tracking-notify')).not.toBeChecked();
  });

  it('does not notify the buyer unless asked', async () => {
    const onConfirm = renderEdit(null);
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: 'RA123456785IR' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('tracking-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith('RA123456785IR', false);
  });

  it('notifies when the box is ticked', async () => {
    const onConfirm = renderEdit(null);
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: 'RA123456785IR' },
    });
    fireEvent.click(screen.getByTestId('tracking-notify'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('tracking-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith('RA123456785IR', true);
  });

  it('normalizes Persian digits to English as the seller types (CLAUDE.md §18)', () => {
    renderEdit(null);
    fireEvent.change(screen.getByTestId('tracking-code'), { target: { value: '۹۸۷۶۵۴' } });
    expect(screen.getByTestId('tracking-code')).toHaveValue('987654');
  });

  it('rejects a code containing spaces or punctuation, same as ShipOrderDialog', () => {
    const onConfirm = renderEdit('RA123456785IR');
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: 'not a code!' },
    });
    fireEvent.click(screen.getByTestId('tracking-confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('rejects an empty code -- unlike ShipOrderDialog, there is no "no code yet" fallback once this dialog is open', () => {
    const onConfirm = renderEdit('RA123456785IR');
    fireEvent.change(screen.getByTestId('tracking-code'), { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('tracking-confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // M5: same shared `isValidFollowUpCode` as ShipOrderDialog -- a code over the 50-char column
  // limit is rejected here too, before it ever reaches the server.
  it('rejects a code longer than 50 characters, even though it is otherwise well-formed', () => {
    const onConfirm = renderEdit('RA123456785IR');
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: 'A'.repeat(51) },
    });
    fireEvent.click(screen.getByTestId('tracking-confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('closes once the write lands', async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <EditTrackingDialog
          open
          current="RA123456785IR"
          onOpenChange={onOpenChange}
          onConfirm={onConfirm}
        />
      </NextIntlClientProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('tracking-confirm'));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the typed code and stays open when the write fails', async () => {
    renderEdit('RA123456785IR', false);
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: 'RA999999999IR' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('tracking-confirm'));
    });

    expect(screen.getByTestId('tracking-code')).toHaveValue('RA999999999IR');
    await waitFor(() => {
      expect(screen.getByTestId('tracking-confirm')).toBeEnabled();
    });
  });
});
