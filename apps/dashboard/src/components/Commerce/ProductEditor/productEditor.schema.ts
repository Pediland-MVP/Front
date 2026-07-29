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
      .min(1, { message: t('Validation.optionValueRequired') }),
    colorHex: z.string().optional(),
    localKey: z.string(),
  });

  const optionSchema = z.object({
    id: z.string().optional(),
    localKey: z.string(),
    name: z
      .string()
      .trim()
      .min(1, { message: t('Validation.optionNameRequired') }),
    style: z.enum(['dropdown', 'button', 'color']),
    values: z.array(optionValueSchema),
  });

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
        .nullable(),
      compare: z.number().int().positive().nullable(),
      hasDiscount: z.boolean(),
      stock: z
        .number()
        .int()
        .nonnegative({ message: t('Validation.stockInvalid') })
        .nullable(),
      infinite: z.boolean(),
      mediaIds: z.array(z.string()),
      sku: z.string().nullable(),
      weight: z.number().nullable(),
      salePrice: z.number().nullable(),
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
    });

  return z.object({
    title: z
      .string()
      .trim()
      .min(1, { message: t('Validation.titleRequired') })
      .max(255, { message: t('Validation.titleMax') }),
    description: z.string(),
    categoryId: z.string().nullable(),
    tags: z
      .array(z.string().trim().min(1).max(50))
      .max(MAX_TAGS, { message: t('Validation.tagLimit') }),
    specs: z
      .array(
        z.object({
          title: z
            .string()
            .trim()
            .min(1, { message: t('Validation.specTitleRequired') }),
          body: z
            .string()
            .trim()
            .min(1, { message: t('Validation.specBodyRequired') }),
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
