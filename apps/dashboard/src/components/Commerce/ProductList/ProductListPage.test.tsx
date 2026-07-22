import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

import messages from '@/messages/fa.json';
import { ProductListPage } from './ProductListPage';

function renderPage() {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ProductListPage />
    </NextIntlClientProvider>,
  );
}

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

  it('does not render the edit/delete footer buttons when the viewer lacks both permissions', () => {
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

    expect(screen.queryByText(messages.Commerce.List.Card.edit)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.Commerce.List.Card.delete)).not.toBeInTheDocument();
  });

  it('renders only the edit button when the viewer can edit but not delete', () => {
    mockCan.mockImplementation((slug: string) => slug === 'product:edit');
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

    expect(screen.getByText(messages.Commerce.List.Card.edit)).toBeInTheDocument();
    expect(screen.queryByText(messages.Commerce.List.Card.delete)).not.toBeInTheDocument();
  });

  it('renders both edit and delete buttons when the viewer has both permissions', () => {
    mockCan.mockImplementation(
      (slug: string) => slug === 'product:edit' || slug === 'product:delete',
    );
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

    expect(screen.getByText(messages.Commerce.List.Card.edit)).toBeInTheDocument();
    expect(screen.getByText(messages.Commerce.List.Card.delete)).toBeInTheDocument();
  });
});
