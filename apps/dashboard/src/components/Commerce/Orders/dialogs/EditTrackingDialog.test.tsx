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
  it('pre-fills the field with the current link, so a seller corrects a typo rather than retyping', () => {
    renderEdit('https://tracking.post.ir/abc');
    expect(screen.getByTestId('tracking-url')).toHaveValue('https://tracking.post.ir/abc');
  });

  it('starts blank when the order has no link yet', () => {
    renderEdit(null);
    expect(screen.getByTestId('tracking-url')).toHaveValue('');
  });

  it('defaults the notify checkbox to unchecked', () => {
    renderEdit(null);
    expect(screen.getByTestId('tracking-notify')).not.toBeChecked();
  });

  it('does not notify the buyer unless asked', async () => {
    const onConfirm = renderEdit(null);
    fireEvent.change(screen.getByTestId('tracking-url'), {
      target: { value: 'https://a.example/1' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('tracking-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith('https://a.example/1', false);
  });

  it('notifies when the box is ticked', async () => {
    const onConfirm = renderEdit(null);
    fireEvent.change(screen.getByTestId('tracking-url'), {
      target: { value: 'https://a.example/1' },
    });
    fireEvent.click(screen.getByTestId('tracking-notify'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('tracking-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith('https://a.example/1', true);
  });

  it('rejects a url that is not http(s), same as ShipOrderDialog', () => {
    const onConfirm = renderEdit('https://a.example/1');
    fireEvent.change(screen.getByTestId('tracking-url'), {
      target: { value: 'javascript:alert(1)' },
    });
    fireEvent.click(screen.getByTestId('tracking-confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('rejects an empty url -- unlike ShipOrderDialog, there is no "no link yet" fallback once this dialog is open', () => {
    const onConfirm = renderEdit('https://a.example/1');
    fireEvent.change(screen.getByTestId('tracking-url'), { target: { value: '   ' } });
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
          current="https://a.example/1"
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

  it('keeps the typed url and stays open when the write fails', async () => {
    renderEdit('https://a.example/1', false);
    fireEvent.change(screen.getByTestId('tracking-url'), {
      target: { value: 'https://a.example/2' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('tracking-confirm'));
    });

    expect(screen.getByTestId('tracking-url')).toHaveValue('https://a.example/2');
    await waitFor(() => {
      expect(screen.getByTestId('tracking-confirm')).toBeEnabled();
    });
  });
});
