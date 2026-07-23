import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

import type {
  CommerceStockMovement,
  CommerceVariantDetail,
  PaginatedResult,
} from '@/types/commerce';

// `InventorySection` fetches the ledger through `useSWRImmutable` — control its return value
// per test instead of hitting a real endpoint, same convention `ProductListPage.test.tsx`
// uses for its own paginated `useSWRImmutable` call.
const { mockUseSWRImmutable } = vi.hoisted(() => ({ mockUseSWRImmutable: vi.fn() }));
vi.mock('swr/immutable', () => ({
  default: (...args: unknown[]) => mockUseSWRImmutable(...args),
}));

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock('swr', () => ({ mutate: mutateMock }));

const { patch } = vi.hoisted(() => ({ patch: vi.fn().mockResolvedValue({ data: {} }) }));
vi.mock('@/hooks/swr/api-client', () => ({ default: { patch } }));

import messages from '@/messages/fa.json';
import { InventorySection } from './InventorySection';
import type { ProductFormValues } from '../productForm.schema';

function Harness({
  defaultValues,
  productId,
  existingVariants,
  mode = 'edit',
}: {
  defaultValues: ProductFormValues;
  productId?: string;
  existingVariants?: CommerceVariantDetail[];
  mode?: 'create' | 'edit';
}) {
  const form = useForm<ProductFormValues>({ defaultValues });
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <FormProvider {...form}>
        <InventorySection mode={mode} productId={productId} existingVariants={existingVariants} />
      </FormProvider>
    </NextIntlClientProvider>
  );
}

const buildForm = (variants: ProductFormValues['variants']): ProductFormValues => ({
  title: 't',
  description: '',
  status: 'draft',
  kind: 'physical',
  categoryId: null,
  shippingCost: 0,
  options: [],
  variants,
});

const buildMovement = (overrides: Partial<CommerceStockMovement>): CommerceStockMovement => ({
  id: 'mv-1',
  variantId: 'var-1',
  locationId: 'loc-1',
  delta: 0,
  reason: 'manual',
  referenceId: null,
  actorId: null,
  createDate: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

const emptyLedgerPage = (): PaginatedResult<CommerceStockMovement[]> => ({
  items: [],
  meta: { currentPage: 1, itemCount: 0, itemsPerPage: 20, totalItems: 0, totalPages: 1 },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSWRImmutable.mockReturnValue({ data: undefined, error: undefined, isLoading: false });
  mutateMock.mockResolvedValue(undefined);
  patch.mockResolvedValue({ data: {} });
});

describe('InventorySection', () => {
  it('shows the "save the product first" message in create mode', () => {
    render(
      <Harness
        defaultValues={buildForm([
          {
            price: 0,
            isActive: true,
            trackInventory: false,
            allowBackorder: false,
            valueIndexes: [],
          },
        ])}
        mode="create"
      />,
    );

    expect(
      screen.getByText(messages.Commerce.Editor.Inventory.saveProductFirst),
    ).toBeInTheDocument();
  });

  it('disables ledger/adjust controls for a variant with no persisted id, with a "save first" tooltip', () => {
    render(
      <Harness
        productId="prod-1"
        defaultValues={buildForm([
          {
            price: 0,
            isActive: true,
            trackInventory: false,
            allowBackorder: false,
            valueIndexes: [],
          },
        ])}
        existingVariants={[]}
      />,
    );

    expect(screen.getByTestId('inventory-view-ledger-0')).toBeDisabled();
    expect(screen.getByTestId('inventory-adjust-stock-0')).toBeDisabled();
  });

  it('enables ledger/adjust controls for a variant that already has a real id, and shows its onHand', () => {
    render(
      <Harness
        productId="prod-1"
        defaultValues={buildForm([
          {
            id: 'var-1',
            price: 1000,
            isActive: true,
            trackInventory: true,
            allowBackorder: false,
            valueIndexes: [],
          },
        ])}
        existingVariants={[
          {
            id: 'var-1',
            sku: null,
            price: 1000,
            compareAtPrice: null,
            salePrice: null,
            saleStartsAt: null,
            saleEndsAt: null,
            optionSignature: '',
            position: 0,
            isActive: true,
            trackInventory: true,
            allowBackorder: false,
            weight: null,
            onHand: 18,
            lowStockThreshold: null,
            optionValueIds: [],
            media: { selectedMediaIds: [], coverMediaId: null },
          },
        ]}
      />,
    );

    expect(screen.getByTestId('inventory-view-ledger-0')).not.toBeDisabled();
    expect(screen.getByTestId('inventory-adjust-stock-0')).not.toBeDisabled();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  const savedVariant: CommerceVariantDetail = {
    id: 'var-1',
    sku: null,
    price: 1000,
    compareAtPrice: null,
    salePrice: null,
    saleStartsAt: null,
    saleEndsAt: null,
    optionSignature: '',
    position: 0,
    isActive: true,
    trackInventory: true,
    allowBackorder: false,
    weight: null,
    onHand: 18,
    lowStockThreshold: null,
    optionValueIds: [],
    media: { selectedMediaIds: [], coverMediaId: null },
  };

  it('clicking "view ledger" fetches the movements for that variant and reconstructs balanceAfter using the live onHand', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [
          buildMovement({ id: 'mv-2', delta: -2, createDate: '2026-07-02T00:00:00.000Z' }),
          buildMovement({ id: 'mv-1', delta: 50, createDate: '2026-07-01T00:00:00.000Z' }),
        ],
        meta: { currentPage: 1, itemCount: 2, itemsPerPage: 20, totalItems: 2, totalPages: 1 },
      },
      error: undefined,
      isLoading: false,
    });

    render(
      <Harness
        productId="prod-1"
        defaultValues={buildForm([{ ...savedVariant, valueIndexes: [] }])}
        existingVariants={[savedVariant]}
      />,
    );

    fireEvent.click(screen.getByTestId('inventory-view-ledger-0'));

    // Always fetches a single large page (the backend's documented `@Max(200)` cap on
    // `ReadMovementsDto.limit`) at `page=1` — never re-fetches per displayed page, see the
    // multi-page test below.
    expect(mockUseSWRImmutable).toHaveBeenCalledWith(
      '/commerce/products/prod-1/movements/var-1?page=1&limit=200',
    );

    // Row 0 (newest, delta -2): balanceAfter = currentOnHand (18).
    // Row 1 (delta +50): balanceAfter = 18 - (-2) = 20.
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.getByText('+50')).toBeInTheDocument();
    const balanceCells = screen.getAllByText(/^(18|20)$/);
    expect(balanceCells.length).toBeGreaterThanOrEqual(2);
  });

  it('reconstructs balanceAfter correctly for rows past the first display page, from a single fetched set', () => {
    // 25 movements (more than the default 20-per-display-page), each delta = -1, DESC-ordered
    // (index 0 = newest). With currentOnHand = 100, hand-computed balanceAfter[i] = 100 + i —
    // in particular row 20 (the FIRST row of display-page 2) must be 120, not 100. Under the
    // old bug (re-fetching a server page and re-anchoring each page at `currentOnHand`), page
    // 2's first row would have been wrongly shown as 100.
    const totalMovements = 25;
    const movements: CommerceStockMovement[] = Array.from({ length: totalMovements }, (_, i) =>
      buildMovement({
        id: `mv-${totalMovements - i}`,
        delta: -1,
        createDate: new Date(2026, 6, totalMovements - i).toISOString(),
      }),
    );

    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: movements,
        meta: {
          currentPage: 1,
          itemCount: totalMovements,
          itemsPerPage: 200,
          totalItems: totalMovements,
          totalPages: 1,
        },
      },
      error: undefined,
      isLoading: false,
    });

    render(
      <Harness
        productId="prod-1"
        defaultValues={buildForm([{ ...savedVariant, valueIndexes: [] }])}
        existingVariants={[{ ...savedVariant, onHand: 100 }]}
      />,
    );

    fireEvent.click(screen.getByTestId('inventory-view-ledger-0'));

    // Scope queries to the ledger rows only — the variants table above also shows the raw
    // onHand (100) in its own "stock" column, which would otherwise collide with balanceAfter.
    const ledgerRows = () => within(screen.getByTestId('inventory-ledger-rows'));

    // Display page 1 (rows 0-19): first row's balanceAfter is the live onHand (100).
    expect(ledgerRows().getByText('100')).toBeInTheDocument();
    // Row 19 (last on page 1) must show 119, not yet visible until we've confirmed page 1
    // renders correctly — this only appears once, unambiguously, on page 1.
    expect(ledgerRows().getByText('119')).toBeInTheDocument();
    // Row 20 (page 2's first row) is NOT rendered yet.
    expect(ledgerRows().queryByText('120')).not.toBeInTheDocument();

    // Advance to display page 2 — this must be a pure client-side slice, never a new server
    // fetch with a different `page`/`limit`.
    fireEvent.click(screen.getByText('صفحه بعد').closest('button')!);

    // Row 20's balanceAfter must be 120 (100 + 20) — the correct value anchored on the WHOLE
    // fetched set, not 100 (which is what the old per-page-refetch bug would have shown).
    expect(ledgerRows().getByText('120')).toBeInTheDocument();
    expect(ledgerRows().getByText('124')).toBeInTheDocument(); // row 24, the oldest movement.
    // Page 1's rows are no longer rendered.
    expect(ledgerRows().queryByText('119')).not.toBeInTheDocument();

    // The SWR key never changed — still `page=1&limit=200` — proving no server re-fetch was
    // triggered by moving to display page 2.
    expect(mockUseSWRImmutable).toHaveBeenLastCalledWith(
      '/commerce/products/prod-1/movements/var-1?page=1&limit=200',
    );
  });

  it('shows a "more movements than fetched" notice only when the backend reports more total items than were fetched', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [buildMovement({ id: 'mv-1', delta: -1 })],
        meta: { currentPage: 1, itemCount: 1, itemsPerPage: 200, totalItems: 250, totalPages: 2 },
      },
      error: undefined,
      isLoading: false,
    });

    render(
      <Harness
        productId="prod-1"
        defaultValues={buildForm([{ ...savedVariant, valueIndexes: [] }])}
        existingVariants={[savedVariant]}
      />,
    );

    fireEvent.click(screen.getByTestId('inventory-view-ledger-0'));

    expect(screen.getByTestId('inventory-ledger-truncated-notice')).toBeInTheDocument();
  });

  it('does NOT show the "more movements than fetched" notice when everything was fetched', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [buildMovement({ id: 'mv-1', delta: -1 })],
        meta: { currentPage: 1, itemCount: 1, itemsPerPage: 200, totalItems: 1, totalPages: 1 },
      },
      error: undefined,
      isLoading: false,
    });

    render(
      <Harness
        productId="prod-1"
        defaultValues={buildForm([{ ...savedVariant, valueIndexes: [] }])}
        existingVariants={[savedVariant]}
      />,
    );

    fireEvent.click(screen.getByTestId('inventory-view-ledger-0'));

    expect(screen.queryByTestId('inventory-ledger-truncated-notice')).not.toBeInTheDocument();
  });

  it('shows the empty-ledger message once fetched with no movements', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: emptyLedgerPage(),
      error: undefined,
      isLoading: false,
    });

    render(
      <Harness
        productId="prod-1"
        defaultValues={buildForm([{ ...savedVariant, valueIndexes: [] }])}
        existingVariants={[savedVariant]}
      />,
    );

    fireEvent.click(screen.getByTestId('inventory-view-ledger-0'));

    expect(screen.getByText(messages.Commerce.Editor.Inventory.Ledger.empty)).toBeInTheDocument();
  });

  it('clicking "adjust stock" opens the AdjustStockDialog for that variant', () => {
    render(
      <Harness
        productId="prod-1"
        defaultValues={buildForm([{ ...savedVariant, valueIndexes: [] }])}
        existingVariants={[savedVariant]}
      />,
    );

    fireEvent.click(screen.getByTestId('inventory-adjust-stock-0'));

    expect(screen.getByText(messages.Commerce.Editor.Inventory.Adjust.title)).toBeInTheDocument();
    expect(screen.getByTestId('adjust-stock-new-on-hand')).toHaveValue('18');
  });
});
