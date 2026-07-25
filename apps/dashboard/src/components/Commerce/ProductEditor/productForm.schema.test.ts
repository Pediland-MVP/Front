import { describe, expect, it } from 'vitest';

import { buildProductFormSchema, type ProductFormValues } from './productForm.schema';

// A translator stub good enough for schema tests: just echoes the key back so assertions can
// check which validation key fired without depending on the real fa.json copy.
const fakeTranslator = ((key: string) => key) as Parameters<typeof buildProductFormSchema>[0];

const baseVariant: ProductFormValues['variants'][number] = {
  valueIndexes: [],
  price: 1000,
  isActive: true,
  trackInventory: false,
  allowBackorder: false,
};

const baseValues = (): ProductFormValues => ({
  title: 'Title',
  description: '',
  status: 'draft',
  kind: 'physical',
  categoryId: null,
  collectionIds: [],
  shippingCost: 0,
  options: [],
  variants: [{ ...baseVariant }],
});

describe('buildProductFormSchema variant price rules', () => {
  const schema = buildProductFormSchema(fakeTranslator);

  it('accepts a compareAtPrice strictly greater than price', () => {
    const values = baseValues();
    values.variants[0].compareAtPrice = 1500;
    expect(schema.safeParse(values).success).toBe(true);
  });

  it('rejects a compareAtPrice equal to price (must be strictly greater, not >=)', () => {
    const values = baseValues();
    values.variants[0].compareAtPrice = 1000;
    const result = schema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Validation.compareAtPriceInvalid'),
      ).toBe(true);
    }
  });

  it('rejects a compareAtPrice lower than price', () => {
    const values = baseValues();
    values.variants[0].compareAtPrice = 500;
    expect(schema.safeParse(values).success).toBe(false);
  });

  it('accepts a salePrice strictly lower than price when paired with saleStartsAt', () => {
    const values = baseValues();
    values.variants[0].salePrice = 800;
    values.variants[0].saleStartsAt = new Date().toISOString();
    expect(schema.safeParse(values).success).toBe(true);
  });

  it('rejects a salePrice equal to price', () => {
    const values = baseValues();
    values.variants[0].salePrice = 1000;
    values.variants[0].saleStartsAt = new Date().toISOString();
    const result = schema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Validation.salePriceInvalid'),
      ).toBe(true);
    }
  });

  it('rejects salePrice set without saleStartsAt', () => {
    const values = baseValues();
    values.variants[0].salePrice = 800;
    const result = schema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Validation.saleWindowRequired'),
      ).toBe(true);
    }
  });

  it('rejects saleStartsAt set without salePrice', () => {
    const values = baseValues();
    values.variants[0].saleStartsAt = new Date().toISOString();
    const result = schema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message === 'Validation.saleWindowRequired'),
      ).toBe(true);
    }
  });
});

describe('buildProductFormSchema at-least-one-active-variant rule', () => {
  const schema = buildProductFormSchema(fakeTranslator);

  it('rejects a variants array where every variant is inactive', () => {
    const values = baseValues();
    values.variants[0].isActive = false;
    const result = schema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Validation.atLeastOneActiveVariantRequired',
        ),
      ).toBe(true);
    }
  });

  it('accepts a variants array with at least one active variant', () => {
    const values = baseValues();
    values.variants.push({ ...baseVariant, isActive: false });
    expect(schema.safeParse(values).success).toBe(true);
  });
});
