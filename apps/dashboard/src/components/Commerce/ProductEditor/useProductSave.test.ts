import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import type {
  CommerceProductDetail,
  CommerceProductMedia,
  CommerceVariantDetail,
} from '@/types/commerce';

// One shared log of every request the hook makes, in the order it made them. `vi.hoisted` because
// `vi.mock` factories run before the imports (same pattern as `ProductListPage.test.tsx`).
const { calls, apiMock, pushMock, toastMock, mutateMock } = vi.hoisted(() => {
  const calls: string[] = [];
  return {
    calls,
    apiMock: {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
    pushMock: vi.fn(),
    toastMock: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
    mutateMock: vi.fn(async () => undefined),
  };
});

vi.mock('@/hooks/swr/api-client', () => ({ default: apiMock, fetcher: vi.fn() }));
vi.mock('swr', () => ({ mutate: mutateMock }));
// The hook reads the collections list from the same SWR key the rail uses; nothing loaded here.
vi.mock('swr/immutable', () => ({ default: () => ({ data: undefined }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('sonner', () => ({ toast: toastMock }));

import { buildEmptyProductForm, type ProductFormValues } from './productEditor.schema';
import { useProductSave } from './useProductSave';

const media = (over: Partial<CommerceProductMedia> = {}): CommerceProductMedia => ({
  id: 'm-1',
  type: 'image',
  position: 0,
  alt: null,
  url: 'https://cdn.test/1.jpg',
  posterUrl: null,
  ...over,
});

const variant = (over: Partial<CommerceVariantDetail> = {}): CommerceVariantDetail => ({
  id: 'v-1',
  sku: null,
  price: 1000,
  compareAtPrice: null,
  salePrice: null,
  saleStartsAt: null,
  saleEndsAt: null,
  optionSignature: '',
  position: 0,
  isActive: true,
  trackInventory: true,
  allowBackorder: false,
  weight: null,
  onHand: 0,
  lowStockThreshold: null,
  optionValueIds: [],
  media: { selectedMediaIds: [], coverMediaId: null },
  ...over,
});

const savedDetail: CommerceProductDetail = {
  id: 'p-new',
  workspaceId: 'w1',
  title: 'کفش',
  description: '',
  slug: 'kafsh',
  status: 'active',
  kind: 'physical',
  categoryId: null,
  needsStockReview: false,
  shippingCost: 0,
  createDate: '2026-07-27T00:00:00.000Z',
  updateDate: '2026-07-27T00:00:00.000Z',
  options: [],
  variants: [variant()],
  media: [media()],
  tags: [],
  specs: [],
};

/** One product, one queued file, one variant that points at that file's LOCAL tile id. */
const valuesWithPendingMedia = (): ProductFormValues => {
  const base = buildEmptyProductForm();
  return {
    ...base,
    title: 'کفش',
    media: [
      {
        id: 'local-1',
        name: 'shoe.jpg',
        url: 'blob:local-1',
        type: 'image',
        isPending: true,
        file: new File(['x'], 'shoe.jpg', { type: 'image/jpeg' }),
      },
    ],
    variants: [{ ...base.variants[0], price: 1000, mediaIds: ['local-1'] }],
  };
};

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();

  apiMock.post.mockImplementation(async (url: string) => {
    calls.push(`POST ${url}`);
    if (url === '/commerce/products') return { data: { data: { id: 'p-new' } } };
    return { data: {} };
  });
  apiMock.get.mockImplementation(async (url: string) => {
    calls.push(`GET ${url}`);
    return { data: { data: savedDetail } };
  });
  apiMock.put.mockImplementation(async (url: string) => {
    calls.push(`PUT ${url}`);
    return { data: {} };
  });
});

describe('useProductSave (create)', () => {
  it('creates, then uploads, then re-reads, then assigns variant media — in that order', async () => {
    const { result } = renderHook(() => useProductSave('create'));

    await act(async () => {
      await result.current.save(valuesWithPendingMedia());
    });

    // The order IS the contract: the media endpoint needs a product id, the detail read is the
    // only place the new variant id exists, and the variant-media PUT needs both.
    expect(calls).toEqual([
      'POST /commerce/products',
      'POST /commerce/products/p-new/media',
      'GET /commerce/products/p-new',
      'PUT /commerce/products/p-new/variants/v-1/media',
    ]);

    // The local tile id never reaches the API — it is swapped for the real one the upload minted.
    expect(apiMock.put).toHaveBeenCalledWith('/commerce/products/p-new/variants/v-1/media', {
      mediaIds: ['m-1'],
      coverMediaId: 'm-1',
    });

    expect(toastMock.success).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/products/p-new');
  });

  it('reports a failed upload as a warning, not a success, and still navigates', async () => {
    apiMock.post.mockImplementation(async (url: string) => {
      calls.push(`POST ${url}`);
      if (url === '/commerce/products') return { data: { data: { id: 'p-new' } } };
      throw new Error('upload failed');
    });

    const { result } = renderHook(() => useProductSave('create'));

    await act(async () => {
      await result.current.save(valuesWithPendingMedia());
    });

    // The product is committed; only the file is missing. Saying "saved" would be a lie and
    // saying "failed" would be a worse one — the merchant would try to create it again.
    expect(toastMock.warning).toHaveBeenCalledTimes(1);
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/products/p-new');
  });

  it('leaves isSaving false once the sequence settles', async () => {
    const { result } = renderHook(() => useProductSave('create'));

    await act(async () => {
      await result.current.save(valuesWithPendingMedia());
    });

    expect(result.current.isSaving).toBe(false);
  });
});
