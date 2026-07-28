import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError } }));

import messages from '@/messages/fa.json';
import type { ProductFormValues } from '../productEditor.schema';
import { VariantSyncProvider, type VariantRow } from './useVariantSync';
import { VariantsSection } from './VariantsSection';

const T = messages.Commerce.Editor.Variants;
const B = messages.Commerce.Editor.Bulk;

const option = (id: string, name: string, values: Array<[string, string]>) => ({
  id,
  name,
  style: 'button' as const,
  values: values.map(([valueId, value]) => ({ id: valueId, value })),
});

const row = (valueIds: string[], over: Partial<VariantRow> = {}): VariantRow => ({
  valueIds,
  price: null,
  compare: null,
  stock: null,
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

const TWO_AXES: Partial<ProductFormValues> = {
  options: [
    option('color', 'رنگ', [
      ['c1', 'قرمز'],
      ['c2', 'آبی'],
    ]),
    option('size', 'سایز', [
      ['s1', 'S'],
      ['s2', 'M'],
    ]),
  ],
  variants: [
    row(['c1', 's1'], { price: 420000, stock: 3 }),
    row(['c1', 's2'], { price: 315500, stock: 2 }),
    row(['c2', 's1'], { price: null, stock: 0 }),
    row(['c2', 's2'], { price: 99900, stock: 5 }),
  ],
};

const ONE_AXIS: Partial<ProductFormValues> = {
  options: [
    option('color', 'رنگ', [
      ['c1', 'قرمز'],
      ['c2', 'آبی'],
    ]),
  ],
  variants: [row(['c1'], { price: 420000 }), row(['c2'], { price: 420000 })],
};

const renderGrid = (over: Partial<ProductFormValues>) => {
  let api!: UseFormReturn<ProductFormValues>;
  const onOpenPicker = vi.fn();

  function Harness() {
    const methods = useForm<ProductFormValues>({
      defaultValues: {
        title: '',
        description: '',
        categoryId: null,
        tags: [],
        specs: [],
        collectionIds: [],
        basePrice: null,
        baseCompare: null,
        baseStock: null,
        options: [],
        variants: [],
        ...over,
      } as ProductFormValues,
    });
    api = methods;
    return (
      <NextIntlClientProvider locale="fa" messages={messages}>
        <FormProvider {...methods}>
          <VariantSyncProvider>
            <VariantsSection
              media={[{ id: 'm1', url: 'https://x/1.jpg', name: 'یک' }]}
              onOpenPicker={onOpenPicker}
            />
          </VariantSyncProvider>
        </FormProvider>
      </NextIntlClientProvider>
    );
  }

  const view = render(<Harness />);
  return {
    ...view,
    onOpenPicker,
    prices: () => api.getValues('variants').map((r) => r.price),
    form: () => api,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VariantsSection — parent roll-up', () => {
  it('writes a parent value onto every child of that group', () => {
    const grid = renderGrid(TWO_AXES);

    // قرمز rolls up 420,000 and 315,500 — a range, so the cell is a button first.
    fireEvent.click(screen.getAllByTitle(T.rangePriceTitle)[0]);
    const input = screen.getByLabelText('قیمت قرمز');
    fireEvent.change(input, { target: { value: '۲۰۰۰۰۰' } });
    fireEvent.blur(input);

    expect(grid.prices()).toEqual([200000, 200000, null, 99900]);
    expect(toastSuccess).toHaveBeenCalledTimes(1);
  });

  it('does nothing when a parent showing a range is blanked, instead of wiping the children', () => {
    const grid = renderGrid(TWO_AXES);

    fireEvent.click(screen.getAllByTitle(T.rangePriceTitle)[0]);
    const input = screen.getByLabelText('قیمت قرمز');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(grid.prices()).toEqual([420000, 315500, null, 99900]);
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('gives a group with a single leaf no expander and edits it on its own row', () => {
    const grid = renderGrid(ONE_AXIS);

    expect(grid.container.querySelectorAll('[data-chev]')).toHaveLength(0);
    // The row is the leaf itself, so its cell is register-ed under its own index.
    fireEvent.change(screen.getByLabelText('قیمت قرمز'), { target: { value: '۵۰۰۰۰۰' } });

    expect(grid.prices()).toEqual([500000, 420000]);
  });
});

describe('VariantsSection — validation errors', () => {
  it('opens the group holding a failing row, once, without re-rendering forever', () => {
    const grid = renderGrid(TWO_AXES);

    // آبی's first leaf has no price — exactly what the zod refinement flags on submit.
    act(() => {
      grid.form().setError('variants.2.price', { type: 'custom', message: 'boom' });
    });

    // The group expanded, so the red cell is somewhere the merchant can actually see it.
    expect(screen.getByLabelText('قیمت آبی، S')).toBeInTheDocument();
  });
});

describe('VariantsSection — bulk bar', () => {
  const selectEverything = () => fireEvent.click(screen.getByLabelText(T.selectAll));

  it('is hidden until something is selected', () => {
    renderGrid(TWO_AXES);
    expect(screen.queryByRole('group', { name: B.groupLabel })).not.toBeInTheDocument();

    selectEverything();
    expect(screen.getByRole('group', { name: B.groupLabel })).toBeInTheDocument();
  });

  it('applies -۱۰٪ rounded to the nearest 1000 tooman and skips rows with no price', () => {
    const grid = renderGrid(TWO_AXES);
    selectEverything();

    fireEvent.click(screen.getByRole('button', { name: B.price }));
    fireEvent.change(screen.getByLabelText(B.modeAria), { target: { value: 'dec' } });
    fireEvent.change(screen.getByLabelText(B.valueAria), { target: { value: '۱۰' } });
    fireEvent.click(screen.getByRole('button', { name: B.apply }));

    //  420,000 → 378,000 exactly
    //  315,500 → 283,950 → 284,000  (rounded UP to the nearest 1000)
    //     null → skipped, never turned into 0
    //   99,900 →  89,910 →  90,000
    expect(grid.prices()).toEqual([378000, 284000, null, 90000]);

    const [message] = toastSuccess.mock.calls[0];
    expect(message).toContain('۳'); // three rows changed
    expect(message).toContain('۱'); // one row reported as skipped
  });

  it('sets an exact price on every selected row, including the ones with no price', () => {
    const grid = renderGrid(TWO_AXES);
    selectEverything();

    fireEvent.click(screen.getByRole('button', { name: B.price }));
    fireEvent.change(screen.getByLabelText(B.valueAria), { target: { value: '۱۵۰۰۰۰' } });
    fireEvent.click(screen.getByRole('button', { name: B.apply }));

    expect(grid.prices()).toEqual([150000, 150000, 150000, 150000]);
  });
});
