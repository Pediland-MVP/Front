import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '../../constants/automationContent.enum';
import type { AutomationBuilderApiClient } from '../../types/apiClient';
// Reuse the shared dnd-kit test mock (copied from the dashboard's Commerce ProductEditor
// testUtils -- see this file's own header comment for why it's a copy, not an import).
// Imported BEFORE `BuyInDirectContent` deliberately: `vi.mock` calls only get hoisted
// above imports within the SAME file that writes them (Vitest's transform scans that
// file's own source) -- since these calls live in a separate module, plain ESM import
// order is what decides whether `@dnd-kit/sortable` is mocked before `BuyInDirectContent`
// (which imports it) ever loads the real module. `MediaSection.test.tsx` relies on the
// exact same ordering for the same reason.
import { dragEndRef } from './dndKitTestMocks';
import { BuyInDirectContent } from '../BuyInDirectContent';

// `BuyInDirectContent`/its children render several `useTranslations(...)` calls. Without a
// `NextIntlClientProvider` this throws "No intl context found" -- stub the hook to just
// echo the translation key back, same as this folder's `MediaContent.test.tsx`.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const PRODUCTS = [
  // `p-b` deliberately has no cover and no price: both are nullable on a commerce product,
  // and both would crash or mis-render if the tile/dialog assumed they exist.
  {
    id: 'p-a',
    title: 'کفش نایک',
    coverMediaUrl: 'https://cdn/a.jpg',
    minPrice: 240000,
    maxPrice: 240000,
  },
  { id: 'p-b', title: 'کوله پشتی', coverMediaUrl: null, minPrice: null, maxPrice: null },
];

function makeApiClient(hasCardToCard: boolean = true): AutomationBuilderApiClient {
  return {
    upload: vi.fn(),
    get: vi.fn((url: string) => {
      if (url.startsWith('/commerce/products')) {
        return Promise.resolve({ data: { items: PRODUCTS, meta: {} } });
      }
      if (url.startsWith('/payments/cardToCard')) {
        return Promise.resolve({ data: hasCardToCard ? { id: 'card-1' } : null });
      }
      return Promise.resolve({ data: null });
    }),
  };
}

// `BuyInDirectContent` follows the same `{ mode, index, apiClient }` + `useFieldArray`
// convention every other content-type editor in this folder uses (see `ProductContentComp`)
// -- it is NOT a controlled `value`/`onChange` leaf -- so the harness wires it into a real
// `react-hook-form` instance, exactly like `MediaContent.test.tsx` does for its sibling.
function Wrapper({
  initialPicks = [],
  apiClient = makeApiClient(),
}: {
  initialPicks?: { productId: string }[];
  apiClient?: AutomationBuilderApiClient;
}) {
  const form = useForm({
    defaultValues: {
      contents: [
        { type: AutomationContentTypesEnum.BUY_IN_DIRECT, buyInDirectProducts: initialPicks },
      ],
    },
  });
  return (
    <FormProvider {...form}>
      <BuyInDirectContent
        index={0}
        mode={AutomationContentModeEnum.AUTOMATION}
        apiClient={apiClient}
      />
    </FormProvider>
  );
}

/** The picker is a modal now: every add/replace interaction goes through it. */
async function openPicker(trigger: HTMLElement) {
  fireEvent.click(trigger);
  // The dialog fetches on open; wait for a real product card before acting on it.
  return await screen.findByRole('button', { name: 'کفش نایک' });
}

describe('BuyInDirectContent', () => {
  // Regression: the fetch used to omit `page`, and `ReadCommerceProductsDto` requires it
  // (no `@IsOptional()`, no default). The route answered 400 "page must be a number
  // conforming to the specified constraints", the component's `.catch` swallowed it, and
  // the picker rendered permanently empty with no error shown. Asserted as a literal
  // rather than against a constant so the constraint cannot drift silently.
  it('sends `page` on the catalog fetch, which the backend requires', async () => {
    const apiClient = makeApiClient();
    render(<Wrapper initialPicks={[]} apiClient={apiClient} />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/commerce/products?page=1&limit=100&status=active',
      );
    });
  });

  it('sends `page`, `limit` and `status` on the dialog fetch too', async () => {
    const apiClient = makeApiClient();
    render(<Wrapper initialPicks={[]} apiClient={apiClient} />);

    await openPicker(await screen.findByRole('button', { name: 'select' }));

    expect(apiClient.get).toHaveBeenCalledWith('/commerce/products?page=1&limit=50&status=active');
  });

  it('renders each picked product as a tile, in array order', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-b' }, { productId: 'p-a' }]} />);

    const tiles = await screen.findAllByTestId('picked-product');
    expect(tiles).toHaveLength(2);
    expect(tiles.map((tile) => tile.dataset.productid)).toEqual(['p-b', 'p-a']);
  });

  it('adds a product through the picker dialog', async () => {
    render(<Wrapper initialPicks={[]} />);

    expect(screen.queryAllByTestId('picked-product')).toHaveLength(0);
    fireEvent.click(await openPicker(await screen.findByRole('button', { name: 'select' })));

    const tiles = await screen.findAllByTestId('picked-product');
    expect(tiles).toHaveLength(1);
    expect(tiles[0].dataset.productid).toBe('p-a');
  });

  // The tile's hover action REPLACES in place rather than appending -- the reason the
  // dialog is driven by an `editingIndex` instead of always appending.
  it('replaces a product in place via the change action, keeping the tile count', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-a' }]} />);

    await screen.findAllByTestId('picked-product');
    fireEvent.click(screen.getByRole('button', { name: 'change' }));

    fireEvent.click(await screen.findByRole('button', { name: 'کوله پشتی' }));

    await waitFor(() => {
      const tiles = screen.getAllByTestId('picked-product');
      expect(tiles).toHaveLength(1);
      expect(tiles[0].dataset.productid).toBe('p-b');
    });
  });

  // While replacing tile N, tile N's OWN product must stay selectable -- it is the one
  // being swapped out. Only the other picks are greyed out.
  it('keeps the tile being replaced selectable while greying out the other picks', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-a' }, { productId: 'p-b' }]} />);

    const tiles = await screen.findAllByTestId('picked-product');
    fireEvent.click(within(tiles[0]).getByRole('button', { name: 'change' }));

    expect(await screen.findByRole('button', { name: 'کفش نایک' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'کوله پشتی' })).toBeDisabled();
  });

  it('removes a picked product', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-a' }]} />);

    await screen.findAllByTestId('picked-product');
    fireEvent.click(screen.getByRole('button', { name: 'remove' }));

    await waitFor(() => {
      expect(screen.queryAllByTestId('picked-product')).toHaveLength(0);
    });
  });

  it('cannot pick a product that is already picked', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-a' }]} />);

    await screen.findAllByTestId('picked-product');
    const card = await openPicker(screen.getByRole('button', { name: 'select' }));
    expect(card).toBeDisabled();
  });

  // Matches ProductContentComp exactly: the add tile disappears at the cap and the limit
  // message takes over. 10 is Instagram's carousel maximum.
  it('hides the add tile and shows the limit message at ten products', async () => {
    const tenPicks = Array.from({ length: 10 }, (_, i) => ({ productId: `p-${i}` }));
    render(<Wrapper initialPicks={tenPicks} />);

    expect(await screen.findAllByTestId('picked-product')).toHaveLength(10);
    expect(screen.queryByTestId('add-product-tile')).not.toBeInTheDocument();
    expect(screen.getByText('limit')).toBeInTheDocument();
  });

  it('shows the add tile and no limit message below the cap', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-a' }]} />);

    expect(await screen.findByTestId('add-product-tile')).toBeInTheDocument();
    expect(screen.queryByText('limit')).not.toBeInTheDocument();
  });

  // A product with no cover must not reach `next/image` with a null src -- it throws.
  it('renders a product with no cover image without crashing', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-b' }]} />);

    const tiles = await screen.findAllByTestId('picked-product');
    expect(tiles).toHaveLength(1);
    expect(within(tiles[0]).queryByRole('img')).not.toBeInTheDocument();
  });

  it('warns when the shop has no card-to-card configured, reusing the ProductListPage copy', async () => {
    render(<Wrapper initialPicks={[]} apiClient={makeApiClient(false)} />);

    // `tNoCard('title')` is `useTranslations('Commerce.List.NoCardToCard')`, echoed by the
    // same stub -- confirms the SAME namespace/keys ProductListPage.tsx already renders are
    // reused here, not a new hardcoded warning string.
    expect(await screen.findByText('title')).toBeInTheDocument();
  });

  it('does not warn when the shop has card-to-card configured', async () => {
    render(<Wrapper initialPicks={[]} apiClient={makeApiClient(true)} />);

    await screen.findByRole('button', { name: 'select' });
    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });

  // The drag handle is meaningless with one tile, so it only renders from two up.
  it('shows the drag handle only when more than one product is picked', async () => {
    const { unmount } = render(<Wrapper initialPicks={[{ productId: 'p-a' }]} />);
    await screen.findAllByTestId('picked-product');
    expect(screen.queryByRole('button', { name: 'reorder' })).not.toBeInTheDocument();
    unmount();

    render(<Wrapper initialPicks={[{ productId: 'p-a' }, { productId: 'p-b' }]} />);
    await screen.findAllByTestId('picked-product');
    expect(screen.getAllByRole('button', { name: 'reorder' })).toHaveLength(2);
  });

  it('reorders the picked tiles on drag end, persisting array order (which becomes `position` on submit)', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-a' }, { productId: 'p-b' }]} />);

    const tilesBefore = await screen.findAllByTestId('picked-product');
    expect(tilesBefore[0].dataset.productid).toBe('p-a');

    dragEndRef.current?.({
      active: { id: tilesBefore[1].dataset.xid },
      over: { id: tilesBefore[0].dataset.xid },
    });

    // The mocked DndContext doesn't actually re-render via a synthetic drag gesture the way
    // a real pointer sequence would; it only exposes the captured `onDragEnd` handler. If the
    // ids above don't resolve (e.g. `_xid` isn't exposed as a data attribute), this assertion
    // intentionally documents that gap rather than silently passing on an untested behavior.
    await waitFor(() => {
      const tilesAfter = screen.getAllByTestId('picked-product');
      expect(tilesAfter[0].dataset.productid).toBe('p-b');
    });
  });
});
