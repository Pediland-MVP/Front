import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { CommerceProductListItem } from '@/types/commerce';

// `ProductListPage` fetches through `useSWRImmutable` — control its return value per test
// instead of hitting a real endpoint. `vi.mock` factories are hoisted above imports, so the
// mutable handle must come from `vi.hoisted` (mirrors `AutomationForm.test.tsx`'s pattern).
const { mockUseSWRImmutable } = vi.hoisted(() => ({ mockUseSWRImmutable: vi.fn() }));
vi.mock('swr/immutable', () => ({
  default: (...args: unknown[]) => mockUseSWRImmutable(...args),
}));

// `can` defaults to false for every slug; individual tests override it via
// `mockCan.mockImplementation(...)` to exercise permission-gated UI (edit/delete buttons).
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(false) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// The header button never enters this component's tree — `ProductListPage` hands it to the
// `useHeaderFeatures` store and the console header renders it. Capture whatever node the store
// was given so the test can render it directly; asserting on the permission probe (what the old
// regression test did) cannot tell a rendered button from a dead code path.
const { header } = vi.hoisted(() => ({ header: { buttons: null as React.ReactNode } }));
vi.mock('@/lib/stores/useHeaderFeaturesStore', () => ({
  useHeaderFeatures: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      setButtons: (node: React.ReactNode) => {
        header.buttons = node;
      },
      clearButtons: () => {},
      setTools: () => {},
      clearTools: () => {},
      setError: () => {},
      error: false,
    }),
}));

import messages from '@/messages/fa.json';
import { ProductListPage } from './ProductListPage';

function renderPage() {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ProductListPage />
    </NextIntlClientProvider>,
  );
}

/** Renders whatever `ProductListPage` pushed into the header slot. */
function renderHeaderButtons() {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      {header.buttons}
    </NextIntlClientProvider>,
  );
}

const listData = (item: CommerceProductListItem) => ({
  data: {
    items: [item],
    meta: { currentPage: 1, itemCount: 1, itemsPerPage: 21, totalItems: 1, totalPages: 1 },
  },
  error: undefined,
  isLoading: false,
});

const buildItem = (overrides: Partial<CommerceProductListItem> = {}): CommerceProductListItem => ({
  id: 'prod-1',
  title: 'کالای تست',
  slug: 'test-product',
  status: 'active',
  kind: 'physical',
  variantCount: 1,
  minPrice: 10000,
  maxPrice: 10000,
  needsStockReview: false,
  updateDate: '2026-07-01T00:00:00.000Z',
  coverMediaUrl: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  // `vi.clearAllMocks()` clears call history but not a mock's implementation, so
  // re-pin the default here — otherwise a `mockImplementation` set by one test
  // (e.g. the permission-gating tests below) would leak into the next test.
  mockCan.mockReset().mockReturnValue(false);
  header.buttons = null;
});

describe('ProductListPage', () => {
  it('renders the loader while products are loading', () => {
    mockUseSWRImmutable.mockReturnValue({ data: undefined, error: undefined, isLoading: true });

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the empty-state text when there are no products', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [],
        meta: { currentPage: 1, itemCount: 0, itemsPerPage: 21, totalItems: 0, totalPages: 1 },
      },
      error: undefined,
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText(messages.Commerce.List.no_products)).toBeInTheDocument();
  });

  it('renders the needsStockReview warning badge on a card that needs it', () => {
    const item = buildItem({ id: 'needs-review', needsStockReview: true });
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [item],
        meta: { currentPage: 1, itemCount: 1, itemsPerPage: 21, totalItems: 1, totalPages: 1 },
      },
      error: undefined,
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText(messages.Commerce.List.Card.needsStockReview)).toBeInTheDocument();
  });

  it('renders the "از ... تومان" range copy when minPrice !== maxPrice', () => {
    const item = buildItem({ id: 'ranged', minPrice: 5000, maxPrice: 9000 });
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [item],
        meta: { currentPage: 1, itemCount: 1, itemsPerPage: 21, totalItems: 1, totalPages: 1 },
      },
      error: undefined,
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText('از 5,000 تومان')).toBeInTheDocument();
  });

  it('renders a single price when minPrice === maxPrice', () => {
    const item = buildItem({ id: 'single', minPrice: 12000, maxPrice: 12000 });
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [item],
        meta: { currentPage: 1, itemCount: 1, itemsPerPage: 21, totalItems: 1, totalPages: 1 },
      },
      error: undefined,
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText('12,000 تومان')).toBeInTheDocument();
    expect(screen.queryByText(/^از /)).not.toBeInTheDocument();
  });

  it('renders the "no variant yet" fallback instead of an empty gap when minPrice/maxPrice are null', () => {
    const item = buildItem({ id: 'no-price', minPrice: null, maxPrice: null });
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [item],
        meta: { currentPage: 1, itemCount: 1, itemsPerPage: 21, totalItems: 1, totalPages: 1 },
      },
      error: undefined,
      isLoading: false,
    });

    expect(() => renderPage()).not.toThrow();

    expect(screen.getByText(messages.Commerce.List.Card.noVariant)).toBeInTheDocument();
  });

  it('does not render the delete footer button when the viewer lacks the permission', () => {
    mockCan.mockReturnValue(false);
    const item = buildItem();
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [item],
        meta: { currentPage: 1, itemCount: 1, itemsPerPage: 21, totalItems: 1, totalPages: 1 },
      },
      error: undefined,
      isLoading: false,
    });

    renderPage();

    expect(screen.queryByText(messages.Commerce.List.Card.delete)).not.toBeInTheDocument();
  });

  it('renders the delete button when the viewer has the permission', () => {
    mockCan.mockImplementation((slug: string) => slug === 'product:delete');
    const item = buildItem();
    mockUseSWRImmutable.mockReturnValue({
      data: {
        items: [item],
        meta: { currentPage: 1, itemCount: 1, itemsPerPage: 21, totalItems: 1, totalPages: 1 },
      },
      error: undefined,
      isLoading: false,
    });

    renderPage();

    expect(screen.getByText(messages.Commerce.List.Card.delete)).toBeInTheDocument();
  });

  it('offers the add button in the header when the viewer can create products', () => {
    mockCan.mockImplementation((slug: string) => slug === 'product:create');
    mockUseSWRImmutable.mockReturnValue(listData(buildItem()));

    renderPage();
    renderHeaderButtons();

    expect(screen.getByText(messages.Commerce.List.add)).toBeInTheDocument();
  });

  it('hides the add button when the viewer cannot create products', () => {
    mockCan.mockReturnValue(false);
    mockUseSWRImmutable.mockReturnValue(listData(buildItem()));

    renderPage();
    renderHeaderButtons();

    expect(screen.queryByText(messages.Commerce.List.add)).not.toBeInTheDocument();
  });

  it('renders the card edit button and routes to that product when the viewer can edit', () => {
    mockCan.mockImplementation((slug: string) => slug === 'product:edit');
    mockUseSWRImmutable.mockReturnValue(listData(buildItem({ id: 'prod-7' })));

    renderPage();

    const editButton = screen.getByText(messages.Commerce.List.Card.edit);
    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);
    expect(push).toHaveBeenCalledWith('/products/prod-7');
  });

  it('does not render the card edit button when the viewer lacks the permission', () => {
    mockCan.mockReturnValue(false);
    mockUseSWRImmutable.mockReturnValue(listData(buildItem()));

    renderPage();

    expect(screen.queryByText(messages.Commerce.List.Card.edit)).not.toBeInTheDocument();
  });
});
