import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

import type { CommerceCollectionListItem, PaginatedResult } from '@/types/commerce';

// `CollectionsSection` fetches `/commerce/collections` through `useSWRImmutable` — control
// its return value per test instead of hitting a real endpoint, same convention
// `InventorySection.test.tsx` uses for its own `useSWRImmutable` call.
const { mockUseSWRImmutable } = vi.hoisted(() => ({ mockUseSWRImmutable: vi.fn() }));
vi.mock('swr/immutable', () => ({
  default: (...args: unknown[]) => mockUseSWRImmutable(...args),
}));

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock('swr', () => ({ mutate: mutateMock }));

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

const { put } = vi.hoisted(() => ({ put: vi.fn().mockResolvedValue({ data: {} }) }));
vi.mock('@/hooks/swr/api-client', () => ({ default: { put } }));

// `can` defaults to true (every existing test above assumes full edit permission) — the
// dedicated permission-gating suite below overrides it to false, same mocking convention
// `ProductListPage.test.tsx` uses for `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

import messages from '@/messages/fa.json';
import { CollectionsSection } from './CollectionsSection';
import { buildEmptyProductFormValues, type ProductFormValues } from '../productForm.schema';

// Create mode reads/writes `collectionIds` through `useFormContext`, so it must render inside
// a FormProvider. `latestValues` lets a test assert what the form now holds without a submit.
let latestValues: ProductFormValues | null = null;
const CreateModeHarness = () => {
  const form = useForm<ProductFormValues>({ defaultValues: buildEmptyProductFormValues() });
  latestValues = form.watch();
  return (
    <FormProvider {...form}>
      <CollectionsSection mode="create" productId={undefined} />
    </FormProvider>
  );
};

function renderCreateSection() {
  latestValues = null;
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <CreateModeHarness />
    </NextIntlClientProvider>,
  );
}

function renderSection(mode: 'create' | 'edit' = 'edit', productId: string | undefined = 'prod-1') {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <CollectionsSection mode={mode} productId={productId} />
    </NextIntlClientProvider>,
  );
}

const collectionsPage = (
  items: CommerceCollectionListItem[],
): PaginatedResult<CommerceCollectionListItem[]> => ({
  items,
  meta: {
    currentPage: 1,
    itemCount: items.length,
    itemsPerPage: items.length,
    totalItems: items.length,
    totalPages: 1,
  },
});

const SUMMER: CommerceCollectionListItem = {
  id: 'col-1',
  name: 'Summer',
  slug: 'summer',
  productIds: ['prod-1', 'prod-2'],
  productCount: 0,
  createDate: '2026-07-01T00:00:00.000Z',
  updateDate: '2026-07-01T00:00:00.000Z',
};

const WINTER: CommerceCollectionListItem = {
  id: 'col-2',
  name: 'Winter',
  slug: 'winter',
  productIds: ['prod-2'],
  productCount: 0,
  createDate: '2026-07-01T00:00:00.000Z',
  updateDate: '2026-07-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSWRImmutable.mockReturnValue({ data: undefined, error: undefined, isLoading: false });
  mutateMock.mockResolvedValue(undefined);
  put.mockResolvedValue({ data: {} });
  mockCan.mockReset().mockReturnValue(true);
});

describe('CollectionsSection', () => {
  it('offers the collections as chips in create mode and records the pick in the form, without any PUT', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([SUMMER, WINTER]),
      error: undefined,
      isLoading: false,
    });
    renderCreateSection();

    // Create mode fetches the same list — there is no product id to scope it, so the key is
    // the plain collections key rather than the old `null`.
    expect(mockUseSWRImmutable).toHaveBeenCalledWith('/commerce/collections');
    expect(latestValues?.collectionIds).toEqual([]);

    fireEvent.click(screen.getByTestId(`collection-chip-${SUMMER.id}`));

    // The choice lives in the form and rides along in POST /commerce/products — membership is
    // NEVER written through the collection-side PUT here, because the product has no id yet.
    expect(latestValues?.collectionIds).toEqual([SUMMER.id]);
    expect(put).not.toHaveBeenCalled();
  });

  it('un-picks a collection chip in create mode', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([SUMMER, WINTER]),
      error: undefined,
      isLoading: false,
    });
    renderCreateSection();

    fireEvent.click(screen.getByTestId(`collection-chip-${SUMMER.id}`));
    fireEvent.click(screen.getByTestId(`collection-chip-${WINTER.id}`));
    expect(latestValues?.collectionIds).toEqual([SUMMER.id, WINTER.id]);

    fireEvent.click(screen.getByTestId(`collection-chip-${SUMMER.id}`));
    expect(latestValues?.collectionIds).toEqual([WINTER.id]);
    expect(put).not.toHaveBeenCalled();
  });

  it('renders a chip per collection, marking membership from productIds', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([SUMMER, WINTER]),
      error: undefined,
      isLoading: false,
    });
    renderSection();

    expect(mockUseSWRImmutable).toHaveBeenCalledWith('/commerce/collections');
    expect(screen.getByTestId('collection-chip-col-1')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('collection-chip-col-2')).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking an inactive chip PUTs the FULL desired productIds (append), then revalidates', async () => {
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([WINTER]),
      error: undefined,
      isLoading: false,
    });
    renderSection();

    fireEvent.click(screen.getByTestId('collection-chip-col-2'));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/collections/col-2', {
        productIds: ['prod-2', 'prod-1'],
      }),
    );
    expect(toastSuccess).toHaveBeenCalled();
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/collections'));
  });

  it('clicking an active chip PUTs the FULL desired productIds (remove), not just this id', async () => {
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([SUMMER]),
      error: undefined,
      isLoading: false,
    });
    renderSection();

    fireEvent.click(screen.getByTestId('collection-chip-col-1'));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/collections/col-1', {
        productIds: ['prod-2'],
      }),
    );
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/collections'));
  });

  it('a PUT failure shows an error toast but still revalidates and clears the pending state', async () => {
    put.mockRejectedValueOnce(new Error('network error'));
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([WINTER]),
      error: undefined,
      isLoading: false,
    });
    renderSection();

    const chip = screen.getByTestId('collection-chip-col-2');
    fireEvent.click(chip);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/collections'));
    // Not stranded in a permanently-disabled pending state after the settle.
    await waitFor(() => expect(chip).not.toBeDisabled());
  });

  it('a revalidate-fetch hiccup after a successful PUT is not misreported as a save failure', async () => {
    mutateMock.mockRejectedValueOnce(new Error('revalidate hiccup'));
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([WINTER]),
      error: undefined,
      isLoading: false,
    });
    renderSection();

    const chip = screen.getByTestId('collection-chip-col-2');
    fireEvent.click(chip);

    await waitFor(() => expect(put).toHaveBeenCalled());
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(toastError).not.toHaveBeenCalled();
    // The pending state must still clear even though `mutate` rejected.
    await waitFor(() => expect(chip).not.toBeDisabled());
  });

  it('disables every chip and never PUTs when the viewer lacks product:edit', () => {
    mockCan.mockReturnValue(false);
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([SUMMER, WINTER]),
      error: undefined,
      isLoading: false,
    });
    renderSection();

    const chip = screen.getByTestId('collection-chip-col-2');
    expect(chip).toBeDisabled();

    fireEvent.click(chip);
    expect(put).not.toHaveBeenCalled();
  });
});
