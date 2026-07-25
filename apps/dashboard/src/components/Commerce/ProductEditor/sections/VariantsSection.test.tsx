import { useMemo } from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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

// `can` defaults to true (every existing test above assumes full edit permission) — the
// dedicated permission-gating suite below overrides it to false, same mocking convention
// `ProductListPage.test.tsx` uses for `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

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
  mockCan.mockReset().mockReturnValue(true);
});

import messages from '@/messages/fa.json';
import { VariantsSection } from './VariantsSection';
import { buildProductFormSchema, type ProductFormValues } from '../productForm.schema';
import type { CommerceProductMedia, CommerceVariantDetail } from '@/types/commerce';

let capturedForm: UseFormReturn<ProductFormValues> | undefined;

function Harness({
  defaultValues,
  productId,
  media,
  existingVariants,
}: {
  defaultValues: ProductFormValues;
  productId?: string;
  media?: CommerceProductMedia[];
  existingVariants?: CommerceVariantDetail[];
}) {
  const form = useForm<ProductFormValues>({ defaultValues });
  capturedForm = form;
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <FormProvider {...form}>
        <VariantsSection
          mode="edit"
          productId={productId}
          media={media}
          existingVariants={existingVariants}
        />
      </FormProvider>
    </NextIntlClientProvider>
  );
}

function renderHarness(
  defaultValues: ProductFormValues,
  extra?: {
    productId?: string;
    media?: CommerceProductMedia[];
    existingVariants?: CommerceVariantDetail[];
  },
) {
  return render(<Harness defaultValues={defaultValues} {...extra} />);
}

// Only used by the Finding-2 regression test below: wires up the SAME zod schema/resolver
// `ProductEditorPage` uses in the real app, so `form.formState.errors` gets populated exactly
// the way `@hookform/resolvers`'s `toNestErrors` really nests it. The other suites above
// intentionally render without a resolver (they only assert on `getValues`/DOM interactions),
// so this is a separate harness rather than a change to the shared one.
function HarnessWithResolverInner({ defaultValues }: { defaultValues: ProductFormValues }) {
  // `useTranslations` needs the `NextIntlClientProvider` context, so this must render as a
  // CHILD of it, not alongside it — mirrors how `ProductEditorPage` builds its schema.
  const t = useTranslations('Commerce.Editor');
  const schema = useMemo(() => buildProductFormSchema(t), [t]);
  const form = useForm<ProductFormValues>({ defaultValues, resolver: zodResolver(schema) });
  capturedForm = form;
  return (
    <FormProvider {...form}>
      <VariantsSection mode="edit" />
    </FormProvider>
  );
}

function HarnessWithResolver({ defaultValues }: { defaultValues: ProductFormValues }) {
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <HarnessWithResolverInner defaultValues={defaultValues} />
    </NextIntlClientProvider>
  );
}

function renderHarnessWithResolver(defaultValues: ProductFormValues) {
  return render(<HarnessWithResolver defaultValues={defaultValues} />);
}

const twoValueOptionForm = (): ProductFormValues => ({
  title: '',
  description: '',
  status: 'draft',
  kind: 'physical',
  categoryId: null,
  collectionIds: [],
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
      _valueIdentities: ['val-s'],
      sku: 'SKU-S',
      price: 1000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
    {
      id: 'var-m',
      valueIndexes: [1],
      _valueIdentities: ['val-m'],
      sku: 'SKU-M',
      price: 2000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
  ],
});

// Size: S(val-s) / M(val-m) / L(val-l) — used by the "remove a middle value" regression test.
// `_valueIdentities` mirrors what `mapProductDetailToFormValues` would populate from real
// backend ids, so the diff can key on stable identity instead of raw position.
const threeValueOptionForm = (): ProductFormValues => ({
  title: '',
  description: '',
  status: 'draft',
  kind: 'physical',
  categoryId: null,
  collectionIds: [],
  shippingCost: 0,
  options: [
    {
      id: 'opt-1',
      name: 'Size',
      style: 'dropdown',
      values: [
        { id: 'val-s', value: 'S' },
        { id: 'val-m', value: 'M' },
        { id: 'val-l', value: 'L' },
      ],
    },
  ],
  variants: [
    {
      id: 'var-s',
      valueIndexes: [0],
      _valueIdentities: ['val-s'],
      sku: 'SKU-S',
      price: 1000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
    {
      id: 'var-m',
      valueIndexes: [1],
      _valueIdentities: ['val-m'],
      sku: 'SKU-M',
      price: 2000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
    {
      id: 'var-l',
      valueIndexes: [2],
      _valueIdentities: ['val-l'],
      sku: 'SKU-L',
      price: 3000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
  ],
});

// Size: S(val-s) / M(val-m) x Color: Red(val-red) / Blue(val-blue) — used by the
// option-row-reorder regression test. Each of the 4 combinations has a distinct, traceable
// price/sku so a mis-mapping after reorder is unambiguous.
const twoOptionMatrixForm = (): ProductFormValues => ({
  title: '',
  description: '',
  status: 'draft',
  kind: 'physical',
  categoryId: null,
  collectionIds: [],
  shippingCost: 0,
  options: [
    {
      id: 'opt-size',
      name: 'Size',
      style: 'dropdown',
      values: [
        { id: 'val-s', value: 'S' },
        { id: 'val-m', value: 'M' },
      ],
    },
    {
      id: 'opt-color',
      name: 'Color',
      style: 'dropdown',
      values: [
        { id: 'val-red', value: 'Red' },
        { id: 'val-blue', value: 'Blue' },
      ],
    },
  ],
  variants: [
    {
      id: 'var-s-red',
      valueIndexes: [0, 0],
      _valueIdentities: ['val-s', 'val-red'],
      sku: 'SKU-S-RED',
      price: 1000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
    {
      id: 'var-s-blue',
      valueIndexes: [0, 1],
      _valueIdentities: ['val-s', 'val-blue'],
      sku: 'SKU-S-BLUE',
      price: 2000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
    {
      id: 'var-m-red',
      valueIndexes: [1, 0],
      _valueIdentities: ['val-m', 'val-red'],
      sku: 'SKU-M-RED',
      price: 3000,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
    {
      id: 'var-m-blue',
      valueIndexes: [1, 1],
      _valueIdentities: ['val-m', 'val-blue'],
      sku: 'SKU-M-BLUE',
      price: 4000,
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

  // Regression for the Critical review finding: the diff used to key existing variants by
  // their raw positional `valueIndexes.join(',')`. Removing a NON-LAST value (the middle
  // "M" here) shifts every later value down by one position without changing what it IS —
  // so the old key '1' (which used to mean M) got matched against the new combo `[1]` (which
  // now means L), silently making the surviving "L" row inherit M's stale price/sku. Keying
  // on each value's stable identity (`id`/`_localId`) instead of position fixes this.
  it("keeps the surviving variant's OWN price/sku after removing a middle option value", async () => {
    renderHarness(threeValueOptionForm());

    // Remove the "M" chip (the middle one — S, [M], L).
    const removeButtons = screen.getAllByLabelText(messages.Commerce.Editor.Variants.removeValue);
    expect(removeButtons).toHaveLength(3);
    fireEvent.click(removeButtons[1]);

    fireEvent.click(screen.getByTestId('regenerate-variants-button'));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const variants = capturedForm!.getValues('variants');
    expect(variants).toHaveLength(2);

    const s = variants.find((v) => v.id === 'var-s');
    const l = variants.find((v) => v.id === 'var-l');

    // S is untouched.
    expect(s).toMatchObject({ sku: 'SKU-S', price: 1000 });
    // L must keep ITS OWN price/sku (3000/SKU-L) — not M's (2000/SKU-M), which is what the
    // old positional diff would have silently assigned it.
    expect(l).toMatchObject({ sku: 'SKU-L', price: 3000 });
    expect(variants.some((v) => v.id === 'var-m')).toBe(false);
  });

  // Regression for the same finding's second half: reordering OPTION ROWS (not just editing
  // values within one row) shifts every existing variant's `valueIndexes` slots exactly like
  // a value removal does — slot 0 used to mean "Size", now means "Color". The stable-identity
  // diff must keep matching variants to the correct combination regardless of which slot the
  // option now occupies.
  it('preserves correct variant-to-value mapping after an option-row reorder', async () => {
    renderHarness(twoOptionMatrixForm());

    // Simulate a Color/Size row reorder (equivalent to what `handleOptionDragEnd` would do —
    // driving the same `options` array `handleRegenerate` reads from is sufficient to exercise
    // the diff logic under test without needing a real dnd-kit pointer/keyboard drag).
    const options = capturedForm!.getValues('options');
    await act(async () => {
      capturedForm!.setValue('options', [options[1], options[0]]);
    });

    fireEvent.click(screen.getByTestId('regenerate-variants-button'));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const variants = capturedForm!.getValues('variants');
    expect(variants).toHaveLength(4);

    // Regardless of which slot (Color first, Size second, post-reorder) each combination now
    // occupies, every row must still carry ITS OWN original price/sku.
    expect(variants.find((v) => v.id === 'var-s-red')).toMatchObject({
      sku: 'SKU-S-RED',
      price: 1000,
    });
    expect(variants.find((v) => v.id === 'var-s-blue')).toMatchObject({
      sku: 'SKU-S-BLUE',
      price: 2000,
    });
    expect(variants.find((v) => v.id === 'var-m-red')).toMatchObject({
      sku: 'SKU-M-RED',
      price: 3000,
    });
    expect(variants.find((v) => v.id === 'var-m-blue')).toMatchObject({
      sku: 'SKU-M-BLUE',
      price: 4000,
    });
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

describe('VariantsSection array-level "at least one active variant" safety net', () => {
  // Regression for the Important review finding: `@hookform/resolvers`'s `toNestErrors`
  // nests a whole-array `.refine` error under `errors.variants.root`, not directly on
  // `errors.variants`, whenever the array's own item fields (`variants.0.price`, etc.) are
  // also registered — which they always are here. The old code read
  // `errors.variants.message`, which is therefore always `undefined`, so this safety-net
  // message never rendered. This uses the resolver-wired harness (the real app's schema) so
  // `formState.errors` is populated exactly the way it really nests, rather than asserting on
  // a hand-built errors object.
  it('renders the safety-net message when the schema-level refine fires', async () => {
    const form = twoValueOptionForm();
    // Both variants inactive — e.g. legacy data already at zero active variants on load. The
    // primary UI guard (disabled switch/delete on the "last active" variant) never blocks
    // this state from existing in the first place, since it only stops the user from
    // creating it via the switches — it doesn't retroactively fix already-invalid data.
    form.variants[0].isActive = false;
    form.variants[1].isActive = false;
    renderHarnessWithResolver(form);

    await act(async () => {
      await capturedForm!.trigger();
    });

    expect(
      await screen.findByText(messages.Commerce.Editor.Validation.atLeastOneActiveVariantRequired),
    ).toBeInTheDocument();
  });
});

describe('VariantsSection per-variant media button', () => {
  const MEDIA_1: CommerceProductMedia = {
    id: 'media-1',
    type: 'image',
    position: 0,
    alt: null,
    url: 'https://cdn.example.com/media-1.jpg',
    posterUrl: null,
  };

  // `PUT /commerce/products/:id/variants/:variantId/media` requires a real, persisted
  // variant id. A variant just added this session (id undefined, e.g. via "regenerate" or a
  // fresh row) has no such id yet — the button must stay disabled rather than attempt the
  // call with a missing/undefined variantId.
  it('disables the media button for a variant with no real persisted id yet', () => {
    const form = twoValueOptionForm();
    form.variants[1].id = undefined;
    renderHarness(form, { productId: 'prod-1', media: [MEDIA_1] });

    expect(screen.getByTestId('variant-media-button-0')).not.toBeDisabled();
    expect(screen.getByTestId('variant-media-button-1')).toBeDisabled();
  });

  it('shows a dashed placeholder (no cover assigned) for a saved variant with no media override', () => {
    renderHarness(twoValueOptionForm(), { productId: 'prod-1', media: [MEDIA_1] });

    const button = screen.getByTestId('variant-media-button-0');
    expect(button).not.toBeDisabled();
    expect(button.querySelector('img')).not.toBeInTheDocument();
  });

  it("shows the variant's own cover thumbnail once it has a media assignment", () => {
    const existingVariants: CommerceVariantDetail[] = [
      {
        id: 'var-s',
        sku: 'SKU-S',
        price: 1000,
        compareAtPrice: null,
        salePrice: null,
        saleStartsAt: null,
        saleEndsAt: null,
        optionSignature: '',
        position: 0,
        isActive: true,
        trackInventory: false,
        allowBackorder: false,
        weight: null,
        onHand: 0,
        lowStockThreshold: null,
        optionValueIds: ['val-s'],
        media: { selectedMediaIds: ['media-1'], coverMediaId: 'media-1' },
      },
    ];
    renderHarness(twoValueOptionForm(), {
      productId: 'prod-1',
      media: [MEDIA_1],
      existingVariants,
    });

    const button = screen.getByTestId('variant-media-button-0');
    const img = button.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('src')).toBe(MEDIA_1.url);
  });

  // Regression for the whole-branch review finding: the per-variant media button opened
  // `VariantMediaPickerDialog`'s `handleSave` (a real `PUT .../variants/:variantId/media`)
  // with no permission check anywhere in the chain. The button must disable the same way it
  // already does for an unsaved variant.
  it('disables the media button when the viewer lacks product:edit, even for a saved variant', () => {
    mockCan.mockReturnValue(false);
    renderHarness(twoValueOptionForm(), { productId: 'prod-1', media: [MEDIA_1] });

    expect(screen.getByTestId('variant-media-button-0')).toBeDisabled();
    expect(screen.getByTestId('variant-media-button-1')).toBeDisabled();
  });
});
