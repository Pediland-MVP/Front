import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { ICity } from '@/types/city';
import type { IProvince } from '@/types/province';
import { newOptionDraft, type ShippingOptionDraft } from '@/utils/commerce/shippingDraft';

import { ShippingMethodCard } from './ShippingMethodCard';

const copy = messages.Commerce.Shipping;

const provinces: IProvince[] = [{ id: 2, name: 'هرمزگان', slug: 'hormozgan', tel_prefix: '076' }];
const cities: ICity[] = [{ id: 20, name: 'کیش', slug: 'kish', provinceId: 2 }];

const baseDraft = (patch: Partial<ShippingOptionDraft> = {}): ShippingOptionDraft => ({
  ...newOptionDraft('پست پیشتاز', 0),
  serverId: 'opt-1',
  amount: 45000,
  ...patch,
});

const renderCard = (draft: ShippingOptionDraft, onChange = vi.fn()) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ShippingMethodCard
        draft={draft}
        onChange={onChange}
        onRemove={vi.fn()}
        canEdit
        provinces={provinces}
        cities={cities}
        provinceById={new Map(provinces.map((p) => [p.id, p]))}
        cityById={new Map(cities.map((c) => [c.id, c]))}
      />
    </NextIntlClientProvider>,
  );
  return onChange;
};

describe('ShippingMethodCard — the three settlement modes are exclusive', () => {
  it('offers exactly three, as radios rather than switches', () => {
    renderCard(baseDraft());

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(screen.getByRole('radio', { name: copy.settlements.prepaid })).toBeChecked();
  });

  it('shows the rate, the free-shipping row and the exceptions toggle when prepaid', () => {
    renderCard(baseDraft({ settlement: 'prepaid' }));

    expect(screen.getByLabelText(copy.priceLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.freeOverLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.exceptionsAdd })).toBeInTheDocument();
  });

  it.each(['freight_collect', 'cash_on_delivery'] as const)(
    'hides all three under %s, where the carrier collects',
    (settlement) => {
      renderCard(baseDraft({ settlement }));

      expect(screen.queryByLabelText(copy.priceLabel)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.freeOverLabel)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: copy.exceptionsAdd })).not.toBeInTheDocument();
      // ...and says why, rather than leaving an unexplained gap.
      expect(screen.getByText(copy.noRateNote)).toBeInTheDocument();
    },
  );

  it('asks the parent to switch mode when another radio is picked', () => {
    const onChange = renderCard(baseDraft());

    fireEvent.click(screen.getByRole('radio', { name: copy.settlements.cash_on_delivery }));

    expect(onChange).toHaveBeenCalledWith({ settlement: 'cash_on_delivery' });
  });

  it.each([
    ['freight_collect', copy.summaryFreightCollect],
    ['cash_on_delivery', copy.summaryCashOnDelivery],
  ] as const)('summarises %s by its mode, not by a price it never charges', (settlement, label) => {
    renderCard(baseDraft({ settlement, amount: 45000 }));

    expect(screen.getByTestId('method-summary')).toHaveTextContent(label);
  });
});

describe('ShippingMethodCard — free shipping threshold', () => {
  it('shows a dash while there is no threshold', () => {
    renderCard(baseDraft({ freeOverAmount: null }));

    expect(screen.getByText(copy.freeOverDisabled)).toBeInTheDocument();
  });

  it('reveals the amount once the threshold is switched on', () => {
    renderCard(baseDraft({ freeOverAmount: 1_500_000 }));

    expect(screen.getByLabelText(copy.freeOverAmountLabel)).toHaveValue('۱٬۵۰۰٬۰۰۰');
  });

  // `null` means never waived; `0` means always free. Turning the switch off has to write null,
  // or a shop that never offers free shipping would start offering it on every order.
  it('writes null when switched off, and 0 when switched on', () => {
    const onChange = renderCard(baseDraft({ freeOverAmount: 500_000 }));
    fireEvent.click(screen.getByRole('switch', { name: copy.freeOverLabel }));
    expect(onChange).toHaveBeenCalledWith({ freeOverAmount: null });

    const onChange2 = renderCard(baseDraft({ freeOverAmount: null }));
    fireEvent.click(screen.getAllByRole('switch', { name: copy.freeOverLabel })[1]);
    expect(onChange2).toHaveBeenCalledWith({ freeOverAmount: 0 });
  });
});

describe('ShippingMethodCard — an inactive method stays editable', () => {
  it('collapses the body when the method is off', () => {
    renderCard(baseDraft({ isActive: false }));

    expect(screen.queryByLabelText(copy.priceLabel)).not.toBeInTheDocument();
    expect(screen.getByText(copy.summaryInactive)).toBeInTheDocument();
  });

  it('opens it again through the edit affordance, so a disabled price can still be fixed', () => {
    renderCard(baseDraft({ isActive: false }));

    fireEvent.click(screen.getByRole('button', { name: copy.editInactive }));

    expect(screen.getByLabelText(copy.priceLabel)).toBeInTheDocument();
  });
});
