import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { CommerceCollectionListItem, PaginatedResult } from '@/types/commerce';

// `CollectionsList` fetches `/commerce/collections` through `useSWRImmutable` — control its
// return value per test, same convention `CategoryTree.test.tsx` uses for its own
// `useSWRImmutable` call.
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

const { del } = vi.hoisted(() => ({ del: vi.fn().mockResolvedValue({ data: {} }) }));
vi.mock('@/hooks/swr/api-client', () => ({ default: { delete: del } }));

// `can` defaults to true (the basic rendering/delete test below assumes full edit
// permission) — the dedicated permission-gating suite overrides it to false, same mocking
// convention `ProductListPage.test.tsx` uses for `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

import messages from '@/messages/fa.json';
import { CollectionsList } from './CollectionsList';

function renderList() {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <CollectionsList isCreateDialogOpen={false} onCreateDialogOpenChange={vi.fn()} />
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
  createDate: '2026-07-01T00:00:00.000Z',
  updateDate: '2026-07-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSWRImmutable.mockReturnValue({ data: undefined, error: undefined, isLoading: false });
  mutateMock.mockResolvedValue(undefined);
  del.mockResolvedValue({ data: {} });
  mockCan.mockReset().mockReturnValue(true);
});

describe('CollectionsList', () => {
  it('deletes a collection via DELETE, then revalidates the collections SWR key', async () => {
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([SUMMER]),
      error: undefined,
      isLoading: false,
    });
    renderList();

    fireEvent.click(
      screen.getByRole('button', { name: messages.Commerce.Taxonomy.Collection.delete }),
    );
    fireEvent.click(screen.getByText(messages.DeleteConfirmationDialog.delete));

    await waitFor(() => expect(del).toHaveBeenCalledWith('/commerce/collections/col-1'));
    expect(toastSuccess).toHaveBeenCalled();
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/collections'));
  });
});

describe('CollectionsList permission gating', () => {
  // Regression for the whole-branch review finding: the edit/delete buttons here opened
  // `CollectionDialog`'s submit / this component's own DELETE with no permission check
  // anywhere in the chain. Verified against the real backend controller
  // (`collections.controller.ts`): update AND delete both require `product:edit`.
  it('hides the edit/delete buttons and never DELETEs when the viewer lacks product:edit', () => {
    mockCan.mockReturnValue(false);
    mockUseSWRImmutable.mockReturnValue({
      data: collectionsPage([SUMMER]),
      error: undefined,
      isLoading: false,
    });
    renderList();

    expect(
      screen.queryByRole('button', { name: messages.Commerce.Taxonomy.Collection.edit }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: messages.Commerce.Taxonomy.Collection.delete }),
    ).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });
});
