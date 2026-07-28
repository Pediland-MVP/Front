import { describe, it, expect } from 'vitest';
import {
  buildEmptyProductForm,
  buildProductEditorSchema,
  type ProductFormValues,
} from './productEditor.schema';

// The schema takes next-intl's `t`; the tests pass the key straight through so assertions match
// on the key rather than on Persian copy that may be reworded later.
const t = ((key: string) => key) as never;
const schema = buildProductEditorSchema(t);

const variant = (
  over: Partial<ProductFormValues['variants'][number]> = {},
): ProductFormValues['variants'][number] => ({
  valueIds: [],
  price: 1000,
  compare: null,
  stock: 5,
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

const form = (over: Partial<ProductFormValues> = {}): ProductFormValues => ({
  ...buildEmptyProductForm(),
  title: 'کفش',
  variants: [variant()],
  ...over,
});

describe('buildProductEditorSchema', () => {
  it('accepts a minimal valid product', () => {
    expect(schema.safeParse(form()).success).toBe(true);
  });

  it('rejects a blank title', () => {
    const result = schema.safeParse(form({ title: '   ' }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].path).toEqual(['title']);
    expect(result.error.issues[0].message).toBe('Validation.titleRequired');
  });

  it('rejects a variant with no price, pointing at that exact cell', () => {
    const result = schema.safeParse(form({ variants: [variant(), variant({ price: null })] }));
    expect(result.success).toBe(false);
    if (result.success) return;
    const issue = result.error.issues.find((i) => i.message === 'Validation.priceRequired');
    expect(issue?.path).toEqual(['variants', 1, 'price']);
  });

  it('rejects compareAtPrice equal to price, matching the DB CHECK', () => {
    const result = schema.safeParse(form({ variants: [variant({ price: 500, compare: 500 })] }));
    expect(result.success).toBe(false);
    if (result.success) return;
    const issue = result.error.issues.find((i) => i.message === 'Validation.compareInvalid');
    expect(issue?.path).toEqual(['variants', 0, 'compare']);
  });

  it('accepts compareAtPrice strictly above price', () => {
    const result = schema.safeParse(form({ variants: [variant({ price: 400, compare: 500 })] }));
    expect(result.success).toBe(true);
  });

  it('allows a null stock — a blank count is not an error', () => {
    expect(schema.safeParse(form({ variants: [variant({ stock: null })] })).success).toBe(true);
  });

  it('rejects a fourth option axis, matching the backend ArrayMaxSize(3)', () => {
    const axis = (id: string) => ({
      name: id,
      style: 'button' as const,
      localKey: `opt-${id}`,
      values: [{ value: 'v', localKey: `${id}-1` }],
    });
    const result = schema.safeParse(
      form({ options: [axis('a'), axis('b'), axis('c'), axis('d')] }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.message === 'Validation.attrLimit')).toBe(true);
  });

  it('rejects a product with zero variants', () => {
    const result = schema.safeParse(form({ variants: [] }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.message === 'Validation.variantRequired')).toBe(true);
  });

  it('rejects an option value with an empty label', () => {
    const result = schema.safeParse(
      form({
        options: [
          {
            name: 'رنگ',
            style: 'color',
            localKey: 'opt-1',
            values: [{ value: '  ', localKey: 'k1' }],
          },
        ],
      }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.message === 'Validation.optionValueRequired')).toBe(
      true,
    );
  });

  it('accepts the dropdown style, which the CSV import can produce', () => {
    const result = schema.safeParse(
      form({
        options: [
          {
            name: 'سایز',
            style: 'dropdown',
            localKey: 'opt-1',
            values: [{ value: '۴۰', localKey: 'k1' }],
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe('buildEmptyProductForm', () => {
  it('starts with exactly one blank variant, since a product cannot have zero', () => {
    const empty = buildEmptyProductForm();
    expect(empty.variants).toHaveLength(1);
    expect(empty.variants[0].price).toBeNull();
    expect(empty.variants[0].valueIds).toEqual([]);
  });

  it('starts with no axes, no media and no seeds', () => {
    const empty = buildEmptyProductForm();
    expect(empty.options).toEqual([]);
    expect(empty.media).toEqual([]);
    expect(empty.basePrice).toBeNull();
  });
});
