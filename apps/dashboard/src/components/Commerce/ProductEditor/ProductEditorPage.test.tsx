import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { CommerceProductDetail, CommerceProductMedia } from '@/types/commerce';

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
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
});

import { mutate } from 'swr';
import { toast } from 'sonner';
import messages from '@/messages/fa.json';
import { dragEndRef } from './testUtils/dndKitTestMocks';
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

const twoMedia: CommerceProductMedia[] = [
  {
    id: 'media-1',
    type: 'image',
    position: 0,
    alt: null,
    url: 'https://cdn/1.png',
    posterUrl: null,
  },
  {
    id: 'media-2',
    type: 'image',
    position: 1,
    alt: null,
    url: 'https://cdn/2.png',
    posterUrl: null,
  },
];

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

// `dragEndRef.current` is the mocked `@dnd-kit/core`'s captured `onDragEnd`, invoked directly
// rather than through a simulated pointer sequence. That bypasses React's synthetic-event
// batching, so the resulting `setValue` calls need an explicit `act()` — otherwise React warns
// about a state update outside of `act` even though the assertions below are still correct.
function fireMediaDragEnd(activeId: string, overId: string) {
  act(() => {
    dragEndRef.current?.({ active: { id: activeId }, over: { id: overId } });
  });
}

function mediaTileIds() {
  return screen
    .getAllByTestId(/^media-tile-/)
    .map((el) => el.getAttribute('data-testid')!.replace('media-tile-', ''));
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

  /**
   * The whole point of this pair: a merchant is told "چند مورد کامل نیست. موردهای قرمز را درست
   * کنید" and the description/category fields must actually turn red — this was the bug (see
   * final-fix-brief Finding 1). `errors.description`/`errors.categoryId` reaching the DOM proves
   * both `firstErrorPath` recognizes the paths AND the two sections render the error at all.
   */
  it('shows the required-description message when the schema rejects an empty description', async () => {
    stubReads(undefined);
    renderEditor({ mode: 'create' });

    fireEvent.click(screen.getByTestId('editor-save'));

    await waitFor(() =>
      expect(
        screen.getByText(messages.Commerce.Editor.Validation.descriptionRequired),
      ).toBeInTheDocument(),
    );
    expect(screen.getByTestId('description-input')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the required-category message when the schema rejects a null category', async () => {
    stubReads(undefined);
    renderEditor({ mode: 'create' });

    fireEvent.click(screen.getByTestId('editor-save'));

    await waitFor(() =>
      expect(
        screen.getByText(messages.Commerce.Editor.Validation.categoryRequired),
      ).toBeInTheDocument(),
    );
    expect(screen.getByTestId('category-path').parentElement).toHaveAttribute('data-bad', 'empty');
  });

  describe('media reorder', () => {
    it('reorders pending media locally in create mode, without an API call', async () => {
      stubReads(undefined);
      renderEditor({ mode: 'create' });

      const fileInput = screen
        .getByTestId('media-dropzone')
        .querySelector('input[type="file"]') as HTMLInputElement;
      const fileA = new File(['a'], 'a.png', { type: 'image/png' });
      const fileB = new File(['b'], 'b.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [fileA, fileB] } });

      await waitFor(() => expect(mediaTileIds()).toHaveLength(2));
      const [firstId, secondId] = mediaTileIds();

      fireMediaDragEnd(secondId, firstId);

      await waitFor(() => expect(mediaTileIds()).toEqual([secondId, firstId]));
      expect(api.patch).not.toHaveBeenCalled();
    });

    it('persists the new order via PATCH and refreshes the cache in edit mode', async () => {
      stubReads(detail({ media: twoMedia }));
      api.patch.mockResolvedValue({});

      renderEditor({ mode: 'edit', productId: 'prod-1' });
      await waitFor(() => expect(mediaTileIds()).toEqual(['media-1', 'media-2']));

      fireMediaDragEnd('media-2', 'media-1');

      await waitFor(() => expect(mediaTileIds()).toEqual(['media-2', 'media-1']));
      await waitFor(() =>
        expect(api.patch).toHaveBeenCalledWith('/commerce/products/prod-1/media', {
          mediaIds: ['media-2', 'media-1'],
        }),
      );
      await waitFor(() => expect(mutate).toHaveBeenCalledWith('/commerce/products/prod-1'));
    });

    it('rolls back the order and shows an error toast when the PATCH fails', async () => {
      stubReads(detail({ media: twoMedia }));
      // Held open rather than `mockRejectedValue`: an already-settled mock promise rejects on
      // the very next microtask, which can race the optimistic React state flush and collapse
      // both updates into one commit — this deterministically defers rejection until AFTER the
      // optimistic order has actually rendered, so the two states are observed in the right order.
      let rejectPatch!: (error: Error) => void;
      api.patch.mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            rejectPatch = reject;
          }),
      );

      renderEditor({ mode: 'edit', productId: 'prod-1' });
      await waitFor(() => expect(mediaTileIds()).toEqual(['media-1', 'media-2']));

      fireMediaDragEnd('media-2', 'media-1');
      await waitFor(() => expect(mediaTileIds()).toEqual(['media-2', 'media-1']));

      await act(async () => {
        rejectPatch(new Error('network'));
      });

      await waitFor(() => expect(mediaTileIds()).toEqual(['media-1', 'media-2']));
      expect(toast.error).toHaveBeenCalledWith(messages.Commerce.Editor.Media.reorderError);
    });
  });
});
