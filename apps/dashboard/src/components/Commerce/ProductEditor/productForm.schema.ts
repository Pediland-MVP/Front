import { useTranslations } from 'next-intl';
import { z } from 'zod';

import type {
  CommerceOptionDetail,
  CommerceProductDetail,
  CommerceProductKind,
  CommerceProductStatus,
  CommerceVariantDetail,
} from '@/types/commerce';

/**
 * The shared react-hook-form contract every editor section reads from and writes into via
 * `useFormContext<ProductFormValues>()` — this task's Basic Info/Shipping sections, and
 * Tasks 4-8's Media/Variants/Inventory/Categories sections. Field names/shapes here are
 * load-bearing for those later tasks: don't rename or reshape without checking every section
 * that reads it (see the Task 3 plan brief for the authoritative copy of this interface).
 */
export interface ProductFormValues {
  title: string;
  description: string;
  status: CommerceProductStatus;
  kind: CommerceProductKind;
  categoryId: string | null;
  shippingCost: number;
  options: Array<{
    id?: string;
    name: string;
    style: CommerceOptionDetail['style'];
    values: Array<{ id?: string; value: string; colorHex?: string }>;
  }>;
  variants: Array<{
    id?: string;
    valueIndexes: number[]; // positional, matches the backend's VariantDto exactly
    sku?: string;
    price: number;
    compareAtPrice?: number;
    salePrice?: number;
    saleStartsAt?: string;
    saleEndsAt?: string;
    isActive: boolean;
    trackInventory: boolean;
    allowBackorder: boolean;
    weight?: number;
    initialStock?: number; // create-time only; edits go through Task 7's stock endpoint
  }>;
}

type Translator = ReturnType<typeof useTranslations>;

/**
 * Built inside `ProductEditorPage` (which owns a live `useTranslations` instance) instead of
 * exported as a static module-level schema, so validation messages go through i18n per
 * CLAUDE.md §8 — mirrors the legacy `ProductForm.tsx`'s "build the zod schema inside the
 * component" pattern rather than the module-level schema some other forms use.
 */
export const buildProductFormSchema = (t: Translator) => {
  const optionValueSchema = z.object({
    id: z.string().optional(),
    value: z.string().min(1, { message: t('Validation.optionValueRequired') }),
    colorHex: z.string().optional(),
  });

  const optionSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: t('Validation.optionNameRequired') }),
    style: z.enum(['dropdown', 'button', 'color']),
    values: z.array(optionValueSchema),
  });

  // `compareAtPrice`/`salePrice` cross-field rules mirror the backend's variant validation
  // exactly (see design spec "Variants & pricing"): `compareAtPrice > price` (strictly, not
  // `>=`), `salePrice < price`, and `salePrice`/`saleStartsAt` must be set together. Checking
  // these here means the user sees the error inline before submit instead of after a 400.
  const variantSchema = z
    .object({
      id: z.string().optional(),
      valueIndexes: z.array(z.number().int().nonnegative()),
      sku: z.string().optional(),
      price: z
        .number()
        .int()
        .nonnegative({ message: t('Validation.priceInvalid') }),
      compareAtPrice: z.number().int().positive().optional(),
      salePrice: z.number().int().nonnegative().optional(),
      saleStartsAt: z.string().optional(),
      saleEndsAt: z.string().optional(),
      isActive: z.boolean(),
      trackInventory: z.boolean(),
      allowBackorder: z.boolean(),
      weight: z.number().nonnegative().optional(),
      initialStock: z.number().int().nonnegative().optional(),
    })
    .superRefine((variant, ctx) => {
      if (variant.compareAtPrice !== undefined && variant.compareAtPrice <= variant.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Validation.compareAtPriceInvalid'),
          path: ['compareAtPrice'],
        });
      }

      if (variant.salePrice !== undefined && variant.salePrice >= variant.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Validation.salePriceInvalid'),
          path: ['salePrice'],
        });
      }

      if (Boolean(variant.salePrice !== undefined) !== Boolean(variant.saleStartsAt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Validation.saleWindowRequired'),
          path: ['salePrice'],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Validation.saleWindowRequired'),
          path: ['saleStartsAt'],
        });
      }
    });

  return z.object({
    title: z
      .string()
      .min(1, { message: t('Validation.titleRequired') })
      .max(255, { message: t('Validation.titleMax') }),
    description: z.string(),
    status: z.enum(['draft', 'active', 'archived']),
    kind: z.enum(['physical', 'digital']),
    categoryId: z.string().nullable(),
    shippingCost: z
      .number()
      .int()
      .nonnegative({ message: t('Validation.shippingCostInvalid') }),
    options: z.array(optionSchema).max(3, { message: t('Validation.optionLimit') }),
    variants: z
      .array(variantSchema)
      .min(1, { message: t('Validation.variantRequired') })
      // Client-side mirror of the backend's `assertHasLiveVariant` guard — a product can
      // never be saved with zero active variants. `VariantsSection` also blocks the
      // deactivate/delete action itself so the user never gets this far, but this is the
      // safety net if the form is submitted some other way.
      .refine((variants) => variants.some((variant) => variant.isActive), {
        message: t('Validation.atLeastOneActiveVariantRequired'),
        path: [],
      }),
  });
};

/**
 * Create-mode defaults. A brand-new product needs at least one variant to satisfy the
 * backend's `COMMERCE_INVALID_SELECTION` guard, even though the real variants-editing UI
 * (Task 5) doesn't exist yet — a single option-less "base" variant is the empty-safe
 * starting point every later task builds on top of.
 */
export const buildEmptyProductFormValues = (): ProductFormValues => ({
  title: '',
  description: '',
  status: 'draft',
  kind: 'physical',
  categoryId: null,
  shippingCost: 0,
  options: [],
  variants: [
    {
      valueIndexes: [],
      price: 0,
      isActive: true,
      trackInventory: false,
      allowBackorder: false,
    },
  ],
});

/**
 * The backend's `VariantDto.valueIndexes` is positional: index `i` is the selected value's
 * `position` inside `options[i].values` (see Back's `createCommerceProduct.dto.ts`). The
 * `GET` detail response only gives `optionValueIds` (real value ids), so re-derive the
 * positional form here to keep the shared form contract's `variants[].valueIndexes` shape
 * consistent whether the product was just fetched or is being built fresh.
 */
const computeValueIndexes = (
  variant: CommerceVariantDetail,
  options: CommerceOptionDetail[],
): number[] =>
  options.map((option) => {
    const selected = option.values.find((value) => variant.optionValueIds.includes(value.id));
    // -1 should never happen for a valid variant (every option must have a selected value),
    // but guards against a malformed/partial response rather than throwing during render.
    return selected ? selected.position : -1;
  });

/** Edit-mode defaults: maps a fetched `CommerceProductDetail` into the shared form shape. */
export const mapProductDetailToFormValues = (
  product: CommerceProductDetail,
): ProductFormValues => ({
  title: product.title,
  description: product.description,
  status: product.status,
  kind: product.kind,
  categoryId: product.categoryId,
  shippingCost: product.shippingCost,
  options: product.options.map((option) => ({
    id: option.id,
    name: option.name,
    style: option.style,
    values: option.values.map((value) => ({
      id: value.id,
      value: value.value,
      colorHex: value.colorHex ?? undefined,
    })),
  })),
  variants: product.variants.map((variant) => ({
    id: variant.id,
    valueIndexes: computeValueIndexes(variant, product.options),
    sku: variant.sku ?? undefined,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice ?? undefined,
    salePrice: variant.salePrice ?? undefined,
    saleStartsAt: variant.saleStartsAt ?? undefined,
    saleEndsAt: variant.saleEndsAt ?? undefined,
    isActive: variant.isActive,
    trackInventory: variant.trackInventory,
    allowBackorder: variant.allowBackorder,
    weight: variant.weight ?? undefined,
  })),
});
