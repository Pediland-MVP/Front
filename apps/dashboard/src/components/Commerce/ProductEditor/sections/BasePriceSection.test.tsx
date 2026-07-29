import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import messages from '@/messages/fa.json';
import { BasePriceSection } from './BasePriceSection';
import type { ProductFormValues } from '../productEditor.schema';

const copy = messages.Commerce.Editor.BasePrice;

const emptyForm: ProductFormValues = {
  title: '',
  description: '',
  categoryId: null,
  tags: [],
  specs: [],
  collectionIds: [],
  media: [],
  basePrice: null,
  baseCompare: null,
  baseStock: null,
  options: [],
  variants: [],
};

/** Surfaces the stored values so tests can assert on the NUMBER, not the formatted text. */
const Probe = () => {
  const price = useWatch<ProductFormValues, 'basePrice'>({ name: 'basePrice' });
  const compare = useWatch<ProductFormValues, 'baseCompare'>({ name: 'baseCompare' });
  return (
    <>
      <output data-testid="stored-price">{String(price)}</output>
      <output data-testid="stored-compare">{String(compare)}</output>
    </>
  );
};

const Harness = ({ defaults }: { defaults?: Partial<ProductFormValues> }) => {
  const form = useForm<ProductFormValues>({ defaultValues: { ...emptyForm, ...defaults } });
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <FormProvider {...form}>
        <BasePriceSection />
        <Probe />
      </FormProvider>
    </NextIntlClientProvider>
  );
};

const variant = (valueIds: string[]) => ({
  valueIds,
  price: 1000,
  compare: null,
  stock: 1,
  infinite: false,
  mediaIds: [],
  sku: null,
  weight: null,
  salePrice: null,
  saleStartsAt: null,
  saleEndsAt: null,
  allowBackorder: false,
  isActive: true,
});

describe('BasePriceSection', () => {
  it('stores a Persian-digit price as an English number', () => {
    render(<Harness />);

    // `fireEvent.input`, not `.change`: React maps BOTH onInput and onChange onto the native
    // `input` event, and onInput (p2e conversion) must run first — a `change` event would skip it
    // entirely, which is the whole point of CLAUDE.md §18.
    fireEvent.input(screen.getByLabelText(copy.price), { target: { value: '۴۲۰۰۰۰' } });

    expect(screen.getByTestId('stored-price')).toHaveTextContent('420000');
  });

  it('strips separators and stray text a merchant pastes in', () => {
    render(<Harness />);

    fireEvent.input(screen.getByLabelText(copy.price), { target: { value: '۴۲۰,۰۰۰ تومان' } });

    expect(screen.getByTestId('stored-price')).toHaveTextContent('420000');
  });

  it('stores null for a cleared field, so "no price" stays distinct from zero', () => {
    render(<Harness defaults={{ basePrice: 5000 }} />);

    fireEvent.input(screen.getByLabelText(copy.price), { target: { value: '' } });

    expect(screen.getByTestId('stored-price')).toHaveTextContent('null');
  });

  it('shows the price back in Persian digits with separators', () => {
    render(<Harness defaults={{ basePrice: 420000 }} />);

    expect(screen.getByLabelText(copy.price)).toHaveValue((420000).toLocaleString('fa-IR'));
  });

  it('locks once real variations exist, because the base price only ever seeds them', () => {
    render(
      <Harness
        defaults={{
          // Seeded so the compare field is on-sale and would otherwise be ENABLED. Without it
          // the assertion below passes for the wrong reason — a product with no compare price
          // has its compare input disabled by the discount switch, lock or no lock.
          baseCompare: 9000,
          options: [
            {
              localKey: 'opt-1',
              name: 'رنگ',
              style: 'button',
              values: [{ localKey: 'v1', value: 'قرمز' }],
            },
          ],
          variants: [variant(['v1'])],
        }}
      />,
    );

    expect(screen.getByLabelText(copy.price)).toBeDisabled();
    expect(screen.getByLabelText(copy.compare)).toBeDisabled();
    expect(screen.getByText(copy.locked)).toBeInTheDocument();
  });

  it('stays editable for a product with one variation and no axes — that row IS the product', () => {
    render(<Harness defaults={{ options: [], variants: [variant([])] }} />);

    expect(screen.getByLabelText(copy.price)).toBeEnabled();
    expect(screen.getByText(copy.hint)).toBeInTheDocument();
  });

  it('warns when the compare price is not above the sale price', () => {
    render(<Harness defaults={{ basePrice: 5000, baseCompare: 5000 }} />);

    expect(screen.getByLabelText(copy.compare)).toHaveAttribute('data-bad', 'zero');
    expect(screen.getByText(copy.compareHint)).toBeInTheDocument();
  });

  describe('discount switch', () => {
    it('starts off for a product with no compare price, and the field is not editable', () => {
      render(<Harness />);

      expect(screen.getByLabelText(copy.hasDiscount)).not.toBeChecked();
      expect(screen.getByLabelText(copy.compare)).toBeDisabled();
    });

    it('starts on for a product that already has one — the value arrives after mount', () => {
      // This is the edit-mode case: the section renders before the product loads, so seeding
      // useState once would leave the switch off with a real compare price sitting behind it.
      render(<Harness defaults={{ basePrice: 5000, baseCompare: 8000 }} />);

      expect(screen.getByLabelText(copy.hasDiscount)).toBeChecked();
      expect(screen.getByLabelText(copy.compare)).toBeEnabled();
    });

    it('enables the field when switched on', () => {
      render(<Harness defaults={{ basePrice: 5000 }} />);

      fireEvent.click(screen.getByLabelText(copy.hasDiscount));

      expect(screen.getByLabelText(copy.compare)).toBeEnabled();
    });

    it('disables the field AND clears the value when switched off', () => {
      render(<Harness defaults={{ basePrice: 5000, baseCompare: 8000 }} />);

      fireEvent.click(screen.getByLabelText(copy.hasDiscount));

      expect(screen.getByLabelText(copy.compare)).toBeDisabled();
      // The clearing is the load-bearing half: a value left behind would still be sent on save
      // and the product would stay discounted despite the switch reading off.
      expect(screen.getByTestId('stored-compare')).toHaveTextContent('null');
    });

    it('keeps the switch on when the merchant clears the field by hand', () => {
      render(<Harness defaults={{ basePrice: 5000, baseCompare: 8000 }} />);

      fireEvent.input(screen.getByLabelText(copy.compare), { target: { value: '' } });

      // Emptying the input also drives the value to null. If the switch simply followed that,
      // it would flip off and disable the field mid-edit, under the merchant's cursor.
      expect(screen.getByLabelText(copy.hasDiscount)).toBeChecked();
      expect(screen.getByLabelText(copy.compare)).toBeEnabled();
    });

    it('drops the mismatch warning once the discount is switched off', () => {
      render(<Harness defaults={{ basePrice: 5000, baseCompare: 5000 }} />);
      expect(screen.getByText(copy.compareHint)).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(copy.hasDiscount));

      // A cleared, disabled field cannot violate CHK_commerce_variant_compare_gt_price, so
      // leaving the warning up would block the merchant on a field they just turned off.
      expect(screen.queryByText(copy.compareHint)).not.toBeInTheDocument();
    });

    it('cannot be touched while the card is locked by real variations', () => {
      render(
        <Harness
          defaults={{
            baseCompare: 9000,
            options: [
              {
                localKey: 'opt-1',
                name: 'رنگ',
                style: 'button',
                values: [{ localKey: 'v1', value: 'قرمز' }],
              },
            ],
            variants: [variant(['v1'])],
          }}
        />,
      );

      expect(screen.getByLabelText(copy.hasDiscount)).toBeDisabled();
    });
  });
});
