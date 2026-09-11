import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { CommerceCollectionListItem } from '@/types/commerce';

// Same convention `CategoryDialog.test.tsx` uses: mock the global `mutate` so tests can
// assert on the post-save revalidation call.
const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock('swr', () => ({ mutate: mutateMock }));

const { post, put } = vi.hoisted(() => ({
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
}));
vi.mock('@/hooks/swr/api-client', () => ({ default: { post, put } }));

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

// `can` defaults to true (the basic create/update behavior tests below assume full edit
// permission) — the dedicated permission-gating suite overrides it to false, same mocking
// convention `ProductListPage.test.tsx` uses for `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

import messages from '@/messages/fa.json';
import { CollectionDialog } from './CollectionDialog';

const SUMMER: CommerceCollectionListItem = {
  id: 'col-1',
  name: 'Summer',
  slug: 'summer',
  productIds: [],
  createDate: '2026-07-01T00:00:00.000Z',
  updateDate: '2026-07-01T00:00:00.000Z',
};

function renderDialog(collection?: CommerceCollectionListItem) {
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <CollectionDialog open onOpenChange={onOpenChange} collection={collection} />
    </NextIntlClientProvider>,
  );
  return { onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  mutateMock.mockResolvedValue(undefined);
  post.mockResolvedValue({ data: {} });
  put.mockResolvedValue({ data: {} });
  mockCan.mockReset().mockReturnValue(true);
});

describe('CollectionDialog', () => {
  it('POSTs a new collection with the typed name, then revalidates', async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText(messages.Commerce.Taxonomy.CollectionDialog.name), {
      target: { value: 'Winter' },
    });
    fireEvent.click(screen.getByText(messages.Commerce.Taxonomy.CollectionDialog.submit));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/commerce/collections', { name: 'Winter' }),
    );
    expect(toastSuccess).toHaveBeenCalled();
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/collections'));
  });

  it('PUTs the existing collection on edit, name-only (never touches productIds)', async () => {
    renderDialog(SUMMER);

    fireEvent.click(screen.getByText(messages.Commerce.Taxonomy.CollectionDialog.submit));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/collections/col-1', { name: 'Summer' }),
    );
  });

  it('disables submit and shows a validation message when the name is blank', () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText(messages.Commerce.Taxonomy.CollectionDialog.name), {
      target: { value: '' },
    });

    expect(
      screen.getByText(messages.Commerce.Taxonomy.CollectionDialog.nameRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.Commerce.Taxonomy.CollectionDialog.submit).closest('button'),
    ).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
  });
});

describe('CollectionDialog permission gating', () => {
  // Regression for the whole-branch review finding: this dialog handles BOTH create and
  // update through the same `handleSubmit`, and both real backend routes
  // (`collections.controller.ts`) require `product:edit` — never `product:create`. One gate
  // covers both paths.
  it('disables submit and never POSTs/PUTs when the viewer lacks product:edit', () => {
    mockCan.mockReturnValue(false);
    renderDialog();

    const submitButton = screen
      .getByText(messages.Commerce.Taxonomy.CollectionDialog.submit)
      .closest('button')!;
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });
});
