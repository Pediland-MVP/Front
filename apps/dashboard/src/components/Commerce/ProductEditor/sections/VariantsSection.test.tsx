import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

// This suite targets the single riskiest piece of Task 5: the "بازسازی جدول تنوع‌ها"
// (regenerate) diff logic. Regenerating the variant table from the options builder must NOT
// blindly discard the whole array — any combination that still exists after regeneration has
// to keep its already-entered id/price/SKU, only the delta (new/removed combinations) may
// change. It also covers the VARIANT_LIMIT hard-block and the last-active-variant guard.

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

beforeAll(() => {
  (global as unknown as { ResizeObserver: unknown }).ResizeObserver =
    (global as unknown as { ResizeObserver?: unknown }).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

beforeEach(() => {
  vi.clearAllMocks();
});

import messages from '@/messages/fa.json';
import { VariantsSection } from './VariantsSection';
import type { ProductFormValues } from '../productForm.schema';

let capturedForm: UseFormReturn<ProductFormValues> | undefined;

function Harness({ defaultValues }: { defaultValues: ProductFormValues }) {
  const form = useForm<ProductFormValues>({ defaultValues });
  capturedForm = form;
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <FormProvider {...form}>
        <VariantsSection mode="edit" />
      </FormProvider>
    </NextIntlClientProvider>
  );
}

function renderHarness(defaultValues: ProductFormValues) {
  return render(<Harness defaultValues={defaultValues} />);
}

const twoValueOptionForm = (): ProductFormValues => ({
  title: '',
  description: '',
  status: 'draft',
  kind: 'physical',
  categoryId: null,
  shippingCost: 0,
  options: [
    {
      id: 'opt-1',
      name: 'Size',
      style: 'dropdown',
      values: [
        { id: 'val-s', value: 'S' },
        { id: 'val-m', value: 'M' },
      ],
    },
  ],
  variants: [
    {
      id: 'var-s',
      valueIndexes: [0],
      sku: 'SKU-S',
      price: 1000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
    {
      id: 'var-m',
      valueIndexes: [1],
      sku: 'SKU-M',
      price: 2000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
  ],
});

describe('VariantsSection regenerate diffing', () => {
  it('preserves id/price/sku for combinations that still exist after adding a new value', async () => {
    renderHarness(twoValueOptionForm());

    // Add a third value ("L") to the Size option.
    const valueInput = screen.getByTestId('option-value-input-0');
    fireEvent.change(valueInput, { target: { value: 'L' } });
    fireEvent.keyDown(valueInput, { key: 'Enter' });

    fireEvent.click(screen.getByTestId('regenerate-variants-button'));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const variants = capturedForm!.getValues('variants');
    expect(variants).toHaveLength(3);

    const s = variants.find((v) => v.valueIndexes.join(',') === '0');
    const m = variants.find((v) => v.valueIndexes.join(',') === '1');
    const l = variants.find((v) => v.valueIndexes.join(',') === '2');

    // Existing combinations keep their id/price/sku untouched.
    expect(s).toMatchObject({ id: 'var-s', sku: 'SKU-S', price: 1000 });
    expect(m).toMatchObject({ id: 'var-m', sku: 'SKU-M', price: 2000 });
    // The brand-new combination gets a fresh default row (no id yet, price 0).
    expect(l).toMatchObject({ price: 0, isActive: true });
    expect(l?.id).toBeUndefined();
  });

  it('drops the delta and keeps the survivor when a value is removed', async () => {
    renderHarness(twoValueOptionForm());

    // Remove the "M" chip (second chip's remove button).
    const removeButtons = screen.getAllByLabelText(messages.Commerce.Editor.Variants.removeValue);
    fireEvent.click(removeButtons[1]);

    fireEvent.click(screen.getByTestId('regenerate-variants-button'));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const variants = capturedForm!.getValues('variants');
    expect(variants).toHaveLength(1);
    expect(variants[0]).toMatchObject({ id: 'var-s', sku: 'SKU-S', price: 1000 });
  });

  it('blocks regeneration with a hard error (not a silent cap) above VARIANT_LIMIT', async () => {
    const form = twoValueOptionForm();
    // 45 * 45 = 2025 > 2000 (VARIANT_LIMIT).
    form.options = [
      {
        name: 'A',
        style: 'dropdown',
        values: Array.from({ length: 45 }, (_, i) => ({ value: `a${i}` })),
      },
      {
        name: 'B',
        style: 'dropdown',
        values: Array.from({ length: 45 }, (_, i) => ({ value: `b${i}` })),
      },
    ];
    renderHarness(form);

    fireEvent.click(screen.getByTestId('regenerate-variants-button'));

    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('2025'));
    expect(toastSuccess).not.toHaveBeenCalled();
    // The original 2-variant array must be untouched — no silent truncation.
    expect(capturedForm!.getValues('variants')).toHaveLength(2);
  });

  it('blocks regeneration when an option has zero values yet', async () => {
    const form = twoValueOptionForm();
    form.options = [
      { name: 'Size', style: 'dropdown', values: [{ value: 'S' }] },
      { name: 'Color', style: 'dropdown', values: [] },
    ];
    renderHarness(form);

    fireEvent.click(screen.getByTestId('regenerate-variants-button'));

    expect(toastError).toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});

describe('VariantsSection last-active-variant guard', () => {
  it('disables the isActive switch and delete button for the only active variant', async () => {
    const form = twoValueOptionForm();
    form.variants[1].isActive = false; // only var-s is active now
    renderHarness(form);

    expect(screen.getByTestId('variant-active-0')).toBeDisabled();
    expect(screen.getByTestId('variant-delete-0')).toBeDisabled();
    // The inactive one is free to toggle/delete.
    expect(screen.getByTestId('variant-active-1')).not.toBeDisabled();
    expect(screen.getByTestId('variant-delete-1')).not.toBeDisabled();
  });

  it('allows deactivating/deleting once another variant is active', async () => {
    renderHarness(twoValueOptionForm());

    expect(screen.getByTestId('variant-active-0')).not.toBeDisabled();
    expect(screen.getByTestId('variant-delete-0')).not.toBeDisabled();
  });
});

describe('VariantsSection variant table edits', () => {
  it('updates price/sku on the correct row without touching the other rows', () => {
    renderHarness(twoValueOptionForm());

    fireEvent.change(screen.getByTestId('variant-sku-0'), { target: { value: 'SKU-S-NEW' } });

    expect(capturedForm!.getValues('variants.0.sku')).toBe('SKU-S-NEW');
    expect(capturedForm!.getValues('variants.1.sku')).toBe('SKU-M');
  });
});
