import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

// The dialog reads the category tree from the SHARED `/commerce/categories` cache entry so it
// can print "پوشاک › کفش ورزشی". Control it here instead of hitting an endpoint.
const { mockUseSWRImmutable } = vi.hoisted(() => ({ mockUseSWRImmutable: vi.fn() }));
vi.mock('swr/immutable', () => ({
  default: (...args: unknown[]) => mockUseSWRImmutable(...args),
}));

import messages from '@/messages/fa.json';
import { PreviewDialog } from './PreviewDialog';
import { formatAmount } from '../utils/editorNumber.util';
import { buildEmptyProductForm, type ProductFormValues } from '../productEditor.schema';

const price = (value: number) => `${formatAmount(value)} تومان`;

const variant = (
  valueIds: string[],
  over: Partial<ProductFormValues['variants'][number]> = {},
): ProductFormValues['variants'][number] => ({
  valueIds,
  price: 100000,
  compare: null,
  hasDiscount: false,
  stock: 3,
  infinite: false,
  mediaIds: [],
  sku: null,
  weight: null,
  salePrice: null,
  saleStartsAt: null,
  saleEndsAt: null,
  allowBackorder: false,
  isActive: true,
  ...over,
});

const colourAxis: ProductFormValues['options'][number] = {
  localKey: 'opt-color',
  name: 'رنگ',
  style: 'color',
  values: [
    { localKey: 'c1', value: 'قرمز' },
    { localKey: 'c2', value: 'آبی' },
    // No variant row points at this one — the fallback case.
    { localKey: 'c3', value: 'سبز' },
  ],
};

function Harness({ values }: { values: Partial<ProductFormValues> }) {
  const form = useForm<ProductFormValues>({
    defaultValues: { ...buildEmptyProductForm(), ...values },
  });
  return (
    <FormProvider {...form}>
      <PreviewDialog open onClose={() => {}} />
    </FormProvider>
  );
}

const renderDialog = (values: Partial<ProductFormValues> = {}) =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <Harness values={values} />
    </NextIntlClientProvider>,
  );

const withVariants = (): Partial<ProductFormValues> => ({
  title: 'کفش رانینگ',
  description: '### سبک\nمناسب دویدن',
  basePrice: 999000,
  baseCompare: null,
  baseStock: 7,
  options: [colourAxis],
  variants: [
    variant(['c1'], { price: 100000 }),
    variant(['c2'], { price: 250000, compare: 300000 }),
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSWRImmutable.mockReturnValue({ data: { items: [] }, error: undefined, isLoading: false });
});

describe('PreviewDialog', () => {
  it('shows the first combination and its variant price by default', () => {
    renderDialog(withVariants());

    expect(screen.getByTestId('preview-price')).toHaveTextContent(price(100000));
    expect(screen.getByTestId('preview-footer')).toHaveTextContent(
      messages.Commerce.Editor.Preview.footerVariant,
    );
  });

  it('re-resolves the shown variant when a different colour chip is picked', () => {
    renderDialog(withVariants());

    fireEvent.click(screen.getByTestId('preview-value-c2'));

    expect(screen.getByTestId('preview-price')).toHaveTextContent(price(250000));
    // That row also carries a compare price, so the struck-through original appears with it.
    expect(screen.getByTestId('preview-compare')).toHaveTextContent(price(300000));
  });

  it('falls back to the base price when the chosen combination has no row', () => {
    renderDialog(withVariants());

    fireEvent.click(screen.getByTestId('preview-value-c3'));

    expect(screen.getByTestId('preview-price')).toHaveTextContent(price(999000));
    expect(screen.getByTestId('preview-footer')).toHaveTextContent(
      messages.Commerce.Editor.Preview.footerFallback,
    );
  });

  it('renders the description as plain text, not markdown', () => {
    renderDialog(withVariants());

    expect(screen.getByTestId('preview-description')).toHaveTextContent('سبک');
    expect(screen.getByTestId('preview-description').textContent).not.toContain('###');
  });

  it('shows the stock line from the resolved row', () => {
    renderDialog(withVariants());

    expect(screen.getByTestId('preview-stock')).toHaveTextContent('۳ عدد در انبار');
  });

  it('shows the "no stock recorded" line when the fallback base stock is blank', () => {
    renderDialog({ ...withVariants(), baseStock: null });

    fireEvent.click(screen.getByTestId('preview-value-c3'));

    expect(screen.getByTestId('preview-stock')).toHaveTextContent(
      messages.Commerce.Editor.Preview.stockUnset,
    );
  });

  it('keeps the add-to-cart button disabled — this is a preview, not a storefront', () => {
    renderDialog(withVariants());

    expect(screen.getByTestId('preview-add-to-cart')).toBeDisabled();
  });

  it('falls back to the untitled label when the product has no title yet', () => {
    renderDialog({ ...withVariants(), title: '   ' });

    expect(screen.getByTestId('preview-title')).toHaveTextContent(
      messages.Commerce.Editor.Preview.untitled,
    );
  });
});
