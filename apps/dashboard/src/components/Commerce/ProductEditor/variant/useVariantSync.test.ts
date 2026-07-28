import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import { useVariantSync, type VariantRow } from './useVariantSync';
import type { ProductFormValues } from '../productEditor.schema';

/** A SAVED axis: the backend has minted ids, and `mapDetailToFormValues` mirrors them into localKey. */
const axis = (id: string, values: string[]) => ({
  id,
  localKey: id,
  name: id,
  style: 'button' as const,
  values: values.map((valueId) => ({ id: valueId, localKey: valueId, value: valueId })),
});

/**
 * A BRAND-NEW axis, exactly as `AttributesSection` builds one: a `localKey` and nothing else.
 * Nothing on this page has a backend id until the product is saved.
 */
const freshAxis = (localKey: string, values: string[]) => ({
  localKey,
  name: localKey,
  style: 'button' as const,
  values: values.map((valueKey) => ({ localKey: valueKey, value: valueKey })),
});

const row = (valueIds: string[], over: Partial<VariantRow> = {}): VariantRow => ({
  valueIds,
  price: null,
  compare: null,
  stock: null,
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

const defaults = (over: Partial<ProductFormValues> = {}): ProductFormValues =>
  ({
    title: '',
    description: '',
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
  }) as ProductFormValues;

const setup = (initial: ProductFormValues) => {
  let api!: UseFormReturn<ProductFormValues>;
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const methods = useForm<ProductFormValues>({ defaultValues: initial });
    api = methods;
    // `FormProvider<ProductFormValues>` pins the generic by hand. `FormProvider` is a generic
    // ARROW function, not a `FunctionComponent`, so `createElement` falls back to inferring
    // `FieldValues` and then rejects `methods` — the error is about the field-values type, not
    // about `children`. `children` also has to stay in the props object because
    // `FormProviderProps` declares it required, which is what the eslint suppression is for.
    // eslint-disable-next-line react/no-children-prop
    return createElement(FormProvider<ProductFormValues>, { ...methods, children });
  };
  const view = renderHook(() => useVariantSync(), { wrapper: Wrapper });
  return {
    sync: () => act(() => void view.result.current.syncVariants()),
    syncResult: () => {
      let out!: ReturnType<typeof view.result.current.syncVariants>;
      act(() => {
        out = view.result.current.syncVariants();
      });
      return out;
    },
    removeRows: (indexes: number[]) => act(() => view.result.current.removeRows(indexes)),
    setOptions: (options: ProductFormValues['options']) =>
      act(() => api.setValue('options', options)),
    rows: () => api.getValues('variants') as VariantRow[],
  };
};

describe('syncVariants — generation', () => {
  it('appends exactly the combinations that have no row, seeded from the base price', () => {
    const t = setup(
      defaults({
        options: [axis('color', ['c1', 'c2'])],
        basePrice: 420000,
        baseCompare: 480000,
        baseStock: 7,
      }),
    );

    t.sync();

    expect(t.rows().map((r) => r.valueIds)).toEqual([['c1'], ['c2']]);
    expect(t.rows().map((r) => r.price)).toEqual([420000, 420000]);
    expect(t.rows().map((r) => r.compare)).toEqual([480000, 480000]);
  });

  it('seeds baseStock into the first row ever generated and no other', () => {
    const t = setup(
      defaults({ options: [axis('color', ['c1', 'c2'])], basePrice: 420000, baseStock: 7 }),
    );

    t.sync();
    expect(t.rows().map((r) => r.stock)).toEqual([7, null]);

    // A third colour later: the stock seed is spent, a count is a quantity not a template.
    t.setOptions([axis('color', ['c1', 'c2', 'c3'])]);
    t.sync();
    expect(t.rows().map((r) => r.stock)).toEqual([7, null, null]);
  });

  it('adds nothing on a second sync when every combination already has a row', () => {
    const t = setup(defaults({ options: [axis('color', ['c1', 'c2'])] }));

    t.sync();
    const second = t.syncResult();

    expect(second.added).toBe(0);
    expect(t.rows()).toHaveLength(2);
  });

  it('generates for a brand-new product, whose options have a localKey and no id at all', () => {
    // CREATE mode. `AttributesSection` mints `localKey` only — the backend id does not exist
    // until Save. Keying the axes on `id` made this produce nothing, so the whole variation
    // table never appeared for a new product.
    const t = setup(defaults({ options: [freshAxis('color', ['c1', 'c2'])], basePrice: 420000 }));

    t.sync();

    expect(t.rows().map((r) => r.valueIds)).toEqual([['c1'], ['c2']]);
    expect(t.rows().map((r) => r.price)).toEqual([420000, 420000]);
  });

  it('generates for a value added this session to an axis the backend already knows', () => {
    // EDIT mode, the mixed case: a saved axis plus one fresh value carrying only a localKey.
    const saved = axis('color', ['c1']);
    const t = setup(defaults({ options: [saved] }));
    t.sync();

    t.setOptions([{ ...saved, values: [...saved.values, { localKey: 'c2-local', value: 'آبی' }] }]);
    t.sync();

    expect(t.rows().map((r) => r.valueIds)).toEqual([['c1'], ['c2-local']]);
  });

  it('stops at the 2000-variant ceiling and reports it', () => {
    const many = (prefix: string) =>
      axis(
        prefix,
        Array.from({ length: 13 }, (_unused, i) => `${prefix}${i}`),
      );
    const t = setup(defaults({ options: [many('a'), many('b'), many('c')] })); // 2197 combos

    const result = t.syncResult();

    expect(t.rows()).toHaveLength(2000);
    expect(result.capped).toBe(true);
  });
});

describe('syncVariants — deletions stay deleted', () => {
  it('does not resurrect a row the merchant removed', () => {
    const t = setup(defaults({ options: [axis('color', ['c1', 'c2'])] }));
    t.sync();

    t.removeRows([0]);
    expect(t.rows().map((r) => r.valueIds)).toEqual([['c2']]);

    // The whole point: a later axis edit must not bring ['c1'] back.
    t.setOptions([axis('color', ['c1', 'c2', 'c3'])]);
    t.sync();

    expect(t.rows().map((r) => r.valueIds)).toEqual([['c2'], ['c3']]);
  });

  it('forgets the deletion once the axis set changes shape, because the keys stop meaning anything', () => {
    const t = setup(defaults({ options: [axis('color', ['c1', 'c2'])] }));
    t.sync();
    t.removeRows([0]);

    // A second axis: comboKey is order-sensitive, so 'c1' is no longer a key in this space.
    t.setOptions([axis('color', ['c1', 'c2']), axis('size', ['s1'])]);
    t.sync();

    expect(t.rows().map((r) => r.valueIds)).toEqual([
      ['c1', 's1'],
      ['c2', 's1'],
    ]);
  });
});

/**
 * `PUT /commerce/products/:id` sends `cascadeDeleteVariants: true` and replaces the WHOLE variants
 * array, so a row that comes back from regeneration without its `id` is a DELETE plus a blank
 * INSERT. These cover the two ways that used to happen silently — the grid looked unchanged
 * because the price carried over.
 */
describe('syncVariants — an axis edit never strips a variant of its identity', () => {
  /** A saved row, exactly as `mapDetailToFormValues` produces one. */
  const saved = (id: string, valueIds: string[], over: Partial<VariantRow> = {}) =>
    row(valueIds, {
      id,
      price: 500000,
      sku: `SKU-${id}`,
      weight: 500,
      salePrice: 400000,
      saleStartsAt: '2026-07-01T00:00:00.000Z',
      saleEndsAt: '2026-08-01T00:00:00.000Z',
      allowBackorder: true,
      isActive: false,
      ...over,
    });

  it('carries the donor’s id and every no-UI field onto the combination that extends it', () => {
    const t = setup(
      defaults({
        options: [axis('color', ['red', 'blue'])],
        variants: [saved('v1', ['red']), saved('v2', ['blue'])],
      }),
    );

    // A second axis with exactly ONE value: each old row maps 1:1 onto its replacement.
    t.setOptions([axis('color', ['red', 'blue']), axis('size', ['m'])]);
    t.sync();

    const rows = t.rows();
    expect(rows.map((r) => r.valueIds)).toEqual([
      ['red', 'm'],
      ['blue', 'm'],
    ]);
    expect(rows.map((r) => r.id)).toEqual(['v1', 'v2']);
    expect(rows.map((r) => r.sku)).toEqual(['SKU-v1', 'SKU-v2']);
    expect(rows.map((r) => r.weight)).toEqual([500, 500]);
    expect(rows.map((r) => r.isActive)).toEqual([false, false]);
    expect(rows.map((r) => r.allowBackorder)).toEqual([true, true]);
    expect(rows.map((r) => r.salePrice)).toEqual([400000, 400000]);
    expect(rows.map((r) => r.saleStartsAt)).toEqual([
      '2026-07-01T00:00:00.000Z',
      '2026-07-01T00:00:00.000Z',
    ]);
    expect(rows.map((r) => r.saleEndsAt)).toEqual([
      '2026-08-01T00:00:00.000Z',
      '2026-08-01T00:00:00.000Z',
    ]);
  });

  it('gives the donor’s id and sku to exactly ONE of the rows that replace it', () => {
    // One row split three ways: two of the three are genuinely new variants, and a duplicated id
    // (or sku) would be an insert the backend silently collapses.
    const t = setup(
      defaults({
        options: [axis('color', ['red'])],
        variants: [saved('v1', ['red'])],
      }),
    );

    t.setOptions([axis('color', ['red']), axis('size', ['s', 'm', 'l'])]);
    t.sync();

    const rows = t.rows();
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.id)).toEqual(['v1', undefined, undefined]);
    expect(rows.map((r) => r.sku)).toEqual(['SKU-v1', null, null]);
    // Everything that describes the PRODUCT still lands on all three.
    expect(rows.map((r) => r.isActive)).toEqual([false, false, false]);
    expect(rows.map((r) => r.weight)).toEqual([500, 500, 500]);
  });

  it('keeps every id and sku through a pure axis REORDER — nothing is orphaned at all', () => {
    // The worst trigger: `AttributesSection`'s move-up button asks for no confirmation, and
    // `valueIds` is positional, so before the realign step every row looked stale.
    const t = setup(
      defaults({
        options: [axis('color', ['red', 'blue']), axis('size', ['s', 'm'])],
        variants: [
          saved('v1', ['red', 's']),
          saved('v2', ['red', 'm']),
          saved('v3', ['blue', 's']),
          saved('v4', ['blue', 'm']),
        ],
      }),
    );
    // The first sync settles the axis shape, the way a real session always does.
    t.sync();

    t.setOptions([axis('size', ['s', 'm']), axis('color', ['red', 'blue'])]);
    const result = t.syncResult();

    // Nothing added, nothing removed: the rows are a permutation of themselves.
    expect(result).toMatchObject({ added: 0, removed: 0 });
    const rows = t.rows();
    expect(rows.map((r) => r.id).sort()).toEqual(['v1', 'v2', 'v3', 'v4']);
    expect(rows.map((r) => r.sku).sort()).toEqual(['SKU-v1', 'SKU-v2', 'SKU-v3', 'SKU-v4']);
    expect(rows.every((r) => r.isActive === false)).toBe(true);
    // …and each row's ids are now in the NEW axis order, so the grid groups by size.
    rows.forEach((r) => {
      expect(['s', 'm']).toContain(r.valueIds[0]);
      expect(['red', 'blue']).toContain(r.valueIds[1]);
    });
  });
});

describe('syncVariants — removing an axis keeps the numbers', () => {
  it('finds a donor in the SHRINK direction instead of falling back to the blank base seeds', () => {
    // `mapDetailToFormValues` sets basePrice/baseCompare/baseStock to null on a loaded product, so
    // "no donor" here meant every price, stock and photo on screen went blank at once.
    const t = setup(
      defaults({
        options: [axis('color', ['red', 'blue']), axis('size', ['s', 'm', 'l'])],
        basePrice: null,
        baseCompare: null,
        baseStock: null,
        variants: [
          row(['red', 's'], { id: 'v1', price: 100, compare: 150, stock: 5, mediaIds: ['m-1'] }),
          row(['red', 'm'], { id: 'v2', price: 110, compare: 160, stock: 6 }),
          row(['red', 'l'], { id: 'v3', price: 120, compare: 170, stock: 7 }),
          row(['blue', 's'], { id: 'v4', price: 200, compare: 250, stock: 8, mediaIds: ['m-2'] }),
          row(['blue', 'm'], { id: 'v5', price: 210, compare: 260, stock: 9 }),
          row(['blue', 'l'], { id: 'v6', price: 220, compare: 270, stock: 10 }),
        ],
      }),
    );

    t.setOptions([axis('color', ['red', 'blue'])]);
    t.sync();

    const rows = t.rows();
    expect(rows.map((r) => r.valueIds)).toEqual([['red'], ['blue']]);
    // The first row of each collapsed group donates — price, compare, stock, media and id all
    // survive rather than coming back null.
    expect(rows.map((r) => r.price)).toEqual([100, 200]);
    expect(rows.map((r) => r.compare)).toEqual([150, 250]);
    expect(rows.map((r) => r.stock)).toEqual([5, 8]);
    expect(rows.map((r) => r.mediaIds)).toEqual([['m-1'], ['m-2']]);
    expect(rows.map((r) => r.id)).toEqual(['v1', 'v4']);
  });
});

describe('syncVariants — stale rows', () => {
  it('removes the rows of a value that no longer exists', () => {
    const t = setup(defaults({ options: [axis('color', ['c1', 'c2'])] }));
    t.sync();

    t.setOptions([axis('color', ['c1'])]);
    const result = t.syncResult();

    expect(t.rows().map((r) => r.valueIds)).toEqual([['c1']]);
    expect(result.removed).toBe(1);
  });

  it('carries a replaced row’s price onto the combinations that extend it', () => {
    const t = setup(
      defaults({
        options: [axis('color', ['c1'])],
        basePrice: 1000,
        variants: [row(['c1'], { price: 999000, compare: 1200000, stock: 4 })],
      }),
    );

    t.setOptions([axis('color', ['c1']), axis('size', ['s1', 's2'])]);
    t.sync();

    expect(t.rows().map((r) => r.valueIds)).toEqual([
      ['c1', 's1'],
      ['c1', 's2'],
    ]);
    // price/compare are a template and follow every child; stock is a quantity and does not.
    expect(t.rows().map((r) => r.price)).toEqual([999000, 999000]);
    expect(t.rows().map((r) => r.compare)).toEqual([1200000, 1200000]);
    expect(t.rows().map((r) => r.stock)).toEqual([4, null]);
  });
});
