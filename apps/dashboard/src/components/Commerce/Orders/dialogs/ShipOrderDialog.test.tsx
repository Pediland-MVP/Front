import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';

import { ShipOrderDialog } from './ShipOrderDialog';

const copy = messages.Commerce.Orders.dialogs.ship;

const renderShip = (shippingKind: string | null, result: boolean = true) => {
  const onConfirm = vi.fn().mockResolvedValue(result);
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ShipOrderDialog
        open
        shippingKind={shippingKind}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    </NextIntlClientProvider>,
  );
  return onConfirm;
};

describe('ShipOrderDialog', () => {
  it('offers a tracking code field for a posted order', () => {
    renderShip('post_express');
    expect(screen.getByTestId('tracking-code')).toBeInTheDocument();
  });

  it('hides the tracking code field for a pickup -- there is no parcel', () => {
    renderShip('pickup');
    expect(screen.queryByTestId('tracking-code')).toBeNull();
  });

  it('shows pickup-specific copy instead of "posted" wording', () => {
    renderShip('pickup');
    expect(screen.getByText(copy.titlePickup)).toBeInTheDocument();
    expect(screen.getByText(copy.descriptionPickup)).toBeInTheDocument();
  });

  it('tells the seller the tracking code is sent to the buyer as a DM', () => {
    renderShip('post_express');
    expect(screen.getByText(copy.codeHint)).toBeInTheDocument();
  });

  it('confirms with no code when the field is left blank', async () => {
    const onConfirm = renderShip('post_express');
    await act(async () => {
      fireEvent.click(screen.getByTestId('ship-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it('confirms with the trimmed code when it is valid', async () => {
    const onConfirm = renderShip('post_express');
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: '  RA123456785IR  ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('ship-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith('RA123456785IR');
  });

  it('normalizes Persian digits to English as the seller types (CLAUDE.md §18)', async () => {
    const onConfirm = renderShip('post_express');
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: '۱۲۳۴۵۶' },
    });
    expect(screen.getByTestId('tracking-code')).toHaveValue('123456');

    await act(async () => {
      fireEvent.click(screen.getByTestId('ship-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith('123456');
  });

  it('rejects a code containing spaces or punctuation', () => {
    const onConfirm = renderShip('post_express');
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: 'RA 123 456' },
    });
    fireEvent.click(screen.getByTestId('ship-confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('rejects a code longer than 50 characters', () => {
    const onConfirm = renderShip('post_express');
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: 'A'.repeat(51) },
    });
    fireEvent.click(screen.getByTestId('ship-confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('accepts a hyphen inside the code', async () => {
    const onConfirm = renderShip('post_express');
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: 'RA-123-456' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('ship-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith('RA-123-456');
  });

  it('keeps the typed code when the write fails', async () => {
    const onConfirm = renderShip('post_express', false);
    fireEvent.change(screen.getByTestId('tracking-code'), {
      target: { value: 'RA123456785IR' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('ship-confirm'));
    });

    expect(screen.getByTestId('tracking-code')).toHaveValue('RA123456785IR');
  });
});
