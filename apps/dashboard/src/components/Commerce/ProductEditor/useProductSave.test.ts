import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import type {
  CommerceCollectionListItem,
  CommerceProductDetail,
  CommerceProductMedia,
  CommerceVariantDetail,
} from '@/types/commerce';

// One shared log of every request the hook makes, in the order it made them. `vi.hoisted` because
// `vi.mock` factories run before the imports (same pattern as `ProductListPage.test.tsx`).
const { calls, apiMock, pushMock, toastMock, mutateMock, swrImmutableMock } = vi.hoisted(() => {
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
    // Mutable per-test: the hook calls `useSWRImmutable(COLLECTIONS_KEY)` once, for the
    // membership diff. Defaults to "nothing loaded"; the edit tests override it with a fixture.
    // Typed with a rest param (rather than zero args) so it can stand in directly for the
    // `swr/immutable` default export, which vitest calls with whatever key SWR was given.
    swrImmutableMock: vi.fn((..._args: unknown[]) => ({ data: undefined }) as { data: unknown }),
  };
});

vi.mock('@/hooks/swr/api-client', () => ({ default: apiMock, fetcher: vi.fn() }));
vi.mock('swr', () => ({ mutate: mutateMock }));
vi.mock('swr/immutable', () => ({ default: swrImmutableMock }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('sonner', () => ({ toast: toastMock }));

import { buildEmptyProductForm, type ProductFormValues } from './productEditor.schema';
import { buildMediaIdMap, pairVariantRows, useProductSave } from './useProductSave';

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

const collection = (
  over: Partial<CommerceCollectionListItem> = {},
): CommerceCollectionListItem => ({
  id: 'c-1',
  name: 'کالکشن',
  slug: 'col',
  productIds: [],
  productCount: 0,
  createDate: '2026-07-27T00:00:00.000Z',
  updateDate: '2026-07-27T00:00:00.000Z',
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
  swrImmutableMock.mockReturnValue({ data: undefined });

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

  it('uploads queued files sequentially, never letting a second start before the first resolves', async () => {
    // A regression to `Promise.all` would still pass a single-file fixture, so this queues two
    // and tracks concurrency directly rather than trusting call order alone.
    let inFlight = 0;
    let maxInFlight = 0;
    apiMock.post.mockImplementation(async (url: string) => {
      calls.push(`POST ${url}`);
      if (url === '/commerce/products') return { data: { data: { id: 'p-new' } } };
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return { data: {} };
    });

    const values = valuesWithPendingMedia();
    values.media.push({
      id: 'local-2',
      name: 'shoe-2.jpg',
      url: 'blob:local-2',
      type: 'image',
      isPending: true,
      file: new File(['y'], 'shoe-2.jpg', { type: 'image/jpeg' }),
    });

    const { result } = renderHook(() => useProductSave('create'));

    await act(async () => {
      await result.current.save(values);
    });

    expect(maxInFlight).toBe(1);
    expect(calls.filter((c) => c.includes('/media'))).toEqual([
      'POST /commerce/products/p-new/media',
      'POST /commerce/products/p-new/media',
    ]);
  });
});

describe('useProductSave (edit)', () => {
  const editDetail: CommerceProductDetail = {
    ...savedDetail,
    id: 'p-edit',
    // Three photos already on the product before this save started, plus the one this save
    // uploads (`m-4`), in server arrival order.
    media: [
      media({ id: 'm-1', position: 0 }),
      media({ id: 'm-2', position: 1 }),
      media({ id: 'm-3', position: 2 }),
      media({ id: 'm-4', position: 3 }),
    ],
    variants: [
      variant({
        id: 'v-1',
        optionValueIds: [],
        media: { selectedMediaIds: ['m-1'], coverMediaId: 'm-1' },
      }),
    ],
  };

  /** Existing pool of 3 real photos, plus one freshly queued file assigned to the variant. */
  const editValues = (): ProductFormValues => {
    const base = buildEmptyProductForm();
    return {
      ...base,
      title: 'کفش',
      collectionIds: ['c-1'],
      media: [
        {
          id: 'm-1',
          name: '1.jpg',
          url: 'https://cdn.test/1.jpg',
          type: 'image',
          isPending: false,
        },
        {
          id: 'm-2',
          name: '2.jpg',
          url: 'https://cdn.test/2.jpg',
          type: 'image',
          isPending: false,
        },
        {
          id: 'm-3',
          name: '3.jpg',
          url: 'https://cdn.test/3.jpg',
          type: 'image',
          isPending: false,
        },
        {
          id: 'local-4',
          name: 'new.jpg',
          url: 'blob:local-4',
          type: 'image',
          isPending: true,
          file: new File(['z'], 'new.jpg', { type: 'image/jpeg' }),
        },
      ],
      // Mixes an already-real id with the local tile id of this save's new upload — this is
      // exactly the shape that used to come back empty from `buildMediaIdMap`'s old count zip.
      variants: [{ ...base.variants[0], price: 1000, mediaIds: ['m-2', 'local-4'] }],
    };
  };

  beforeEach(() => {
    apiMock.get.mockImplementation(async (url: string) => {
      calls.push(`GET ${url}`);
      return { data: { data: editDetail } };
    });
    swrImmutableMock.mockReturnValue({
      data: {
        items: [
          collection({ id: 'c-1', productIds: [] }), // not yet a member; the form wants it in
          collection({ id: 'c-2', productIds: ['p-edit'] }), // currently a member; the form drops it
        ],
      },
    });
  });

  it('assigns the newly uploaded photo to the variant, not just to the gallery', async () => {
    const { result } = renderHook(() => useProductSave('edit', 'p-edit'));

    await act(async () => {
      await result.current.save(editValues());
    });

    // `m-2` was already real and passes through unchanged; `local-4` must resolve to `m-4` — the
    // one new row `buildMediaIdMap` produces once `m-1..m-3` are excluded as pre-existing.
    expect(apiMock.put).toHaveBeenCalledWith('/commerce/products/p-edit/variants/v-1/media', {
      mediaIds: ['m-2', 'm-4'],
      coverMediaId: 'm-2',
    });
  });

  it('PUTs the product, then syncs collection membership, then reloads and resets the form', async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useProductSave('edit', 'p-edit', { onSaved }));

    await act(async () => {
      await result.current.save(editValues());
    });

    expect(calls[0]).toBe('PUT /commerce/products/p-edit');

    // c-1 gains the product (form wants it, collection doesn't have it yet); c-2 loses it
    // (collection has it, form no longer lists it). Full-replace semantics: each PUT carries the
    // collection's whole desired `productIds`, not a delta.
    expect(apiMock.put).toHaveBeenCalledWith('/commerce/collections/c-1', {
      productIds: ['p-edit'],
    });
    expect(apiMock.put).toHaveBeenCalledWith('/commerce/collections/c-2', { productIds: [] });
    expect(mutateMock).toHaveBeenCalledWith('/commerce/collections');

    expect(toastMock.success).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();
    // The freshly fetched detail is handed back so the page can `form.reset(...)` from it — a
    // second Save must not try to re-create rows that already exist.
    expect(onSaved).toHaveBeenCalledWith(editDetail);
  });
});

describe('useProductSave error toasts', () => {
  const axiosError = (code: string) => ({
    isAxiosError: true,
    response: { data: { code } },
  });

  it('gives COMMERCE_KIND_LOCKED its own sentence rather than the generic ERROR_CODES lookup', async () => {
    apiMock.post.mockImplementation(async (url: string) => {
      if (url === '/commerce/products') throw axiosError('COMMERCE_KIND_LOCKED');
      return { data: {} };
    });

    const { result } = renderHook(() => useProductSave('create'));
    await act(async () => {
      await result.current.save(valuesWithPendingMedia());
    });

    expect(toastMock.error).toHaveBeenCalledWith('Errors.kindLocked');
  });

  it('routes any other backend error code through t_ec from ERROR_CODES', async () => {
    apiMock.post.mockImplementation(async (url: string) => {
      if (url === '/commerce/products') throw axiosError('COMMERCE_INVALID_SELECTION');
      return { data: {} };
    });

    const { result } = renderHook(() => useProductSave('create'));
    await act(async () => {
      await result.current.save(valuesWithPendingMedia());
    });

    // The mocked translator is the identity function, so the raw code proves `t_ec(code)` ran —
    // not the hook's own generic string.
    expect(toastMock.error).toHaveBeenCalledWith('COMMERCE_INVALID_SELECTION');
  });

  it('falls back to the generic message when the failure carries no error code', async () => {
    apiMock.post.mockImplementation(async (url: string) => {
      if (url === '/commerce/products') throw new Error('network down');
      return { data: {} };
    });

    const { result } = renderHook(() => useProductSave('create'));
    await act(async () => {
      await result.current.save(valuesWithPendingMedia());
    });

    expect(toastMock.error).toHaveBeenCalledWith('Errors.generic');
  });
});

describe('pairVariantRows', () => {
  it('matches multiple rows by the SET of option-value ids, independent of array order', () => {
    const rows: ProductFormValues['variants'] = [
      { ...buildEmptyProductForm().variants[0], valueIds: ['red', 'small'] },
      { ...buildEmptyProductForm().variants[0], valueIds: ['blue', 'large'] },
    ];
    const saved = [
      variant({ id: 'v-blue-large', position: 0, optionValueIds: ['large', 'blue'] }),
      variant({ id: 'v-red-small', position: 1, optionValueIds: ['small', 'red'] }),
    ];

    const pairs = pairVariantRows(rows, saved);

    expect(pairs).toHaveLength(2);
    expect(pairs.find((p) => p.row.valueIds.includes('red'))?.variant.id).toBe('v-red-small');
    expect(pairs.find((p) => p.row.valueIds.includes('blue'))?.variant.id).toBe('v-blue-large');
  });

  it('matches existing rows by id-set and falls back positionally for the rest (mixed old/new)', () => {
    const rows: ProductFormValues['variants'] = [
      { ...buildEmptyProductForm().variants[0], id: 'v-old', valueIds: ['red'] }, // already existed
      { ...buildEmptyProductForm().variants[0], valueIds: ['local-blue'] }, // new this session
    ];
    const saved = [
      variant({ id: 'v-old', position: 0, optionValueIds: ['red'] }),
      variant({ id: 'v-new', position: 1, optionValueIds: ['blue'] }), // real id minted just now
    ];

    const pairs = pairVariantRows(rows, saved);

    expect(pairs).toHaveLength(2);
    // The old row's set matches directly.
    expect(pairs.find((p) => p.row.id === 'v-old')?.variant.id).toBe('v-old');
    // The new row has no set match at all (its ids are local, the server has never seen them) —
    // it lands on the one leftover variant purely by position.
    expect(pairs.find((p) => p.row.valueIds[0] === 'local-blue')?.variant.id).toBe('v-new');
  });

  it('bails out of the positional fallback when the leftovers do not line up 1:1', () => {
    // Three rows submitted, but the payload builder dropped one whose selection no longer
    // resolves (see `buildVariantsPayload`), so only two variants exist server-side.
    const rows: ProductFormValues['variants'] = [
      { ...buildEmptyProductForm().variants[0], valueIds: ['local-a'] },
      { ...buildEmptyProductForm().variants[0], valueIds: ['local-b'] },
      { ...buildEmptyProductForm().variants[0], valueIds: ['local-c'] },
    ];
    const saved = [
      variant({ id: 'v-x', position: 0, optionValueIds: ['x'] }),
      variant({ id: 'v-y', position: 1, optionValueIds: ['y'] }),
    ];

    const pairs = pairVariantRows(rows, saved);

    // Nothing is guessed: assigning one variant's media to the wrong row is worse than assigning
    // none at all.
    expect(pairs).toHaveLength(0);
  });
});

describe('buildMediaIdMap', () => {
  it('resolves a create where the whole saved pool is new (count zip degenerates correctly)', () => {
    const map = buildMediaIdMap(['local-1'], [media({ id: 'm-1', position: 0 })], new Set());
    expect(map.get('local-1')).toBe('m-1');
  });

  it('resolves an edit where the pool already had photos before this save (the fixed bug)', () => {
    const saved = [
      media({ id: 'm-1', position: 0 }),
      media({ id: 'm-2', position: 1 }),
      media({ id: 'm-3', position: 2 }),
      media({ id: 'm-4', position: 3 }), // the only row this save created
    ];
    const preExisting = new Set(['m-1', 'm-2', 'm-3']);

    const map = buildMediaIdMap(['local-4'], saved, preExisting);

    expect(map.get('local-4')).toBe('m-4');
    expect(map.size).toBe(1);
  });

  it('stays empty when the new-row count disagrees with the upload count, instead of guessing', () => {
    // Only one row is actually new, but two local ids claim to have been uploaded — a state that
    // should never happen, but the guard must still refuse to zip rather than mis-pair.
    const saved = [media({ id: 'm-1', position: 0 }), media({ id: 'm-2', position: 1 })];
    const map = buildMediaIdMap(['local-a', 'local-b'], saved, new Set(['m-1']));
    expect(map.size).toBe(0);
  });
});
