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
