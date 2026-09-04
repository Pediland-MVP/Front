import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { ICity } from '@/types/city';
import type { IProvince } from '@/types/province';
import type { ShippingOverrideDraft } from '@/utils/commerce/shippingDraft';

import { RateOverrideEditor } from './RateOverrideEditor';

const copy = messages.Commerce.Shipping;

const provinces: IProvince[] = [
  { id: 1, name: 'تهران', slug: 'tehran', tel_prefix: '021' },
  { id: 2, name: 'هرمزگان', slug: 'hormozgan', tel_prefix: '076' },
];

const cities: ICity[] = [
  { id: 10, name: 'تهران', slug: 'tehran', provinceId: 1 },
  { id: 20, name: 'کیش', slug: 'kish', provinceId: 2 },
];

const renderEditor = (overrides: ShippingOverrideDraft[] = [], onChange = vi.fn()) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <RateOverrideEditor
        overrides={overrides}
        onChange={onChange}
        provinces={provinces}
        cities={cities}
        provinceById={new Map(provinces.map((p) => [p.id, p]))}
        cityById={new Map(cities.map((c) => [c.id, c]))}
      />
    </NextIntlClientProvider>,
  );

  // The editor opens collapsed — that is the point of the sparse model.
  fireEvent.click(
    screen.getByRole('button', {
      name: new RegExp(overrides.length ? copy.exceptionsOpen : copy.exceptionsAdd),
    }),
  );

  return onChange;
};

describe('RateOverrideEditor — reading saved exceptions', () => {
  it('resolves a stored city id into its name and its province', () => {
    renderEditor([{ key: 'o1', kind: 'city', id: 20, amount: 110000 }]);

    expect(screen.getByText('کیش')).toBeInTheDocument();
    expect(screen.getByText('هرمزگان')).toBeInTheDocument();
    expect(screen.getByText(copy.tagCity)).toBeInTheDocument();
  });

  it('labels a province row as covering every city in it', () => {
    renderEditor([{ key: 'o1', kind: 'province', id: 2, amount: 78000 }]);

    expect(screen.getByText('هرمزگان')).toBeInTheDocument();
    expect(screen.getByText(copy.allCities)).toBeInTheDocument();
    expect(screen.getByText(copy.tagProvince)).toBeInTheDocument();
  });

  it('says so plainly when an id is not in the loaded reference data', () => {
    renderEditor([{ key: 'o1', kind: 'city', id: 999, amount: 1000 }]);

    expect(screen.getByText(copy.unknownDestination)).toBeInTheDocument();
  });

  it('shows the saved amount in Persian digits', () => {
    renderEditor([{ key: 'o1', kind: 'city', id: 20, amount: 110000 }]);

    expect(screen.getByLabelText(`${copy.priceLabel} — کیش`)).toHaveValue('۱۱۰٬۰۰۰');
  });
});

describe('RateOverrideEditor — adding one', () => {
  it('offers the province ahead of the city of the same name', () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'تهران' },
    });

    const suggestions = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.includes('تهران'));
    expect(suggestions[0]).toHaveTextContent(copy.wholeProvince);
  });

  it('reports when nothing matches instead of showing an empty menu', () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'ناکجاآباد' },
    });

    expect(screen.getByText(copy.exceptionsNoResults)).toBeInTheDocument();
  });

  it('keeps the add button disabled until both a destination and a price are given', () => {
    renderEditor();
    const add = screen.getByRole('button', { name: copy.exceptionsAddButton });
    expect(add).toBeDisabled();

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'کیش' },
    });
    fireEvent.click(screen.getByRole('button', { name: /کیش/ }));
    expect(add).toBeDisabled();

    fireEvent.change(screen.getByLabelText(copy.exceptionsPriceAria), {
      target: { value: '90000' },
    });
    expect(add).toBeEnabled();
  });

  it('prepends the new exception with its target split into the right id', () => {
    const onChange = renderEditor();

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'کیش' },
    });
    fireEvent.click(screen.getByRole('button', { name: /کیش/ }));
    fireEvent.change(screen.getByLabelText(copy.exceptionsPriceAria), {
      target: { value: '90000' },
    });
    fireEvent.click(screen.getByRole('button', { name: copy.exceptionsAddButton }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ kind: 'city', id: 20, amount: 90000 }),
    ]);
  });

  it('does not offer a destination that already has an exception', () => {
    renderEditor([{ key: 'o1', kind: 'city', id: 20, amount: 110000 }]);

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'کیش' },
    });

    expect(screen.getByText(copy.exceptionsNoResults)).toBeInTheDocument();
  });
});

describe('RateOverrideEditor — adding many at once', () => {
  it('shows a picked destination as a removable chip under "انتخاب شد:"', () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'کیش' },
    });
    fireEvent.click(screen.getByRole('button', { name: /کیش/ }));

    expect(screen.getByText(copy.exceptionsSelected)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `${copy.exceptionsClearSelected} — کیش` }),
    ).toBeInTheDocument();
  });

  // The bug report this closes: picking a city then editing the search box (even just deleting a
  // letter, trying to search for the next one) used to silently wipe the pick.
  it('keeps an already-picked destination after the search box is edited or cleared', () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'کیش' },
    });
    fireEvent.click(screen.getByRole('button', { name: /کیش/ }));

    // Box is empty again (ready for the next search), not showing "کیش" -- editing/deleting from
    // here must not touch the already-picked chip.
    expect(screen.getByLabelText(copy.exceptionsSearchAria)).toHaveValue('');
    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'ته' },
    });
    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), { target: { value: '' } });

    expect(
      screen.getByRole('button', { name: `${copy.exceptionsClearSelected} — کیش` }),
    ).toBeInTheDocument();
  });

  it('picks several destinations and commits all of them with one shared price in one click', () => {
    const onChange = renderEditor();

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'کیش' },
    });
    fireEvent.click(screen.getByRole('button', { name: /کیش/ }));

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'هرمزگان' },
    });
    fireEvent.click(screen.getByRole('button', { name: /هرمزگان/ }));

    fireEvent.change(screen.getByLabelText(copy.exceptionsPriceAria), {
      target: { value: '50000' },
    });
    fireEvent.click(screen.getByRole('button', { name: copy.exceptionsAddButton }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ kind: 'city', id: 20, amount: 50000 }),
      expect.objectContaining({ kind: 'province', id: 2, amount: 50000 }),
    ]);
  });

  it('removing one picked chip drops only that destination from the batch', () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'کیش' },
    });
    fireEvent.click(screen.getByRole('button', { name: /کیش/ }));
    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'هرمزگان' },
    });
    fireEvent.click(screen.getByRole('button', { name: /هرمزگان/ }));

    fireEvent.click(screen.getByRole('button', { name: `${copy.exceptionsClearSelected} — کیش` }));

    expect(
      screen.queryByRole('button', { name: `${copy.exceptionsClearSelected} — کیش` }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `${copy.exceptionsClearSelected} — هرمزگان` }),
    ).toBeInTheDocument();
  });

  it('does not offer an already-picked destination again in the search results', () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'کیش' },
    });
    fireEvent.click(screen.getByRole('button', { name: /کیش/ }));

    fireEvent.change(screen.getByLabelText(copy.exceptionsSearchAria), {
      target: { value: 'کیش' },
    });

    expect(screen.getByText(copy.exceptionsNoResults)).toBeInTheDocument();
  });
});

describe('RateOverrideEditor — removing', () => {
  it('drops just the row whose delete was pressed', () => {
    const onChange = renderEditor([
      { key: 'o1', kind: 'city', id: 20, amount: 110000 },
      { key: 'o2', kind: 'province', id: 1, amount: 50000 },
    ]);

    fireEvent.click(screen.getByRole('button', { name: `${copy.exceptionsDelete} — کیش` }));

    expect(onChange).toHaveBeenCalledWith([{ key: 'o2', kind: 'province', id: 1, amount: 50000 }]);
  });

  it('clears the whole list in one action', () => {
    const onChange = renderEditor([{ key: 'o1', kind: 'city', id: 20, amount: 110000 }]);

    fireEvent.click(screen.getByRole('button', { name: copy.exceptionsClearAll }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
