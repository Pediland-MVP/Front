import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { CommerceCategory } from '@/types/commerce';

// Same convention `VariantMediaPickerDialog.test.tsx`/`AdjustStockDialog.test.tsx` use: mock
// the global `mutate` so tests can assert on the post-save revalidation call.
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
import { CategoryDialog } from './CategoryDialog';

const ROOT: CommerceCategory = {
  id: 'cat-1',
  workspaceId: 'ws-1',
  name: 'Root',
  slug: 'root',
  parentId: null,
  position: 0,
};

function renderDialog(category?: CommerceCategory, categories: CommerceCategory[] = [ROOT]) {
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <CategoryDialog
        open
        onOpenChange={onOpenChange}
        categories={categories}
        category={category}
      />
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

describe('CategoryDialog', () => {
  it('POSTs a new category with the typed name and selected parent, then revalidates', async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText(messages.Commerce.Taxonomy.CategoryDialog.name), {
      target: { value: 'New Category' },
    });
    fireEvent.click(screen.getByText(messages.Commerce.Taxonomy.CategoryDialog.submit));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/commerce/categories', {
        name: 'New Category',
        parentId: null,
      }),
    );
    expect(toastSuccess).toHaveBeenCalled();
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/categories'));
  });

  it('PUTs the existing category on edit, seeded from its current name/parent', async () => {
    renderDialog(ROOT, [ROOT]);

    fireEvent.click(screen.getByText(messages.Commerce.Taxonomy.CategoryDialog.submit));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/categories/cat-1', {
        name: 'Root',
        parentId: null,
      }),
    );
  });

  it('disables submit and shows a validation message when the name is blank', () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText(messages.Commerce.Taxonomy.CategoryDialog.name), {
      target: { value: '' },
    });

    expect(
      screen.getByText(messages.Commerce.Taxonomy.CategoryDialog.nameRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.Commerce.Taxonomy.CategoryDialog.submit).closest('button'),
    ).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
  });
});

describe('CategoryDialog permission gating', () => {
  // Regression for the whole-branch review finding: this dialog handles BOTH create and
  // update through the same `handleSubmit`, and both real backend routes
  // (`categories.controller.ts`) require `product:edit` — never `product:create`. One gate
  // covers both paths.
  it('disables submit and never POSTs/PUTs when the viewer lacks product:edit', () => {
    mockCan.mockReturnValue(false);
    renderDialog();

    const submitButton = screen
      .getByText(messages.Commerce.Taxonomy.CategoryDialog.submit)
      .closest('button')!;
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });
});
