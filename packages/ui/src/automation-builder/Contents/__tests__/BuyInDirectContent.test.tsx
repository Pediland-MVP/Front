import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  { id: 'p-a', title: 'کفش نایک', coverMediaUrl: 'https://cdn/a.jpg' },
  { id: 'p-b', title: 'کوله پشتی', coverMediaUrl: null },
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

  it('lists the products the merchant has already picked, in order', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-b' }, { productId: 'p-a' }]} />);

    const rows = await screen.findAllByTestId('picked-product');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('کوله پشتی');
    expect(rows[1].textContent).toContain('کفش نایک');
  });

  it('adds a product when it is picked', async () => {
    render(<Wrapper initialPicks={[]} />);

    const pickButton = await screen.findByRole('button', { name: /کفش نایک/ });
    fireEvent.click(pickButton);

    const rows = await screen.findAllByTestId('picked-product');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('کفش نایک');
  });

  it('removes a picked product', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-a' }]} />);

    await screen.findAllByTestId('picked-product');
    const removeButton = screen.getByRole('button', { name: 'remove' });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryAllByTestId('picked-product')).toHaveLength(0);
    });
  });

  it('cannot pick the same product twice', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-a' }]} />);

    const pickButton = await screen.findByRole('button', { name: /کفش نایک/ });
    expect(pickButton).toBeDisabled();
  });

  it('shows the empty-state hint when nothing is picked', async () => {
    render(<Wrapper initialPicks={[]} />);

    // Stubbed `useTranslations` echoes the key -- `t('emptyHint')` resolves to
    // 'حداقل یک محصول انتخاب کن' in the real `fa.json` (Automations.Contents.BuyInDirect).
    expect(await screen.findByText('emptyHint')).toBeInTheDocument();
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

    await screen.findAllByRole('button', { name: /کفش نایک|کوله پشتی/ });
    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });

  it('reorders the picked list on drag end, persisting array order (which becomes `position` on submit)', async () => {
    render(<Wrapper initialPicks={[{ productId: 'p-a' }, { productId: 'p-b' }]} />);

    const rowsBefore = await screen.findAllByTestId('picked-product');
    expect(rowsBefore[0].textContent).toContain('کفش نایک');

    dragEndRef.current?.({
      active: { id: rowsBefore[1].dataset.xid },
      over: { id: rowsBefore[0].dataset.xid },
    });

    // The mocked DndContext doesn't actually re-render via a synthetic drag gesture the way
    // a real pointer sequence would; it only exposes the captured `onDragEnd` handler. If the
    // ids above don't resolve (e.g. `_xid` isn't exposed as a data attribute), this assertion
    // intentionally documents that gap rather than silently passing on an untested behavior.
    await waitFor(() => {
      const rowsAfter = screen.getAllByTestId('picked-product');
      expect(rowsAfter[0].textContent).toContain('کوله پشتی');
    });
  });
});
