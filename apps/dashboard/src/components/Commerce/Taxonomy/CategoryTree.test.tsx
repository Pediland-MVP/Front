import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { CommerceCategory, PaginatedResult } from '@/types/commerce';

// `CategoryTree` fetches `/commerce/categories` through `useSWRImmutable` — control its
// return value per test, same convention `CollectionsSection.test.tsx` uses for its own
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

const { put, del } = vi.hoisted(() => ({
  put: vi.fn().mockResolvedValue({ data: {} }),
  del: vi.fn().mockResolvedValue({ data: {} }),
}));
vi.mock('@/hooks/swr/api-client', () => ({ default: { put, delete: del } }));

// jsdom has no real pointer/drag support — same limitation `MediaSection.test.tsx` documents.
// Capture the `onDragEnd` handler `CategoryTree` passes to the real `DndContext` and invoke it
// directly with a synthetic drag event. Everything else from `@dnd-kit/core` stays real, so
// `useSortable` inside each node still renders without crashing.
let capturedOnDragEnd: ((event: unknown) => void | Promise<void>) | undefined;
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual<typeof import('@dnd-kit/core')>('@dnd-kit/core');
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd: (event: unknown) => void | Promise<void>;
    }) => {
      capturedOnDragEnd = onDragEnd;
      return children;
    },
  };
});

import messages from '@/messages/fa.json';
import { CategoryTree } from './CategoryTree';

function renderTree() {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <CategoryTree isCreateDialogOpen={false} onCreateDialogOpenChange={vi.fn()} />
    </NextIntlClientProvider>,
  );
}

const categoriesPage = (items: CommerceCategory[]): PaginatedResult<CommerceCategory[]> => ({
  items,
  meta: {
    currentPage: 1,
    itemCount: items.length,
    itemsPerPage: items.length,
    totalItems: items.length,
    totalPages: 1,
  },
});

// Two root-level categories, one of which has a child, which itself has a grandchild — three
// nesting levels, not just one.
const ROOT: CommerceCategory = {
  id: 'cat-1',
  workspaceId: 'ws-1',
  name: 'Root',
  slug: 'root',
  parentId: null,
  position: 0,
};
const SIBLING: CommerceCategory = {
  id: 'cat-4',
  workspaceId: 'ws-1',
  name: 'Sibling',
  slug: 'sibling',
  parentId: null,
  position: 1,
};
const CHILD: CommerceCategory = {
  id: 'cat-2',
  workspaceId: 'ws-1',
  name: 'Child',
  slug: 'child',
  parentId: 'cat-1',
  position: 0,
};
const GRANDCHILD: CommerceCategory = {
  id: 'cat-3',
  workspaceId: 'ws-1',
  name: 'Grandchild',
  slug: 'grandchild',
  parentId: 'cat-2',
  position: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSWRImmutable.mockReturnValue({ data: undefined, error: undefined, isLoading: false });
  mutateMock.mockResolvedValue(undefined);
  put.mockResolvedValue({ data: {} });
  del.mockResolvedValue({ data: {} });
  capturedOnDragEnd = undefined;
});

describe('CategoryTree', () => {
  it('builds the tree from the flat list and renders every nesting level (root > child > grandchild)', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: categoriesPage([GRANDCHILD, ROOT, CHILD, SIBLING]),
      error: undefined,
      isLoading: false,
    });
    renderTree();

    expect(mockUseSWRImmutable).toHaveBeenCalledWith('/commerce/categories');
    expect(screen.getByTestId('category-node-cat-1')).toBeInTheDocument();
    expect(screen.getByTestId('category-node-cat-2')).toBeInTheDocument();
    expect(screen.getByTestId('category-node-cat-3')).toBeInTheDocument();
    expect(screen.getByTestId('category-node-cat-4')).toBeInTheDocument();

    // The grandchild only renders because it's nested under the child, which is nested under
    // the root — not because it happens to also appear in the flat list.
    const root = screen.getByTestId('category-node-cat-1');
    const grandchild = screen.getByTestId('category-node-cat-3');
    expect(
      root.compareDocumentPosition(grandchild) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows the empty state when there are no categories', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: categoriesPage([]),
      error: undefined,
      isLoading: false,
    });
    renderTree();

    expect(screen.getByText(messages.Commerce.Taxonomy.Category.empty)).toBeInTheDocument();
  });

  it('on drag end between two root siblings, PUTs both affected nodes with the new parentId/position, then revalidates', async () => {
    mockUseSWRImmutable.mockReturnValue({
      data: categoriesPage([ROOT, SIBLING]),
      error: undefined,
      isLoading: false,
    });
    renderTree();

    expect(capturedOnDragEnd).toBeDefined();

    // Drag the second root (SIBLING, position 1) onto the first root (ROOT, position 0).
    await capturedOnDragEnd!({
      active: { id: 'cat-4' },
      over: { id: 'cat-1' },
    });

    // Optimistic write straight into the shared SWR cache, `revalidate: false` so it doesn't
    // race the PUTs below — same convention as `MediaSection#handleDragEnd`.
    expect(mutateMock).toHaveBeenCalledWith('/commerce/categories', expect.any(Function), {
      revalidate: false,
    });

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/categories/cat-4', {
        parentId: null,
        position: 0,
      }),
    );
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/categories/cat-1', {
        parentId: null,
        position: 1,
      }),
    );

    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/categories'));
  });

  it('does nothing when a drag ends over the same node (no-op drop)', async () => {
    mockUseSWRImmutable.mockReturnValue({
      data: categoriesPage([ROOT, SIBLING]),
      error: undefined,
      isLoading: false,
    });
    renderTree();

    await capturedOnDragEnd!({
      active: { id: 'cat-1' },
      over: { id: 'cat-1' },
    });

    expect(put).not.toHaveBeenCalled();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('dragging a node onto a node under a DIFFERENT parent is a no-op (re-parenting is a dialog-only action)', async () => {
    mockUseSWRImmutable.mockReturnValue({
      data: categoriesPage([ROOT, SIBLING, CHILD]),
      error: undefined,
      isLoading: false,
    });
    renderTree();

    // CHILD's parent is cat-1 (ROOT); SIBLING's parent is null — different parents.
    await capturedOnDragEnd!({
      active: { id: 'cat-2' },
      over: { id: 'cat-4' },
    });

    expect(put).not.toHaveBeenCalled();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('deletes a category via DELETE, then revalidates the categories SWR key', async () => {
    mockUseSWRImmutable.mockReturnValue({
      data: categoriesPage([ROOT]),
      error: undefined,
      isLoading: false,
    });
    renderTree();

    fireEvent.click(
      screen.getByRole('button', { name: messages.Commerce.Taxonomy.Category.delete }),
    );
    fireEvent.click(screen.getByText(messages.DeleteConfirmationDialog.delete));

    await waitFor(() => expect(del).toHaveBeenCalledWith('/commerce/categories/cat-1'));
    expect(toastSuccess).toHaveBeenCalled();
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/categories'));
  });

  it('surfaces COMMERCE_CATEGORY_IN_USE via t_ec when a delete is blocked server-side', async () => {
    del.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { code: 'COMMERCE_CATEGORY_IN_USE' } },
    });
    mockUseSWRImmutable.mockReturnValue({
      data: categoriesPage([ROOT]),
      error: undefined,
      isLoading: false,
    });
    renderTree();

    fireEvent.click(
      screen.getByRole('button', { name: messages.Commerce.Taxonomy.Category.delete }),
    );
    fireEvent.click(screen.getByText(messages.DeleteConfirmationDialog.delete));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(messages.ERROR_CODES.COMMERCE_CATEGORY_IN_USE),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
