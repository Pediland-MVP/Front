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

describe('ShippingMethodCard — پس‌کرایه swallows the seller-set price', () => {
  it('shows the price, the free-shipping row and the exceptions toggle in flat mode', () => {
    renderCard(baseDraft());

    expect(screen.getByLabelText(copy.priceLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.freeOverLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.exceptionsAdd })).toBeInTheDocument();
  });

  it('hides all three once the courier collects the fare', () => {
    renderCard(baseDraft({ postKerayeh: true }));

    expect(screen.queryByLabelText(copy.priceLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.freeOverLabel)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.exceptionsAdd })).not.toBeInTheDocument();
  });

  it('explains why they are gone instead of leaving the row unlabelled', () => {
    renderCard(baseDraft({ postKerayeh: true }));

    expect(screen.getByText(copy.postKerayehLocked)).toBeInTheDocument();
  });

  it('reports پس‌کرایه in the summary rather than a price the seller never charges', () => {
    renderCard(baseDraft({ postKerayeh: true, amount: 45000 }));

    expect(screen.getByText(copy.summaryPostKerayeh)).toBeInTheDocument();
  });

  it('asks the parent to switch the mode when the پس‌کرایه switch is used', () => {
    const onChange = renderCard(baseDraft());

    fireEvent.click(screen.getByRole('switch', { name: copy.postKerayehLabel }));

    expect(onChange).toHaveBeenCalledWith({ postKerayeh: true });
  });
});

describe('ShippingMethodCard — free shipping threshold', () => {
  it('shows a dash instead of an empty box while the threshold is off', () => {
    renderCard(baseDraft({ freeOverEnabled: false }));

    expect(screen.getByText(copy.freeOverDisabled)).toBeInTheDocument();
  });

  it('reveals the threshold field once it is switched on', () => {
    renderCard(baseDraft({ freeOverEnabled: true, freeOverAmount: 1_500_000 }));

    expect(screen.getByLabelText(copy.freeOverAmountLabel)).toHaveValue('۱٬۵۰۰٬۰۰۰');
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
