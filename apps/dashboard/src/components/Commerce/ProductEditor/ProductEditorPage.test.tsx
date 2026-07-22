import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

// This test targets one specific regression: `shippingCost` used to be silently dropped from
// both `buildCreatePayload` and `buildUpdatePayload` in `ProductEditorPage.tsx`, so the
// Shipping section was a no-op even though it showed a success toast. It now must appear in
// both the `POST /commerce/products` and `PUT /commerce/products/:id` request bodies.

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true }),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// `ProductEditorPage` (edit-mode product fetch) and `BasicInfoSection` (categories fetch) both
// go through `swr/immutable` — key off the query key like `ProductListPage.test.tsx` does.
const { mockUseSWRImmutable } = vi.hoisted(() => ({ mockUseSWRImmutable: vi.fn() }));
vi.mock('swr/immutable', () => ({
  default: (...args: unknown[]) => mockUseSWRImmutable(...args),
}));

vi.mock('swr', () => ({ mutate: vi.fn() }));

// The component calls `api.post(url, payload)` / `api.put(url, payload)` (object methods, not
// a callable default export like `AutomationForm`'s `api({...})` usage) — mock the shape it
// actually calls.
const { post, put } = vi.hoisted(() => ({
  post: vi.fn().mockResolvedValue({ data: { data: { id: 'new-id' } } }),
  put: vi.fn().mockResolvedValue({ data: {} }),
}));
vi.mock('@/hooks/swr/api-client', () => ({
  default: { post, put },
}));

// Radix `Select`/`Tooltip` (used by BasicInfoSection) measure themselves via `ResizeObserver`,
// not implemented by jsdom — same stub the AutomationForm submit tests use.
beforeAll(() => {
  (global as unknown as { ResizeObserver: unknown }).ResizeObserver =
    (global as unknown as { ResizeObserver?: unknown }).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

beforeEach(() => {
  vi.clearAllMocks();
  post.mockResolvedValue({ data: { data: { id: 'new-id' } } });
  put.mockResolvedValue({ data: {} });

  // `ProductEditorPage` reads `matchMedia('(max-width: 900px)')` synchronously in a `useEffect`
  // to drive `isMobile` — stub it to the desktop (false) branch, same shape the
  // `AutomationForm` submit tests stub.
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  mockUseSWRImmutable.mockImplementation((key: string | null) => {
    if (key === '/commerce/categories') {
      return { data: { items: [] }, error: undefined, isLoading: false };
    }
    return { data: undefined, error: undefined, isLoading: false };
  });
});

import messages from '@/messages/fa.json';
import { ProductEditorPage } from './ProductEditorPage';

function renderPage(props: { mode: 'create' | 'edit'; productId?: string }) {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ProductEditorPage {...props} />
    </NextIntlClientProvider>,
  );
}

describe('ProductEditorPage shippingCost payload', () => {
  it('includes shippingCost in the create payload sent to POST /commerce/products', async () => {
    renderPage({ mode: 'create' });

    fireEvent.change(screen.getByLabelText(messages.Commerce.Editor.Basic.title), {
      target: { value: 'محصول تست' },
    });
    fireEvent.change(screen.getByLabelText(messages.Commerce.Editor.Shipping.shippingCost), {
      target: { value: '15000' },
    });

    fireEvent.click(screen.getByText(messages.Commerce.Editor.SaveBar.save));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      '/commerce/products',
      expect.objectContaining({ shippingCost: 15000 }),
    );
  });

  it('includes shippingCost in the update payload sent to PUT /commerce/products/:id', async () => {
    mockUseSWRImmutable.mockImplementation((key: string | null) => {
      if (key === '/commerce/categories') {
        return { data: { items: [] }, error: undefined, isLoading: false };
      }
      if (key === '/commerce/products/prod-1') {
        return {
          data: {
            data: {
              id: 'prod-1',
              title: 'محصول موجود',
              description: '',
              status: 'draft',
              kind: 'physical',
              categoryId: null,
              shippingCost: 5000,
              options: [],
              variants: [
                {
                  id: 'var-1',
                  optionValueIds: [],
                  price: 1000,
                  isActive: true,
                  trackInventory: false,
                  allowBackorder: false,
                },
              ],
            },
          },
          error: undefined,
          isLoading: false,
        };
      }
      return { data: undefined, error: undefined, isLoading: false };
    });

    renderPage({ mode: 'edit', productId: 'prod-1' });

    await waitFor(() => expect(screen.getByDisplayValue('محصول موجود')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(messages.Commerce.Editor.Shipping.shippingCost), {
      target: { value: '20000' },
    });

    fireEvent.click(screen.getByText(messages.Commerce.Editor.SaveBar.save));

    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put).toHaveBeenCalledWith(
      '/commerce/products/prod-1',
      expect.objectContaining({ shippingCost: 20000 }),
    );
  });
});
