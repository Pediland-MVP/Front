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

/**
 * The card ships collapsed, so every test about the BODY has to open it first — exactly what a
 * merchant does. Clicks the last edit button on screen, so the two-render test below still works.
 */
const renderOpenCard = (draft: ShippingOptionDraft, onChange = vi.fn()) => {
  renderCard(draft, onChange);
  const buttons = screen.getAllByRole('button', { name: copy.edit });
  fireEvent.click(buttons[buttons.length - 1]);
  return onChange;
};

describe('ShippingMethodCard — closed until asked', () => {
  it('shows no form for an ACTIVE method — being switched on is not a request to retune it', () => {
    renderCard(baseDraft({ isActive: true }));

    expect(screen.queryByLabelText(copy.priceLabel)).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('still says everything that matters in the summary while closed', () => {
    renderCard(baseDraft({ isActive: true, amount: 45000, freeOverAmount: 1_500_000 }));

    const summary = screen.getByTestId('method-summary');
    expect(summary).toHaveTextContent('۴۵٬۰۰۰');
    expect(summary).toHaveTextContent('۱٬۵۰۰٬۰۰۰');
  });

  it('opens on the pencil and closes again on the second click', () => {
    renderCard(baseDraft());

    fireEvent.click(screen.getByRole('button', { name: copy.edit }));
    expect(screen.getByLabelText(copy.priceLabel)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: copy.closeEditor }));
    expect(screen.queryByLabelText(copy.priceLabel)).not.toBeInTheDocument();
  });

  // Every seeded method starts at 0, so the merchant who just switched one on is about to need
  // the price field — and may not have realised the rate was zero.
  it('opens the details when the method is switched ON', () => {
    const draft = baseDraft({ isActive: false });
    renderCard(draft);

    expect(screen.queryByLabelText(copy.priceLabel)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: draft.title }));

    expect(screen.getByLabelText(copy.priceLabel)).toBeInTheDocument();
  });

  it('leaves an open card open when the method is switched OFF', () => {
    const draft = baseDraft({ isActive: true });
    renderCard(draft);
    fireEvent.click(screen.getByRole('button', { name: copy.edit }));

    fireEvent.click(screen.getByRole('switch', { name: draft.title }));

    // They may be turning it off precisely to fix the price that made them turn it off.
    expect(screen.getByLabelText(copy.priceLabel)).toBeInTheDocument();
  });

  it('does not open a closed card when the method is switched OFF', () => {
    const draft = baseDraft({ isActive: true });
    renderCard(draft);

    fireEvent.click(screen.getByRole('switch', { name: draft.title }));

    expect(screen.queryByLabelText(copy.priceLabel)).not.toBeInTheDocument();
  });

  it('opens a never-saved method straight away, or «افزودن روش» would look like it did nothing', () => {
    renderCard(baseDraft({ serverId: null }));

    expect(screen.getByLabelText(copy.titleLabel)).toBeInTheDocument();
  });

  it('lets a read-only member open the card — the controls inside carry their own disabled', () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <ShippingMethodCard
          draft={baseDraft()}
          onChange={vi.fn()}
          onRemove={vi.fn()}
          canEdit={false}
          provinces={provinces}
          cities={cities}
          provinceById={new Map(provinces.map((p) => [p.id, p]))}
          cityById={new Map(cities.map((c) => [c.id, c]))}
        />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: copy.edit }));
    expect(screen.getByLabelText(copy.priceLabel)).toBeDisabled();
  });
});

describe('ShippingMethodCard — a seeded method cannot be deleted', () => {
  const removeLabel = (draft: ShippingOptionDraft) => `${copy.remove} — ${draft.title}`;

  it('offers no delete button at all — a dead disabled icon would explain nothing', () => {
    const draft = baseDraft({ isSystem: true });
    renderCard(draft);

    expect(screen.queryByRole('button', { name: removeLabel(draft) })).not.toBeInTheDocument();
  });

  it('says why, and points at the switch that does what the merchant wants', () => {
    renderOpenCard(baseDraft({ isSystem: true }));

    expect(screen.getByText(copy.systemMethodNote)).toBeInTheDocument();
  });

  it('still deletes a method the merchant added themselves', () => {
    const draft = baseDraft({ isSystem: false });
    renderCard(draft);

    expect(screen.getByRole('button', { name: removeLabel(draft) })).toBeInTheDocument();
  });

  it('stays fully editable — undeletable is not read-only', () => {
    const onChange = renderOpenCard(baseDraft({ isSystem: true }));

    fireEvent.change(screen.getByLabelText(copy.titleLabel), { target: { value: 'پست ویژه' } });

    expect(onChange).toHaveBeenCalledWith({ title: 'پست ویژه' });
  });
});

describe('ShippingMethodCard — the three settlement modes are exclusive', () => {
  it('offers exactly three, as radios rather than switches', () => {
    renderOpenCard(baseDraft());

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(screen.getByRole('radio', { name: copy.settlements.prepaid })).toBeChecked();
  });

  it('shows the rate, the free-shipping row and the exceptions toggle when prepaid', () => {
    renderOpenCard(baseDraft({ settlement: 'prepaid' }));

    expect(screen.getByLabelText(copy.priceLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.freeOverLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.exceptionsAdd })).toBeInTheDocument();
  });

  it.each(['freight_collect', 'cash_on_delivery'] as const)(
    'hides all three under %s, where the carrier collects',
    (settlement) => {
      renderOpenCard(baseDraft({ settlement }));

      expect(screen.queryByLabelText(copy.priceLabel)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.freeOverLabel)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: copy.exceptionsAdd })).not.toBeInTheDocument();
      // ...and says why, rather than leaving an unexplained gap.
      expect(screen.getByText(copy.noRateNote)).toBeInTheDocument();
    },
  );

  it('asks the parent to switch mode when another radio is picked', () => {
    const onChange = renderOpenCard(baseDraft());

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
    renderOpenCard(baseDraft({ freeOverAmount: null }));

    expect(screen.getByText(copy.freeOverDisabled)).toBeInTheDocument();
  });

  it('reveals the amount once the threshold is switched on', () => {
    renderOpenCard(baseDraft({ freeOverAmount: 1_500_000 }));

    expect(screen.getByLabelText(copy.freeOverAmountLabel)).toHaveValue('۱٬۵۰۰٬۰۰۰');
  });

  // `null` means never waived; `0` means always free. Turning the switch off has to write null,
  // or a shop that never offers free shipping would start offering it on every order.
  it('writes null when switched off, and 0 when switched on', () => {
    const onChange = renderOpenCard(baseDraft({ freeOverAmount: 500_000 }));
    fireEvent.click(screen.getByRole('switch', { name: copy.freeOverLabel }));
    expect(onChange).toHaveBeenCalledWith({ freeOverAmount: null });

    const onChange2 = renderOpenCard(baseDraft({ freeOverAmount: null }));
    fireEvent.click(screen.getAllByRole('switch', { name: copy.freeOverLabel })[1]);
    expect(onChange2).toHaveBeenCalledWith({ freeOverAmount: 0 });
  });
});

describe('ShippingMethodCard — an inactive method stays editable', () => {
  it('says it is off instead of showing a price nobody is being charged', () => {
    renderCard(baseDraft({ isActive: false }));

    expect(screen.queryByLabelText(copy.priceLabel)).not.toBeInTheDocument();
    expect(screen.getByText(copy.summaryInactive)).toBeInTheDocument();
  });

  // Fixing the price BEFORE switching a method back on is the whole reason an off method must
  // still open.
  it('opens through the same pencil, so a disabled price can still be fixed', () => {
    renderCard(baseDraft({ isActive: false }));

    fireEvent.click(screen.getByRole('button', { name: copy.edit }));

    expect(screen.getByLabelText(copy.priceLabel)).toBeInTheDocument();
  });
});
