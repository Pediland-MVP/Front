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
  it('offers a tracking url field for a posted order', () => {
    renderShip('post_express');
    expect(screen.getByTestId('tracking-url')).toBeInTheDocument();
  });

  it('hides the tracking url field for a pickup -- there is no parcel', () => {
    renderShip('pickup');
    expect(screen.queryByTestId('tracking-url')).toBeNull();
  });

  it('shows pickup-specific copy instead of "posted" wording', () => {
    renderShip('pickup');
    expect(screen.getByText(copy.titlePickup)).toBeInTheDocument();
    expect(screen.getByText(copy.descriptionPickup)).toBeInTheDocument();
  });

  it('tells the seller the tracking link is sent to the buyer as a DM', () => {
    renderShip('post_express');
    expect(screen.getByText(copy.urlHint)).toBeInTheDocument();
  });

  it('confirms with no url when the field is left blank', async () => {
    const onConfirm = renderShip('post_express');
    await act(async () => {
      fireEvent.click(screen.getByTestId('ship-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it('confirms with the trimmed url when it is valid', async () => {
    const onConfirm = renderShip('post_express');
    fireEvent.change(screen.getByTestId('tracking-url'), {
      target: { value: '  https://tracking.post.ir/abc  ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('ship-confirm'));
    });
    expect(onConfirm).toHaveBeenCalledWith('https://tracking.post.ir/abc');
  });

  it('rejects a url that is not http(s)', () => {
    const onConfirm = renderShip('post_express');
    fireEvent.change(screen.getByTestId('tracking-url'), {
      target: { value: 'javascript:alert(1)' },
    });
    fireEvent.click(screen.getByTestId('ship-confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('rejects a malformed url that URL() cannot even parse', () => {
    const onConfirm = renderShip('post_express');
    fireEvent.change(screen.getByTestId('tracking-url'), { target: { value: 'not a url' } });
    fireEvent.click(screen.getByTestId('ship-confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // M5: `new URL()` alone accepts a bare host with no TLD, but the server's `@IsUrl` requires
  // one -- without this extra check the dialog would accept a url the backend 400s on.
  it('rejects a url whose host has no TLD, even though URL() parses it fine', () => {
    const onConfirm = renderShip('post_express');
    fireEvent.change(screen.getByTestId('tracking-url'), {
      target: { value: 'https://localhost:8080/track' },
    });
    fireEvent.click(screen.getByTestId('ship-confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('keeps the typed url when the write fails', async () => {
    const onConfirm = renderShip('post_express', false);
    fireEvent.change(screen.getByTestId('tracking-url'), {
      target: { value: 'https://tracking.post.ir/abc' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('ship-confirm'));
    });

    expect(screen.getByTestId('tracking-url')).toHaveValue('https://tracking.post.ir/abc');
  });
});
