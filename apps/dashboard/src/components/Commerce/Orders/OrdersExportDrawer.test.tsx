import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { OrdersFilters } from '@/types/commerceOrders';

// Same convention `CollectionDialog.test.tsx` uses: mock the axios instance's `post` so tests
// can assert on the exact payload sent, and control success/failure per test.
const { post } = vi.hoisted(() => ({ post: vi.fn().mockResolvedValue({ data: {} }) }));
vi.mock('@/hooks/swr/api-client', () => ({ default: { post } }));

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

import messages from '@/messages/fa.json';
import { OrdersExportDrawer } from './OrdersExportDrawer';

const copy = messages.Commerce.Orders.export;

const FILTERS: OrdersFilters = {
  page: 3,
  limit: 20,
  status: 'processing',
  search: 'علی',
  from: '2026-08-01',
  to: '2026-08-31',
};

function renderDrawer(filters: OrdersFilters = FILTERS) {
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrdersExportDrawer open onOpenChange={onOpenChange} filters={filters} />
    </NextIntlClientProvider>,
  );
  return { onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  post.mockResolvedValue({ data: {} });
});

describe('OrdersExportDrawer', () => {
  it('submits the current filters (minus page/limit) with a valid email', async () => {
    const { onOpenChange } = renderDrawer();

    fireEvent.change(screen.getByLabelText(copy.emailLabel), {
      target: { value: 'seller@example.com' },
    });
    fireEvent.click(screen.getByText(copy.submit));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/commerce/orders/excelExport', {
        email: 'seller@example.com',
        status: 'processing',
        search: 'علی',
        from: '2026-08-01',
        to: '2026-08-31',
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith(copy.queued);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('omits absent filters instead of sending them as undefined', async () => {
    renderDrawer({ page: 1, limit: 20 });

    fireEvent.change(screen.getByLabelText(copy.emailLabel), {
      target: { value: 'seller@example.com' },
    });
    fireEvent.click(screen.getByText(copy.submit));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/commerce/orders/excelExport', {
        email: 'seller@example.com',
      }),
    );
  });

  it('blocks submit on an invalid email and never calls the API', () => {
    renderDrawer();

    fireEvent.change(screen.getByLabelText(copy.emailLabel), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByText(copy.submit));

    expect(screen.getByText(copy.emailInvalid)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('surfaces a failed request instead of reporting success', async () => {
    post.mockRejectedValueOnce({
      response: { data: { code: 'SOME_ERROR', message: 'boom' } },
    });
    const { onOpenChange } = renderDrawer();

    fireEvent.change(screen.getByLabelText(copy.emailLabel), {
      target: { value: 'seller@example.com' },
    });
    fireEvent.click(screen.getByText(copy.submit));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastSuccess).not.toHaveBeenCalled();
    // The drawer stays open on failure -- it must not report success by closing.
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
