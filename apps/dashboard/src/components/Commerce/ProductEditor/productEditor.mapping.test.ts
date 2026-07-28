import { describe, it, expect } from 'vitest';
import type {
  CommerceCategory,
  CommerceProductDetail,
  CommerceProductMedia,
  CommerceVariantDetail,
} from '@/types/commerce';
import type { EditorMedia, ProductFormValues } from './productEditor.schema';
import {
  buildCreatePayload,
  buildUpdatePayload,
  mapCategoriesToTree,
  mapDetailToFormValues,
  valueKeyOf,
} from './productEditor.mapping';

// ---------- fixtures ----------

const variantDetail = (over: Partial<CommerceVariantDetail> = {}): CommerceVariantDetail => ({
  id: 'v1',
  sku: null,
  price: 100,
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

const detail = (over: Partial<CommerceProductDetail> = {}): CommerceProductDetail => ({
  id: 'p1',
  workspaceId: 'w1',
  title: 'کفش',
  description: 'متن',
  slug: 'kafsh',
  status: 'active',
  kind: 'physical',
  categoryId: null,
  needsStockReview: false,
  shippingCost: 0,
  createDate: '2026-07-01T00:00:00.000Z',
  updateDate: '2026-07-01T00:00:00.000Z',
  options: [],
  variants: [],
  media: [],
  tags: [],
  specs: [],
  ...over,
});

// The API shape, used to build a CommerceProductDetail fixture.
const mediaItem = (over: Partial<CommerceProductMedia> = {}): CommerceProductMedia => ({
  id: 'm1',
  type: 'image',
  position: 0,
  alt: null,
  url: 'https://cdn.test/1.jpg',
  posterUrl: null,
  ...over,
});

// The FORM shape. Different on purpose — the pool carries a display name and a pending flag
// that the API knows nothing about, and is normalised by the page shell, not by this mapping.
const mediaTile = (over: Partial<EditorMedia> = {}): EditorMedia => ({
  id: 'm1',
  name: '1.jpg',
  url: 'https://cdn.test/1.jpg',
  type: 'image',
  isPending: false,
  ...over,
});

const formValues = (over: Partial<ProductFormValues> = {}): ProductFormValues => ({
  title: 'کفش',
  description: 'متن',
  categoryId: null,
  tags: [],
  specs: [],
  collectionIds: [],
  media: [],
  basePrice: null,
  baseCompare: null,
  baseStock: null,
  options: [],
  variants: [],
  ...over,
});

type FormVariant = ProductFormValues['variants'][number];

const formVariant = (over: Partial<FormVariant> = {}): FormVariant => ({
  valueIds: [],
  price: 100,
  compare: null,
  stock: 0,
  infinite: false,
  mediaIds: [],
  sku: null,
  weight: null,
  salePrice: null,
  saleStartsAt: null,
  saleEndsAt: null,
  allowBackorder: false,
  isActive: true,
  ...over,
});

/** رنگ: قرمز(c1) آبی(c2) — both already saved, so they carry server ids. */
const colourAxis = {
  id: 'o-color',
  localKey: 'o-color',
  name: 'رنگ',
  style: 'color' as const,
  values: [
    { id: 'c1', localKey: 'c1', value: 'قرمز', colorHex: '#ff0000' },
    { id: 'c2', localKey: 'c2', value: 'آبی', colorHex: '#0000ff' },
  ],
};

/** سایز: ۴۰(s1) ۴۱(s2) */
const sizeAxis = {
  id: 'o-size',
  localKey: 'o-size',
  name: 'سایز',
  style: 'button' as const,
  values: [
    { id: 's1', localKey: 's1', value: '۴۰' },
    { id: 's2', localKey: 's2', value: '۴۱' },
  ],
};

const category = (over: Partial<CommerceCategory> = {}): CommerceCategory => ({
  id: 'k1',
  workspaceId: 'w1',
  name: 'کفش',
  slug: 'kafsh',
  parentId: null,
  position: 0,
  ...over,
});

// ---------- mapDetailToFormValues ----------

describe('mapDetailToFormValues', () => {
  it('sorts options, values and variants by position, not by response order', () => {
    const values = mapDetailToFormValues(
      detail({
        options: [
          {
            id: 'o-size',
            name: 'سایز',
            style: 'button',
            position: 1,
            values: [
              { id: 's2', value: '۴۱', colorHex: null, position: 1 },
              { id: 's1', value: '۴۰', colorHex: null, position: 0 },
            ],
          },
          {
            id: 'o-color',
            name: 'رنگ',
            style: 'color',
            position: 0,
            values: [{ id: 'c1', value: 'قرمز', colorHex: '#ff0000', position: 0 }],
          },
        ],
        variants: [
          variantDetail({ id: 'vB', position: 1, optionValueIds: ['c1', 's2'] }),
          variantDetail({ id: 'vA', position: 0, optionValueIds: ['c1', 's1'] }),
        ],
      }),
    );

    expect(values.options.map((option) => option.name)).toEqual(['رنگ', 'سایز']);
    expect(values.options[1].values.map((value) => value.value)).toEqual(['۴۰', '۴۱']);
    expect(values.variants.map((variant) => variant.id)).toEqual(['vA', 'vB']);
  });

  it('puts a variant s value ids in axis order whatever order the API returned them', () => {
    const values = mapDetailToFormValues(
      detail({
        options: [
          {
            id: 'o-color',
            name: 'رنگ',
            style: 'color',
            position: 0,
            values: [{ id: 'c1', value: 'قرمز', colorHex: '#ff0000', position: 0 }],
          },
          {
            id: 'o-size',
            name: 'سایز',
            style: 'button',
            position: 1,
            values: [{ id: 's1', value: '۴۰', colorHex: null, position: 0 }],
          },
        ],
        // the join can return these in any order
        variants: [variantDetail({ optionValueIds: ['s1', 'c1'] })],
      }),
    );

    expect(values.variants[0].valueIds).toEqual(['c1', 's1']);
  });

  it('loads an untracked variant as infinite with no stock count', () => {
    const values = mapDetailToFormValues(
      detail({ variants: [variantDetail({ trackInventory: false, onHand: 7 })] }),
    );

    expect(values.variants[0].infinite).toBe(true);
    expect(values.variants[0].stock).toBeNull();
  });

  it('loads a tracked variant s onHand as its stock', () => {
    const values = mapDetailToFormValues(
      detail({ variants: [variantDetail({ trackInventory: true, onHand: 7 })] }),
    );

    expect(values.variants[0].infinite).toBe(false);
    expect(values.variants[0].stock).toBe(7);
  });

  it('loads the variant s selected media ids', () => {
    const values = mapDetailToFormValues(
      detail({
        variants: [
          variantDetail({ media: { selectedMediaIds: ['m2', 'm1'], coverMediaId: 'm2' } }),
        ],
      }),
    );

    expect(values.variants[0].mediaIds).toEqual(['m2', 'm1']);
  });

  it('falls back to an empty media list when the key is missing from the response', () => {
    const legacyVariant = variantDetail();
    delete (legacyVariant as Partial<CommerceVariantDetail>).media;

    const values = mapDetailToFormValues(detail({ variants: [legacyVariant] }));

    expect(values.variants[0].mediaIds).toEqual([]);
  });

  it('defaults tags and specs to empty lists, for a response from before they existed', () => {
    const legacy = detail();
    delete (legacy as Partial<CommerceProductDetail>).tags;
    delete (legacy as Partial<CommerceProductDetail>).specs;

    const values = mapDetailToFormValues(legacy);

    expect(values.tags).toEqual([]);
    expect(values.specs).toEqual([]);
  });

  it('leaves the base price and stock seeds null on load', () => {
    const values = mapDetailToFormValues(
      detail({ variants: [variantDetail({ price: 420000, onHand: 9 })] }),
    );

    expect(values.basePrice).toBeNull();
    expect(values.baseCompare).toBeNull();
    expect(values.baseStock).toBeNull();
  });

  it('keeps the variant fields this design draws no control for', () => {
    const values = mapDetailToFormValues(
      detail({
        variants: [
          variantDetail({
            sku: 'SKU-1',
            weight: 500,
            salePrice: 90,
            saleStartsAt: '2026-07-01T00:00:00.000Z',
            saleEndsAt: '2026-07-09T00:00:00.000Z',
            allowBackorder: true,
            isActive: false,
          }),
        ],
      }),
    );

    expect(values.variants[0]).toMatchObject({
      sku: 'SKU-1',
      weight: 500,
      salePrice: 90,
      saleStartsAt: '2026-07-01T00:00:00.000Z',
      saleEndsAt: '2026-07-09T00:00:00.000Z',
      allowBackorder: true,
      isActive: false,
    });
  });
});

// ---------- mapCategoriesToTree ----------

describe('mapCategoriesToTree', () => {
  it('nests children under their root, both levels sorted by position', () => {
    const tree = mapCategoriesToTree([
      category({ id: 'b', name: 'لباس', position: 1 }),
      category({ id: 'a', name: 'کفش', position: 0 }),
      category({ id: 'a2', name: 'رسمی', parentId: 'a', position: 1 }),
      category({ id: 'a1', name: 'ورزشی', parentId: 'a', position: 0 }),
    ]);

    expect(tree.map((node) => node.name)).toEqual(['کفش', 'لباس']);
    expect(tree[0].subs.map((sub) => sub.name)).toEqual(['ورزشی', 'رسمی']);
    expect(tree[1].subs).toEqual([]);
  });

  it('shows a category whose parent is not in the list as a root, not as nothing', () => {
    const tree = mapCategoriesToTree([category({ id: 'x', name: 'یتیم', parentId: 'gone' })]);

    expect(tree.map((node) => node.id)).toEqual(['x']);
  });

  it('does not draw a third level', () => {
    const tree = mapCategoriesToTree([
      category({ id: 'a', name: 'کفش' }),
      category({ id: 'a1', name: 'ورزشی', parentId: 'a' }),
      category({ id: 'a1x', name: 'دویدن', parentId: 'a1' }),
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0].subs.map((sub) => sub.id)).toEqual(['a1']);
  });
});

// ---------- valueKeyOf ----------

describe('valueKeyOf', () => {
  it('prefers the server id once the value has one', () => {
    expect(valueKeyOf({ id: 'c1', localKey: 'tmp-3' })).toBe('c1');
  });

  it('falls back to the local key for a value typed this session', () => {
    expect(valueKeyOf({ localKey: 'tmp-3' })).toBe('tmp-3');
  });
});

// ---------- buildCreatePayload ----------

describe('buildCreatePayload', () => {
  it('hardcodes status, kind and shipping cost, because the design has no control for them', () => {
    const payload = buildCreatePayload(formValues());

    expect(payload.status).toBe('active');
    expect(payload.kind).toBe('physical');
    expect(payload.shippingCost).toBe(0);
  });

  it('sends the chosen values as positions inside the options it just built', () => {
    const payload = buildCreatePayload(
      formValues({
        options: [colourAxis, sizeAxis],
        variants: [formVariant({ valueIds: ['c2', 's1'] })],
      }),
    );

    expect(payload.variants[0].valueIndexes).toEqual([1, 0]);
  });

  it('never sends a local key, and omits the id key entirely for a row created this session', () => {
    const payload = buildCreatePayload(
      formValues({
        options: [
          {
            localKey: 'tmp-o',
            name: 'رنگ',
            style: 'color',
            values: [{ localKey: 'tmp-v', value: 'قرمز', colorHex: '#f00' }],
          },
        ],
        variants: [formVariant({ valueIds: ['tmp-v'] })],
      }),
    );

    expect('id' in payload.options[0]).toBe(false);
    expect(Object.keys(payload.options[0].values[0]).sort()).toEqual(['colorHex', 'value']);
    expect('id' in payload.variants[0]).toBe(false);
    expect(JSON.stringify(payload)).not.toContain('localKey');
  });

  it('turns infinite into trackInventory false and sends no stock to set', () => {
    const payload = buildCreatePayload(
      formValues({
        options: [colourAxis],
        variants: [formVariant({ valueIds: ['c1'], infinite: true, stock: null })],
      }),
    );

    expect(payload.variants[0].trackInventory).toBe(false);
    expect('initialStock' in payload.variants[0]).toBe(false);
  });

  it('sends a tracked row s stock as initialStock', () => {
    const payload = buildCreatePayload(
      formValues({
        options: [colourAxis],
        variants: [formVariant({ valueIds: ['c1'], infinite: false, stock: 12 })],
      }),
    );

    expect(payload.variants[0].trackInventory).toBe(true);
    expect(payload.variants[0].initialStock).toBe(12);
  });
});

// ---------- buildUpdatePayload ----------

describe('buildUpdatePayload', () => {
  it('omits status, kind and shipping cost so the backend leaves them unchanged', () => {
    const payload = buildUpdatePayload(formValues());

    expect('status' in payload).toBe(false);
    expect('kind' in payload).toBe(false);
    expect('shippingCost' in payload).toBe(false);
  });

  it('omits collection membership and the media pool, which have their own endpoints', () => {
    const payload = buildUpdatePayload(
      formValues({ collectionIds: ['col-1'], media: [mediaTile()] }),
    );

    expect('collectionIds' in payload).toBe(false);
    expect('media' in payload).toBe(false);
  });

  it('asks for a cascade, because the merchant already deleted the dependent rows here', () => {
    expect(buildUpdatePayload(formValues()).cascadeDeleteVariants).toBe(true);
  });

  it('re-derives positions after the values inside an axis are reordered', () => {
    const before = buildUpdatePayload(
      formValues({
        options: [colourAxis],
        variants: [formVariant({ valueIds: ['c2'] })],
      }),
    );
    expect(before.variants[0].valueIndexes).toEqual([1]);

    const reordered = {
      ...colourAxis,
      values: [colourAxis.values[1], colourAxis.values[0]],
    };
    const after = buildUpdatePayload(
      formValues({
        options: [reordered],
        // the form still points at the SAME value id — only its position moved
        variants: [formVariant({ valueIds: ['c2'] })],
      }),
    );

    expect(after.options[0].values.map((value) => value.value)).toEqual(['آبی', 'قرمز']);
    expect(after.variants[0].valueIndexes).toEqual([0]);
  });

  it('re-derives positions after the axes themselves are reordered', () => {
    const payload = buildUpdatePayload(
      formValues({
        options: [sizeAxis, colourAxis],
        variants: [formVariant({ valueIds: ['s1', 'c2'] })],
      }),
    );

    expect(payload.options.map((option) => option.name)).toEqual(['سایز', 'رنگ']);
    expect(payload.variants[0].valueIndexes).toEqual([0, 1]);
  });

  it('round-trips the fields with no UI, because PUT replaces the whole variants array', () => {
    const values = mapDetailToFormValues(
      detail({
        options: [
          {
            id: 'o-color',
            name: 'رنگ',
            style: 'color',
            position: 0,
            values: [{ id: 'c1', value: 'قرمز', colorHex: '#ff0000', position: 0 }],
          },
        ],
        variants: [
          variantDetail({
            optionValueIds: ['c1'],
            sku: 'SKU-1',
            weight: 500,
            salePrice: 90,
            saleStartsAt: '2026-07-01T00:00:00.000Z',
            saleEndsAt: '2026-07-09T00:00:00.000Z',
            allowBackorder: true,
            isActive: false,
          }),
        ],
      }),
    );

    const payload = buildUpdatePayload(values);

    expect(payload.variants[0]).toMatchObject({
      id: 'v1',
      sku: 'SKU-1',
      weight: 500,
      salePrice: 90,
      saleStartsAt: '2026-07-01T00:00:00.000Z',
      saleEndsAt: '2026-07-09T00:00:00.000Z',
      allowBackorder: true,
      isActive: false,
    });
  });

  it('omits an empty compare and sale rather than sending null through validation', () => {
    const payload = buildUpdatePayload(
      formValues({
        options: [colourAxis],
        variants: [formVariant({ valueIds: ['c1'], compare: null, salePrice: null, sku: null })],
      }),
    );

    expect('compareAtPrice' in payload.variants[0]).toBe(false);
    expect('salePrice' in payload.variants[0]).toBe(false);
    expect('sku' in payload.variants[0]).toBe(false);
  });

  it('drops a row still pointing at a value that no longer exists', () => {
    const payload = buildUpdatePayload(
      formValues({
        options: [colourAxis],
        variants: [formVariant({ valueIds: ['c1'] }), formVariant({ valueIds: ['c9'] })],
      }),
    );

    expect(payload.variants).toHaveLength(1);
    expect(payload.variants[0].valueIndexes).toEqual([0]);
  });

  it('drops an option with no values without shifting the positions of the real axes', () => {
    const payload = buildUpdatePayload(
      formValues({
        options: [{ localKey: 'tmp-empty', name: 'جنس', style: 'button', values: [] }, colourAxis],
        variants: [formVariant({ valueIds: ['c2'] })],
      }),
    );

    expect(payload.options.map((option) => option.name)).toEqual(['رنگ']);
    expect(payload.variants[0].valueIndexes).toEqual([1]);
  });
});
