import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { CommerceProductDetail } from '@/types/commerce';

/**
 * The shell's own test. The nine sections, the grid, the rail and the dialogs each have their
 * own; what is unverified until they are assembled is the WIRING — that the page mounts at all,
 * that an axis edit reaches `syncVariants`, and that the load is seeded exactly once.
 */

const { mockUseSWRImmutable } = vi.hoisted(() => ({ mockUseSWRImmutable: vi.fn() }));
vi.mock('swr/immutable', () => ({ default: (key: unknown) => mockUseSWRImmutable(key) }));
vi.mock('swr', () => ({ mutate: vi.fn() }));

const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: mockCan }) }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const { api } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/hooks/swr/api-client', () => ({ default: api }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

// Radix measures itself with `ResizeObserver` on mount and jsdom does not implement it — the
// same stub `AutomationForm.test.tsx` uses.
beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

import messages from '@/messages/fa.json';
import { ProductEditorPage } from './ProductEditorPage';

const ATTR = messages.Commerce.Editor.Attributes;
const VARIANTS = messages.Commerce.Editor.Variants;

const detail = (over: Partial<CommerceProductDetail> = {}): CommerceProductDetail =>
  ({
    id: 'prod-1',
    workspaceId: 'ws-1',
    title: 'کفش ورزشی',
    description: '',
    slug: 'shoe',
    status: 'active',
    kind: 'physical',
    categoryId: null,
    needsStockReview: false,
    shippingCost: 0,
    createDate: '2026-07-01T00:00:00.000Z',
    updateDate: '2026-07-01T00:00:00.000Z',
    options: [],
    variants: [
      {
        id: 'var-1',
        position: 0,
        optionValueIds: [],
        sku: null,
        price: 250000,
        compareAtPrice: null,
        salePrice: null,
        saleStartsAt: null,
        saleEndsAt: null,
        isActive: true,
        trackInventory: true,
        onHand: 4,
        allowBackorder: false,
        weight: null,
        media: { selectedMediaIds: [], coverMediaId: null },
      },
    ],
    media: [],
    tags: [],
    specs: [],
    ...over,
  }) as CommerceProductDetail;

/** `useProductLoad` fires four `useSWRImmutable` calls; answer each by its key. */
function stubReads(product: CommerceProductDetail | undefined) {
  mockUseSWRImmutable.mockImplementation((key: string | null) => {
    if (key === '/commerce/categories') return { data: { items: [] }, isLoading: false };
    if (key === '/commerce/collections') return { data: { items: [] }, isLoading: false };
    if (key === '/commerce/tags') return { data: { items: [] }, isLoading: false };
    if (key == null) return { data: undefined, isLoading: false };
    return { data: product ? { data: product } : undefined, isLoading: !product };
  });
}

function renderEditor(props: { mode: 'create' | 'edit'; productId?: string }) {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ProductEditorPage {...props} />
    </NextIntlClientProvider>,
  );
}

/** Adds one axis in step ۷ and pushes a comma-separated list of values into it. */
async function addAxis(name: string, values: string) {
  fireEvent.click(screen.getByText(ATTR.addAttribute));
  fireEvent.change(await screen.findByLabelText(ATTR.namePlaceholder), { target: { value: name } });

  const draft = screen.getByLabelText(ATTR.valuePlaceholder);
  fireEvent.change(draft, { target: { value: values } });
  fireEvent.keyDown(draft, { key: 'Enter' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCan.mockReset().mockReturnValue(true);
});

describe('ProductEditorPage', () => {
  it('mounts the whole create shell — top bar, the nine steps and the rail', () => {
    stubReads(undefined);

    renderEditor({ mode: 'create' });

    expect(screen.getByText(messages.Commerce.Editor.TopBar.newProduct)).toBeInTheDocument();
    expect(screen.getByText(messages.Commerce.Editor.Title.title)).toBeInTheDocument();
    // By testid, not by heading text: "رسانه" is also the grid's media column header.
    expect(screen.getByTestId('media-dropzone')).toBeInTheDocument();
    expect(
      screen.getByRole('grid', { name: messages.Commerce.Editor.Variants.gridLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('complementary', { name: messages.Commerce.Editor.Rail.label }),
    ).toBeInTheDocument();
  });

  it('seeds the form from the loaded product', async () => {
    stubReads(detail());

    renderEditor({ mode: 'edit', productId: 'prod-1' });

    await waitFor(() =>
      expect(screen.getByLabelText(messages.Commerce.Editor.Title.title)).toHaveValue('کفش ورزشی'),
    );
  });

  it('generates the variation rows when an axis value is added', async () => {
    stubReads(undefined);

    renderEditor({ mode: 'create' });
    await addAxis('رنگ', 'قرمز، آبی');

    // Two values on one axis ⇒ two rows, and the footer is the one thing that counts them all.
    await waitFor(() => expect(screen.getByText(/۲ تنوع$/)).toBeInTheDocument());
  });

  /**
   * The real negative. Regeneration is driven by the axis EVENT HANDLERS; if it were ever moved
   * into an effect watching `options`, deleting a row would itself re-trigger it and the row
   * would come straight back — so a delete that STICKS across a later sync is the only assertion
   * that can tell the two apart.
   *
   * It also proves the page shares ONE `useVariantSync` instance: `removeRows` (called by the
   * grid) and `syncVariants` (called by the axis section) have to see the same suppression list,
   * which they only do through the provider the shell renders.
   */
  it('does not resurrect a deleted row when a later axis edit regenerates', async () => {
    stubReads(undefined);

    renderEditor({ mode: 'create' });
    await addAxis('رنگ', 'قرمز، آبی');
    await screen.findByText(/۲ تنوع$/);

    // Scoped to the grid: `Attributes.removeValue` and `Variants.remove` render the SAME Persian
    // label ("حذف قرمز"), so an unscoped query matches the axis chip's ✕ as well as the row's —
    // and the chip stays put after the row is deleted, which would make the assertion below pass
    // for the wrong reason.
    const grid = () => within(screen.getByRole('grid', { name: VARIANTS.gridLabel }));
    fireEvent.click(grid().getByLabelText(VARIANTS.remove.replace('{name}', 'قرمز')));
    await waitFor(() => expect(screen.getByText(/۱ تنوع$/)).toBeInTheDocument());

    // A third value runs `syncVariants` again — the moment an effect-based version would bring
    // قرمز back. Only سبز may appear.
    const draft = screen.getByLabelText(ATTR.valuePlaceholder);
    fireEvent.change(draft, { target: { value: 'سبز' } });
    fireEvent.keyDown(draft, { key: 'Enter' });

    await waitFor(() => expect(screen.getByText(/۲ تنوع$/)).toBeInTheDocument());
    expect(
      grid().queryByLabelText(VARIANTS.remove.replace('{name}', 'قرمز')),
    ).not.toBeInTheDocument();
    expect(grid().getByLabelText(VARIANTS.remove.replace('{name}', 'سبز'))).toBeInTheDocument();
  });
});
