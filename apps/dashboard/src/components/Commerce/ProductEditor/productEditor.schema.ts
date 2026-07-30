import type { useTranslations } from 'next-intl';
import { z } from 'zod';

import type { CommerceOptionStyle, CommerceProductMedia } from '@/types/commerce';

/** Mirrors the backend's `@ArrayMaxSize(3)` on `options` and its per-product variant ceiling. */
export const MAX_ATTRS = 3;
export const MAX_VARIANTS = 2000;
/** `@ArrayMaxSize(30)` on `tags`, `@ArrayMaxSize(50)` on `specs`. */
export const MAX_TAGS = 30;
export const MAX_SPECS = 50;

/**
 * A media tile. `isPending` is true for a file chosen in CREATE mode, which has no row in
 * `commerce_product_media` yet — the product it belongs to does not exist, and that column is
 * NOT NULL. Those are uploaded immediately after the product is created.
 *
 * THE ONE definition. `sections/MediaSection` re-exports it rather than declaring its own: the
 * two were structurally identical, which is precisely what made them dangerous — adding a field
 * to one and not the other would have diverged silently, with no compiler error anywhere.
 */
export interface EditorMedia {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  isPending: boolean;
  file?: File;
  /**
   * A video's resolved poster frame (`CommerceProductMedia.posterUrl`), when the backend has one.
   * `undefined` on a file queued in CREATE mode — nothing has been transcoded yet.
   */
  posterUrl?: string | null;
}

/**
 * The still frame to draw for a tile.
 *
 * A video's `url` is the video file itself: put it in an `<img>`/`next/image` and every surface
 * except the pool (which renders a real `<video>`) shows a broken image. The poster frame is what
 * a thumbnail wants, and `null` means "there is no still to show" — the caller draws its own
 * placeholder rather than a broken one.
 */
export const posterOf = (item: Pick<EditorMedia, 'type' | 'url' | 'posterUrl'>): string | null =>
  item.type === 'video' ? (item.posterUrl ?? null) : item.url;

export interface ProductFormValues {
  title: string;
  /** Markdown. The WYSIWYG surface renders it; markdown stays the stored value. */
  description: string;
  categoryId: string | null;
  /** Tag NAMES. The backend resolves-or-creates each against the workspace pool. */
  tags: string[];
  specs: Array<{ title: string; body: string }>;
  /** Collection membership. Create sends the ids inline; edit diffs them against the server. */
  collectionIds: string[];

  /**
   * The media pool. Not a payload field — uploads go through their own endpoint — but it lives
   * in the form so the variant media picker can resolve `variants[].mediaIds` to real tiles
   * without prop-drilling the pool through six components.
   */
  media: EditorMedia[];

  /**
   * Editor-only seeds, never persisted. `basePrice`/`baseCompare` seed EVERY generated variant;
   * `baseStock` seeds only the FIRST, because a stock count is a quantity, not a template.
   */
  basePrice: number | null;
  baseCompare: number | null;
  baseStock: number | null;

  options: Array<{
    /** Absent = created this session; the backend mints the real id on save. */
    id?: string;
    /** Stable client key, so a field-array row keeps its identity before it has a real id. */
    localKey: string;
    name: string;
    /**
     * The full backend enum. This editor only ever WRITES 'button' or 'color' (a colour axis is
     * one whose values carry a hex — the design has no style picker), but an option created by
     * the CSV import can already be 'dropdown' and loading it must not fail.
     */
    style: CommerceOptionStyle;
    values: Array<{
      id?: string;
      value: string;
      colorHex?: string;
      /**
       * Stable client key for a value typed this session, so a variant row can reference it
       * before the backend has assigned a real id. Never sent to the API.
       */
      localKey: string;
    }>;
  }>;

  variants: Array<{
    id?: string;
    /**
     * One option-value key per axis, in axis order — `id ?? localKey`. Keys rather than the
     * backend's positional `valueIndexes`: positions shift whenever an axis is reordered or a
     * value is removed, so a positional row cannot recognise itself after an edit. The mapping
     * layer converts to positions once, at payload time.
     */
    valueIds: string[];
    price: number | null;
    compare: number | null;
    /**
     * Whether this row is meant to carry a discount. Editor-only — the backend has no such
     * column, it infers "discounted" from `compareAtPrice` being present.
     *
     * A stored flag rather than a derived `compare != null`, for one concrete reason: the compare
     * cell is an UNCONTROLLED `register` input, so the row cannot tell "the merchant just cleared
     * the field" apart from "there is no discount". Derived, the cell would disable itself
     * mid-keystroke the moment the field went empty. The rendered state is
     * `compare != null || hasDiscount`, so a value arriving from a roll-up or fill-down still
     * opens the cell without anyone having to remember to set this too.
     */
    hasDiscount: boolean;
    stock: number | null;
    /** ∞ in the design. Maps to `trackInventory: false`. */
    infinite: boolean;
    /** Media ids in pick order — index 0 is this variant's cover. */
    mediaIds: string[];

    /**
     * No UI in this design. `PUT /commerce/products/:id` replaces the whole variants array, so
     * these are carried through untouched — without them, saving from this page would clear
     * every SKU in the catalogue.
     */
    sku: string | null;
    weight: number | null;
    salePrice: number | null;
    saleStartsAt: string | null;
    saleEndsAt: string | null;
    allowBackorder: boolean;
    isActive: boolean;
  }>;
}

type Translator = ReturnType<typeof useTranslations>;

/**
 * Built inside the component (which owns a live `useTranslations`) rather than exported as a
 * module-level schema, so validation messages go through i18n per CLAUDE.md §8.
 *
 * Issues carry per-cell paths (`['variants', 3, 'price']`) so the grid can tint the exact
 * offending input instead of showing one toast with a count.
 */
export const buildProductEditorSchema = (t: Translator) => {
  const optionValueSchema = z.object({
    id: z.string().optional(),
    value: z
      .string()
      .trim()
      .min(1, { message: t('Validation.optionValueRequired') })
      .max(100, { message: t('Validation.optionValueMax') }),
    // `@Length(4, 9)` on the backend bounds the length but not the SHAPE, so "redred" passed
    // both sides and reached the DB as an unrenderable swatch.
    colorHex: z
      .string()
      .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { message: t('Validation.colorHexInvalid') })
      .optional(),
    localKey: z.string(),
  });

  const optionSchema = z.object({
    id: z.string().optional(),
    localKey: z.string(),
    name: z
      .string()
      .trim()
      .min(1, { message: t('Validation.optionNameRequired') })
      .max(100, { message: t('Validation.optionNameMax') }),
    style: z.enum(['dropdown', 'button', 'color']),
    values: z.array(optionValueSchema),
  });

  /** `price` is a bigint column; this keeps every amount inside Number.MAX_SAFE_INTEGER. */
  const MAX_AMOUNT = 999_999_999_999;
  const MAX_STOCK = 1_000_000_000;
  /** grams. `weight` is an int4 column — unbounded, a large value is a driver 500, not a 400. */
  const MAX_WEIGHT = 10_000_000;

  const variantSchema = z
    .object({
      id: z.string().optional(),
      valueIds: z.array(z.string()),
      // Nullable in the FORM because a blank cell is a real state while filling the table.
      // The refinement below is what stops a null reaching `commerce_product_variant.price`,
      // which is NOT NULL with CHECK price >= 0.
      price: z
        .number()
        .int()
        .nonnegative({ message: t('Validation.priceInvalid') })
        .max(MAX_AMOUNT, { message: t('Validation.priceMax') })
        .nullable(),
      compare: z
        .number()
        .int()
        .positive()
        .max(MAX_AMOUNT, { message: t('Validation.amountMax') })
        .nullable(),
      hasDiscount: z.boolean(),
      stock: z
        .number()
        .int()
        .nonnegative({ message: t('Validation.stockInvalid') })
        .max(MAX_STOCK, { message: t('Validation.stockMax') })
        .nullable(),
      infinite: z.boolean(),
      mediaIds: z.array(z.string()),
      sku: z
        .string()
        .trim()
        .max(100, { message: t('Validation.skuMax') })
        .nullable(),
      weight: z
        .number()
        .int({ message: t('Validation.weightInvalid') })
        .nonnegative({ message: t('Validation.weightInvalid') })
        .max(MAX_WEIGHT, { message: t('Validation.weightMax') })
        .nullable(),
      salePrice: z
        .number()
        .int()
        .nonnegative()
        .max(MAX_AMOUNT, { message: t('Validation.amountMax') })
        .nullable(),
      saleStartsAt: z.string().nullable(),
      saleEndsAt: z.string().nullable(),
      allowBackorder: z.boolean(),
      isActive: z.boolean(),
    })
    .superRefine((variant, ctx) => {
      if (variant.price == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: t('Validation.priceRequired'),
        });
      }
      // Mirrors CHK_commerce_variant_compare_gt_price — strictly greater, not >=.
      if (variant.compare != null && variant.price != null && variant.compare <= variant.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['compare'],
          message: t('Validation.compareInvalid'),
        });
      }
      // A tracked variant must say how many. ∞ is the way to say "not tracked" — blank is not.
      if (!variant.infinite && variant.stock == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['stock'],
          message: t('Validation.stockRequired'),
        });
      }
      // Mirrors CHK_commerce_variant_sale_lt_price. Reported on `price`, not `salePrice`: the
      // price cell is the one on screen, and it is the one the merchant can act on.
      if (
        variant.salePrice != null &&
        variant.price != null &&
        variant.salePrice >= variant.price
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: t('Validation.salePriceInvalid', { amount: variant.salePrice }),
        });
      }
      // Mirrors CHK_commerce_variant_sale_schedule: set together or neither.
      if ((variant.salePrice != null) !== (variant.saleStartsAt != null)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['saleStartsAt'],
          message: t('Validation.salePricePairing'),
        });
      }
      // Only when BOTH exist — an end date on its own is legal, the CHECK pairs salePrice with
      // saleStartsAt only.
      if (variant.saleStartsAt != null && variant.saleEndsAt != null) {
        const starts = Date.parse(variant.saleStartsAt);
        const ends = Date.parse(variant.saleEndsAt);
        if (Number.isFinite(starts) && Number.isFinite(ends) && ends <= starts) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['saleEndsAt'],
            message: t('Validation.saleWindowInvalid'),
          });
        }
      }
    });

  return z.object({
    title: z
      .string()
      .trim()
      .min(1, { message: t('Validation.titleRequired') })
      .max(255, { message: t('Validation.titleMax') }),
    description: z
      .string()
      .trim()
      .min(1, { message: t('Validation.descriptionRequired') })
      .max(20_000, { message: t('Validation.descriptionMax') }),
    // A product with no category cannot be found in the storefront's own navigation, so this
    // is a data-completeness rule, not a UI preference.
    categoryId: z
      .string()
      .min(1, { message: t('Validation.categoryRequired') })
      .nullable()
      .refine((value) => value != null, { message: t('Validation.categoryRequired') }),
    tags: z
      .array(z.string().trim().min(1).max(50))
      .max(MAX_TAGS, { message: t('Validation.tagLimit') }),
    specs: z
      .array(
        z.object({
          title: z
            .string()
            .trim()
            .min(1, { message: t('Validation.specTitleRequired') })
            .max(100, { message: t('Validation.specTitleMax') }),
          body: z
            .string()
            .trim()
            .min(1, { message: t('Validation.specBodyRequired') })
            .max(500, { message: t('Validation.specBodyMax') }),
        }),
      )
      .max(MAX_SPECS),
    collectionIds: z.array(z.string()),
    // Not validated beyond its shape: the pool is server state mirrored into the form, and a
    // pending tile is only ever produced by the file picker.
    media: z.array(z.custom<EditorMedia>()),
    basePrice: z.number().int().nonnegative().nullable(),
    baseCompare: z.number().int().nonnegative().nullable(),
    baseStock: z.number().int().nonnegative().nullable(),
    options: z.array(optionSchema).max(MAX_ATTRS, { message: t('Validation.attrLimit') }),
    variants: z
      .array(variantSchema)
      .min(1, { message: t('Validation.variantRequired') })
      .max(MAX_VARIANTS, { message: t('Validation.variantLimit') }),
  });
};

/**
 * Create-mode defaults. The single blank variant is not a placeholder: a product with no axes
 * has one implicit variation that no table renders, and it is the only place its price can live.
 * The backend also rejects a product with zero variants (`COMMERCE_INVALID_SELECTION`).
 */
export const buildEmptyProductForm = (): ProductFormValues => ({
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
  variants: [
    {
      valueIds: [],
      price: null,
      compare: null,
      hasDiscount: false,
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
    },
  ],
});

/** Re-exported so the mapping layer and the grid share one definition of the media tile. */
export type { CommerceProductMedia };
