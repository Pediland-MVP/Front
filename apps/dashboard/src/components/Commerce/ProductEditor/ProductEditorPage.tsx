'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import {
  useForm,
  useFormContext,
  useWatch,
  type FieldErrors,
  type FieldPath,
  type Resolver,
} from 'react-hook-form';
import { toast } from 'sonner';
import { mutate } from 'swr';

import api from '@/hooks/swr/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import type {
  CommerceCategory,
  CommerceCollectionListItem,
  CommerceProductDetail,
  CommerceProductMedia,
} from '@/types/commerce';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import type { IResponseMessage } from '@/types/responseMessage';

import { Form } from '@/components/ui';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { NoDataError } from '@/components/Global/NoDataError';

import { mapCategoriesToTree, mapDetailToFormValues } from './productEditor.mapping';
import {
  buildEmptyProductForm,
  buildProductEditorSchema,
  posterOf,
  type EditorMedia,
  type ProductFormValues,
} from './productEditor.schema';
import {
  CATEGORIES_KEY,
  COLLECTIONS_KEY,
  productDetailKey,
  useProductLoad,
} from './useProductLoad';
import { useProductSave } from './useProductSave';
import { formatCount } from './utils/editorNumber.util';

import { EditorSection } from './ui/EditorSection';
import { EditorTopBar } from './ui/EditorTopBar';
import { TitleSection } from './sections/TitleSection';
import { DescriptionSection } from './sections/DescriptionSection';
import { CategorySection } from './sections/CategorySection';
import { MediaSection } from './sections/MediaSection';
import { BasePriceSection } from './sections/BasePriceSection';
import { BaseStockSection } from './sections/BaseStockSection';
import { AttributesSection } from './sections/AttributesSection';
import { SpecsSection } from './sections/SpecsSection';
import { VariantSyncProvider, useVariantSyncContext } from './variant/useVariantSync';
import { VariantsSection } from './variant/VariantsSection';
import type { VariantMediaItem, VariantMediaTarget } from './variant/VariantLeafRow';
import { CollectionsPanel } from './rail/CollectionsPanel';
import { TagsPanel } from './rail/TagsPanel';
import { CategoryPickerDialog } from './dialogs/CategoryPickerDialog';
import { ConfirmDialog, type EditorConfirm } from './dialogs/ConfirmDialog';
import { PreviewDialog } from './dialogs/PreviewDialog';
import { VariantMediaPickerDialog } from './dialogs/VariantMediaPickerDialog';

/**
 * The design's nine numbered steps, in scroll order. One object rather than nine hard-coded
 * `step={7}` props, which drift the first time a section is inserted.
 */
const STEPS = {
  title: 1,
  description: 2,
  category: 3,
  media: 4,
  basePrice: 5,
  baseStock: 6,
  attributes: 7,
  specs: 8,
  variants: 9,
} as const;

/**
 * Which input a failed submit should jump to.
 *
 * A path, not a variant index: the blocking issue is very often NOT in the grid — a nameless axis
 * or a half-filled spec fails just as hard, and jumping only into `variants` left the merchant
 * staring at a table with nothing wrong in it.
 */
type FocusTarget = { path: FieldPath<ProductFormValues> };

/**
 * The first input a failed submit should land on, walked in the page's own reading order —
 * ۱ عنوان, ۷ ویژگی‌ها, ۸ مشخصات, ۹ تنوع‌ها.
 *
 * Zod issue paths are per-field (`['variants', 3, 'price']`, `['options', 0, 'name']`), which is
 * what makes this possible at all. Anything not listed here has no focusable input to jump to.
 */
const firstErrorPath = (
  errors: FieldErrors<ProductFormValues>,
): FieldPath<ProductFormValues> | null => {
  if (errors.title) return 'title';
  if (errors.description) return 'description';
  if (errors.categoryId) return 'categoryId';

  const options = errors.options as Array<{ name?: unknown } | undefined> | undefined;
  if (Array.isArray(options)) {
    const index = options.findIndex((option) => !!option?.name);
    if (index >= 0) return `options.${index}.name`;
  }

  const specs = errors.specs as Array<{ title?: unknown; body?: unknown } | undefined> | undefined;
  if (Array.isArray(specs)) {
    const index = specs.findIndex((spec) => !!spec?.title || !!spec?.body);
    if (index >= 0) return specs[index]?.title ? `specs.${index}.title` : `specs.${index}.body`;
  }

  const rows = errors.variants as
    | Array<{ price?: unknown; compare?: unknown; stock?: unknown } | undefined>
    | undefined;
  if (Array.isArray(rows)) {
    const index = rows.findIndex((row) => !!row);
    if (index >= 0) {
      const row = rows[index];
      return row?.price
        ? `variants.${index}.price`
        : row?.compare
          ? `variants.${index}.compare`
          : `variants.${index}.stock`;
    }
  }

  return null;
};

const byPosition = (a: { position: number }, b: { position: number }): number =>
  a.position - b.position;

/**
 * A saved media row as the form's pool tile. `isPending: false` is the whole difference — this
 * one already has a row in `commerce_product_media`, so removing it is a DELETE and it can be
 * referenced by `variants[].mediaIds` straight away.
 */
const toEditorMedia = (item: CommerceProductMedia): EditorMedia => ({
  id: item.id,
  name: item.alt ?? '',
  url: item.url,
  type: item.type,
  isPending: false,
  // Carried, not dropped: for a video this is the ONLY frame the thumbnail surfaces can draw.
  // Without it the picker, both grid rows and the bulk bar all put the video file itself in an
  // <img> and render a broken tile.
  posterUrl: item.posterUrl,
});

const poolOf = (media: CommerceProductMedia[]): EditorMedia[] =>
  [...media].sort(byPosition).map(toEditorMedia);

const errorCodeOf = (error: unknown): string | undefined =>
  isAxiosError(error) ? (error.response?.data as ExceptionMessage | undefined)?.code : undefined;

interface ProductEditorPageProps {
  mode: 'create' | 'edit';
  productId?: string;
}

/**
 * The outer shell: it owns the four reads and the single `useForm`, and nothing else.
 *
 * The body is a separate component because `useVariantSyncContext` can only be read BELOW the
 * provider, and the axis handlers in step ۷ and the grid in step ۹ must share one suppression
 * list. Everything the body needs off the form comes from `useFormContext`, so the split costs
 * no prop drilling.
 */
export const ProductEditorPage = ({ mode, productId }: ProductEditorPageProps) => {
  const t = useTranslations('Commerce.Editor');
  const { product, categories, collections, collectionsLoaded, tagPool, isLoading, loadError } =
    useProductLoad(mode, productId);

  const schema = useMemo(() => buildProductEditorSchema(t), [t]);
  const form = useForm<ProductFormValues>({
    /**
     * The two casts cover a DEPENDENCY gap, not a schema one. `@hookform/resolvers@3` types its
     * schema argument as `z.Schema` and resolves `zod` up the tree to the hoisted **zod 4**
     * (`$ZodTypeInternals`), while this app is pinned to zod 3 — which is why all 42
     * `zodResolver` call sites in this repo fail to typecheck the same way. Nothing is wrong at
     * runtime; the resolver is handed the schema it was built from.
     *
     * There is no useful compile-time check to put in its place: this app builds with
     * `strictNullChecks` off, under which zod's `z.infer` reports EVERY field as optional, so
     * the inferred shape never matches `ProductFormValues` regardless of whether they agree.
     * `productEditor.schema.test.ts` is what guards the schema instead.
     */
    resolver: zodResolver(
      schema as unknown as Parameters<typeof zodResolver>[0],
    ) as Resolver<ProductFormValues>,
    defaultValues: buildEmptyProductForm(),
    // Validating on submit, not on change: with up to 2000 rows × 5 inputs, per-keystroke
    // validation is the one thing that would make the grid feel slow.
    mode: 'onSubmit',
  });

  // Told once, not once per revalidation — SWR retries a failed read on focus and reconnect.
  const toldLoadError = useRef(false);
  useEffect(() => {
    if (!loadError || toldLoadError.current) return;
    toldLoadError.current = true;
    toast.error(t('Errors.loadFailed'));
  }, [loadError, t]);

  if (isLoading) return <LoaderSpin />;
  /**
   * `loadError` alone must NOT gate this render. SWR sets `error` on a REVALIDATION failure while
   * it still holds the previous `data`, and this page triggers those revalidations itself — after
   * every media add and delete, and again from `useProductSave`, whose
   * `mutateIncludeStringKey('/commerce/products')` substring filter also matches this detail key.
   *
   * Gating on the error would mean one transient 500 or offline blip swaps the whole editor for
   * `<NoDataError />`, unmounting the form and throwing away every unsaved title, price and axis
   * edit. It is only fatal when there is nothing left to show; a failed refresh with data in hand
   * is reported by the one-shot toast above and nothing more.
   */
  if (mode === 'edit' && !product) return <NoDataError />;
  if (loadError && !product) return <NoDataError />;

  return (
    <Form {...form}>
      <VariantSyncProvider>
        <ProductEditorBody
          mode={mode}
          productId={productId}
          product={product}
          categories={categories}
          collections={collections}
          collectionsLoaded={collectionsLoaded}
          tagPool={tagPool}
        />
      </VariantSyncProvider>
    </Form>
  );
};

interface ProductEditorBodyProps {
  mode: 'create' | 'edit';
  productId?: string;
  product?: CommerceProductDetail;
  categories: CommerceCategory[];
  collections: CommerceCollectionListItem[];
  collectionsLoaded: boolean;
  tagPool: string[];
}

const ProductEditorBody = ({
  mode,
  productId,
  product,
  categories,
  collections,
  collectionsLoaded,
  tagPool,
}: ProductEditorBodyProps) => {
  const t = useTranslations('Commerce.Editor');
  const tVariants = useTranslations('Commerce.Editor.Variants');
  const t_ec = useTranslations('ERROR_CODES');
  const { can } = usePermissions();
  const canSubmit = mode === 'create' ? can('product:create') : can('product:edit');

  const { control, getValues, handleSubmit, reset, setFocus, setValue } =
    useFormContext<ProductFormValues>();
  const { syncVariants, resetSuppressed } = useVariantSyncContext();

  // ---------------------------------------------------------------- seeding

  /**
   * Membership is not on the product detail — it is derived from the collections list, which is
   * a separate request. Merged in here so the form has one complete starting value.
   */
  const membershipOf = useCallback(
    (id: string): string[] =>
      collections
        .filter((collection) => collection.productIds.includes(id))
        .map((collection) => collection.id),
    [collections],
  );

  const seedFrom = useCallback(
    (detail: CommerceProductDetail): ProductFormValues => ({
      ...mapDetailToFormValues(detail),
      // `mapDetailToFormValues` returns an empty pool on purpose: the API's media shape and the
      // form's tile are different types, and this shell is the thing that owns the pool.
      media: poolOf(detail.media ?? []),
      collectionIds: membershipOf(detail.id),
    }),
    [membershipOf],
  );

  /**
   * Seeded EXACTLY once. `useSWRImmutable` still revalidates on remount and on reconnect, so it
   * can hand back a fresh product object minutes into an editing session — re-seeding then would
   * throw away every unsaved edit without a word.
   *
   * `baseline` is what بازگردانی resets to, kept in a ref for the same reason.
   */
  const seeded = useRef(false);
  const seededMembership = useRef(false);
  const baseline = useRef<ProductFormValues>(buildEmptyProductForm());

  useEffect(() => {
    if (mode !== 'edit' || !product || seeded.current) return;
    const values = seedFrom(product);
    baseline.current = values;
    // The suppression list belongs to the rows that were on screen; a freshly seeded form has
    // none of them, and a stale entry would silently refuse to regenerate a real combination.
    resetSuppressed();
    reset(values);
    seeded.current = true;
    seededMembership.current = collectionsLoaded;
  }, [collectionsLoaded, mode, product, reset, resetSuppressed, seedFrom]);

  /**
   * `/commerce/collections` is a separate request from the product, and only the product gates
   * the spinner. If it lands after the seed above, membership would be seeded as "belongs to
   * nothing" and — because seeding runs once — stay wrong for the whole session. Filled in here
   * instead, without dirtying the form, so Save still diffs against the real membership.
   *
   * Armed on the request having SETTLED, never on `collections.length > 0`. A workspace with no
   * collections yet never satisfies the length test, so this effect would stay live all session
   * and then fire on the merchant's FIRST create: the rail selects the new collection, the
   * `mutate(COLLECTIONS_KEY)` that follows makes the list non-empty, and this would overwrite
   * that selection with the server's membership — which is still empty, because nothing has been
   * saved yet. The selection would vanish with no message and Save would leave the product out.
   */
  useEffect(() => {
    if (mode !== 'edit' || !product || !seeded.current || seededMembership.current) return;
    if (!collectionsLoaded) return;
    const ids = membershipOf(product.id);
    baseline.current = { ...baseline.current, collectionIds: ids };
    setValue('collectionIds', ids, { shouldDirty: false });
    seededMembership.current = true;
  }, [collectionsLoaded, membershipOf, mode, product, setValue]);

  // ---------------------------------------------------------------- media pool

  // Memoised past the `?? []`: a fresh empty array per render would rebuild `variantMedia`
  // every time, and that prop reaches every row of the grid.
  const watchedMedia = useWatch({ control, name: 'media' });
  const media = useMemo(() => watchedMedia ?? [], [watchedMedia]);

  /**
   * The grid's thumbnails read a narrower shape than the pool tile. `url` here is the STILL to
   * draw — `posterOf` gives a video its poster frame, or `null` when there is none, which the
   * rows render as their `+` placeholder instead of a broken image.
   */
  const variantMedia = useMemo<VariantMediaItem[]>(
    () =>
      media.map((item) => ({
        id: item.id,
        url: posterOf(item),
        name: item.name,
        isVideo: item.type === 'video',
      })),
    [media],
  );

  /**
   * Create mode holds files as object URLs until the product exists (spec decision 3), so every
   * url minted here has to be released — a queued 4MB video otherwise stays alive for the rest of
   * the tab's life. The ref, not the form, is the list of what must be revoked: the cleanup runs
   * on unmount, when reading the form would be too late.
   */
  const objectUrls = useRef<string[]>([]);
  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = [];
    },
    [],
  );

  /**
   * Both, on purpose. The REF is the guard: it flips synchronously, so a second click landing in
   * the same tick as the first cannot slip past it the way a state read from a stale closure
   * would. The STATE is what `MediaSection` renders from — a guard the merchant cannot see just
   * makes their click look broken.
   */
  const mediaBusy = useRef(false);
  const [isMediaBusy, setIsMediaBusy] = useState(false);
  const markMediaBusy = useCallback((busy: boolean) => {
    mediaBusy.current = busy;
    setIsMediaBusy(busy);
  }, []);

  /** Drops a media id out of every variant that pointed at it. */
  const detachMediaFromVariants = useCallback(
    (mediaId: string) => {
      getValues('variants').forEach((variant, index) => {
        if (!variant.mediaIds.includes(mediaId)) return;
        setValue(
          `variants.${index}.mediaIds`,
          variant.mediaIds.filter((id) => id !== mediaId),
          { shouldDirty: true },
        );
      });
    },
    [getValues, setValue],
  );

  const handleAddMedia = useCallback(
    async (files: File[]) => {
      if (!canSubmit || !files.length || mediaBusy.current) return;

      if (mode === 'create') {
        // No product id yet, so nothing can be uploaded. Queue as object URLs; `useProductSave`
        // posts them in this exact order right after the product is created, which is what makes
        // index 0 the cover.
        const queued: EditorMedia[] = files.map((file) => {
          const url = URL.createObjectURL(file);
          objectUrls.current.push(url);
          return {
            id: `local-${crypto.randomUUID()}`,
            name: file.name,
            url,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            isPending: true,
            file,
          };
        });
        setValue('media', [...getValues('media'), ...queued], { shouldDirty: true });
        return;
      }

      if (!productId) return;
      markMediaBusy(true);
      try {
        // Sequential for the same reason the create-mode upload is: `position` is assigned in
        // arrival order, and position 0 is the product cover.
        for (const file of files) {
          const body = new FormData();
          body.append('file', file);
          await api.post(`/commerce/products/${productId}/media`, body, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        // Re-read rather than guess at what the upload minted: this is the only way to learn the
        // new ids, and it refreshes `position` after the server's own ordering.
        //
        // Through `mutate` rather than a bare `api.get`, so ONE request does both jobs: it
        // returns the fresh detail AND leaves it in the shared cache, so a remount seeds from a
        // detail that agrees with what the merchant is looking at.
        const refreshed = await mutate<IResponseMessage<CommerceProductDetail>>(
          productDetailKey(productId),
        );
        setValue('media', poolOf(refreshed?.data?.media ?? []), { shouldDirty: false });
      } catch {
        toast.error(t('Media.uploadError'));
      } finally {
        markMediaBusy(false);
      }
    },
    [canSubmit, getValues, markMediaBusy, mode, productId, setValue, t],
  );

  const handleRemoveMedia = useCallback(
    async (tile: EditorMedia) => {
      if (!canSubmit || mediaBusy.current) return;

      const drop = () => {
        // Read fresh rather than closing over the pool: an upload may have landed since.
        setValue(
          'media',
          getValues('media').filter((item) => item.id !== tile.id),
          { shouldDirty: true },
        );
        detachMediaFromVariants(tile.id);
      };

      if (tile.isPending) {
        URL.revokeObjectURL(tile.url);
        objectUrls.current = objectUrls.current.filter((url) => url !== tile.url);
        drop();
        return;
      }

      if (!productId) return;
      markMediaBusy(true);
      try {
        // Immediate, and deliberately OUTSIDE Save/Revert (spec decision 3): a variant media
        // picker can only point at a file that really exists, so the tile cannot be a promise.
        // The cost is that بازگردانی does not bring a deleted file back, which the design accepts.
        //
        // The tile stays in `values.media` until the DELETE resolves, and that ORDER matters. If
        // it were dropped optimistically and a Save ran before the request returned,
        // `useProductSave` would snapshot `preExistingMediaIds` without it while the refetched
        // detail still listed it — the extra row inflates `newRows` and trips `buildMediaIdMap`'s
        // count guard, which then silently drops every new photo's variant assignment.
        await api.delete(`/commerce/products/${productId}/media/${tile.id}`);
        drop();
        void mutate(productDetailKey(productId));
      } catch {
        toast.error(t('Media.deleteError'));
      } finally {
        markMediaBusy(false);
      }
    },
    [canSubmit, detachMediaFromVariants, getValues, markMediaBusy, productId, setValue, t],
  );

  const handleReorderMedia = useCallback(
    async (newOrder: EditorMedia[]) => {
      if (!canSubmit || mediaBusy.current) return;

      // Snapshot for rollback BEFORE the optimistic write below.
      const previous = getValues('media');

      // Optimistic: a drag needs instant feedback, unlike a button-triggered add/remove where a
      // brief busy state is acceptable. Create mode has nothing to persist yet (see decision in
      // the spec), so `shouldDirty: true` there matches how the initial queued files are marked
      // dirty; edit mode persists immediately, so it is not an "unsaved" change.
      setValue('media', newOrder, { shouldDirty: !productId });

      if (!productId) return;

      markMediaBusy(true);
      try {
        await api.patch(`/commerce/products/${productId}/media`, {
          mediaIds: newOrder.map((item) => item.id),
        });
        // Fire-and-forget, matching handleRemoveMedia: the order is already known locally, this
        // just keeps the shared SWR cache from going stale for any other consumer.
        void mutate(productDetailKey(productId));
      } catch {
        setValue('media', previous, { shouldDirty: false });
        toast.error(t('Media.reorderError'));
      } finally {
        markMediaBusy(false);
      }
    },
    [canSubmit, getValues, markMediaBusy, productId, setValue, t],
  );

  // ---------------------------------------------------------------- taxonomy creation

  /** One reporter for both create calls, so a backend code always reaches the merchant. */
  const reportCreateError = useCallback(
    (error: unknown) => {
      const code = errorCodeOf(error);
      toast.error(code ? t_ec(code) : t('Errors.createFailed'));
    },
    [t, t_ec],
  );

  const createCategory = useCallback(
    async (name: string, parentId: string | null) => {
      try {
        const { data } = await api.post<IResponseMessage<CommerceCategory>>(CATEGORIES_KEY, {
          name: name.trim(),
          parentId,
        });
        // Same key `useProductLoad` reads, so the picker redraws with the new branch.
        void mutate(CATEGORIES_KEY);
        const created = data?.data;
        return created?.id ? { id: created.id, name: created.name } : null;
      } catch (error) {
        reportCreateError(error);
        return null;
      }
    },
    [reportCreateError],
  );

  const createCollection = useCallback(
    async (name: string) => {
      try {
        const { data } = await api.post<IResponseMessage<CommerceCollectionListItem>>(
          COLLECTIONS_KEY,
          { name: name.trim() },
        );
        void mutate(COLLECTIONS_KEY);
        const created = data?.data;
        return created?.id ? { id: created.id, name: created.name } : null;
      } catch (error) {
        reportCreateError(error);
        return null;
      }
    },
    [reportCreateError],
  );

  // ---------------------------------------------------------------- dialogs

  const [confirm, setConfirm] = useState<EditorConfirm | null>(null);
  const [pickerTarget, setPickerTarget] = useState<VariantMediaTarget | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // ---------------------------------------------------------------- variant regeneration

  /**
   * Called by step ۷ after EVERY axis edit — add value, remove value, add axis, remove axis,
   * reorder. Deliberately an event handler and not an effect watching `options`: a deletion is
   * itself a change to `variants`, so an effect would regenerate the row the merchant just
   * removed and the delete button would look broken.
   */
  const handleAxisChange = useCallback(() => {
    const before = getValues('variants');
    const result = syncVariants();
    if (result.added > 0) {
      toast.success(tVariants('created', { count: formatCount(result.added) }));
    }
    if (result.capped) toast.error(tVariants('limitReached'));

    /**
     * Removing the LAST axis leaves no combinations to generate, so `syncVariants` empties the
     * grid — and an empty grid is a dead end: zod's `min(1)` blocks Save and there is no control
     * anywhere that adds a row back. A product with no axes has exactly one implicit variation
     * (the rule `buildEmptyProductForm` is built on), so it is restored here, carrying the
     * numbers off the row that was just dropped.
     *
     * `reset` and not `setValue`: only a reset re-syncs `useFieldArray`'s own snapshot, and the
     * keep-flags leave the merchant's dirty state and errors exactly where they were.
     *
     * The restored row is the DROPPED row with its selection emptied, not a blank one wearing its
     * price: `id`, `sku`, `weight`, the sale window and `isActive` have no control on this page
     * and `PUT` replaces the whole variants array, so rebuilding from scratch here would delete
     * the real variant and insert a stripped copy of it.
     */
    if (getValues('variants').length > 0) return;
    const donor = before[0];
    const [solo] = buildEmptyProductForm().variants;
    reset(
      { ...getValues(), variants: [donor ? { ...donor, valueIds: [] } : solo] },
      { keepDefaultValues: true, keepDirty: true, keepTouched: true, keepErrors: true },
    );
  }, [getValues, reset, syncVariants, tVariants]);

  // ---------------------------------------------------------------- submit

  const save = useProductSave(mode, productId, {
    onSaved: (detail) => {
      const values = seedFrom(detail);
      baseline.current = values;
      seededMembership.current = collectionsLoaded;
      resetSuppressed();
      // Turns this session's local keys into real ids. Without it a second Save asks the backend
      // to create the same options and variants all over again.
      reset(values);
    },
  });

  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  const onInvalid = useCallback(
    (errors: FieldErrors<ProductFormValues>) => {
      toast.error(t('Errors.invalid'));
      const path = firstErrorPath(errors);
      if (path) setFocusTarget({ path });
    },
    [t],
  );

  useEffect(() => {
    if (!focusTarget) return;
    /**
     * Two frames, not one. A collapsed group's inputs are not in the DOM at all, so `setFocus`
     * on them silently does nothing — and the group is opened by `VariantsSection`'s OWN effect
     * reacting to the same errors. The first frame gets past that state update, the second past
     * the render it schedules.
     */
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        setFocus(focusTarget.path, { shouldSelect: true });
        setFocusTarget(null);
      });
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [focusTarget, setFocus]);

  const submit = useMemo(
    () => handleSubmit(save.save, onInvalid),
    [handleSubmit, onInvalid, save.save],
  );

  const handleRevert = useCallback(() => {
    // The media pool is carried across the reset on purpose: in edit mode a drop is already
    // uploaded and a ✕ already deleted, so there is nothing here to undo (spec decision 3).
    resetSuppressed();
    reset({ ...baseline.current, media: getValues('media') });
    setFocusTarget(null);
    toast.success(t('Toast.reverted'));
  }, [getValues, reset, resetSuppressed, t]);

  // ---------------------------------------------------------------- derived

  const categoryId = useWatch({ control, name: 'categoryId' }) ?? null;

  /**
   * The display form of `categoryId` ("پوشاک › کفش ورزشی"). Resolved here rather than stored,
   * so the form never holds two representations of the same fact.
   *
   * The separator comes from `fa.json` rather than being a glyph in this file: which arrow reads
   * correctly is a per-locale decision (it points the other way in an RTL breadcrumb), and it is
   * not something a .tsx should be deciding.
   */
  const categoryPath = useMemo(() => {
    const node = categories.find((category) => category.id === categoryId);
    if (!node) return null;
    const parent = node.parentId
      ? categories.find((category) => category.id === node.parentId)
      : undefined;
    return parent ? `${parent.name}${t('Category.pathSeparator')}${node.name}` : node.name;
  }, [categories, categoryId, t]);

  const categoryTree = useMemo(() => mapCategoriesToTree(categories), [categories]);

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <EditorTopBarLive
        mode={mode}
        isSaving={save.isSaving}
        canSubmit={canSubmit}
        onPreview={() => setIsPreviewOpen(true)}
        onRevert={handleRevert}
        onSave={() => void submit()}
      />

      {/* The design's shell: one scrolling column of numbered steps plus a 308px rail that
          sticks below the header. Under the xl breakpoint the rail drops beneath the form — two
          columns, then one — rather than being squeezed; the collection list needs its width.
          The tall bottom padding leaves room for the floating bulk bar. */}
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-6 pt-5 pb-32 xl:grid-cols-[minmax(0,1fr)_308px]">
        <div className="flex min-w-0 flex-col gap-6">
          <TitleSection step={STEPS.title} />
          <DescriptionSection step={STEPS.description} />
          <CategorySection
            step={STEPS.category}
            categoryPath={categoryPath}
            onOpenPicker={() => setIsCategoryOpen(true)}
          />
          <MediaSection
            step={STEPS.media}
            productId={productId}
            media={media}
            isBusy={isMediaBusy}
            onAdd={(files) => void handleAddMedia(files)}
            onRemove={(item) => void handleRemoveMedia(item)}
            onReorder={(newOrder) => void handleReorderMedia(newOrder)}
          />

          {/* Price and stock sit side by side, exactly as the design draws them — they are two
              numbers about the same thing and stacking them wastes a full screen of height. */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <BasePriceSection step={STEPS.basePrice} />
            <BaseStockSection step={STEPS.baseStock} />
          </div>

          <AttributesSection
            step={STEPS.attributes}
            onConfirm={setConfirm}
            onAxisChange={handleAxisChange}
          />
          <SpecsSection step={STEPS.specs} />

          {/* The grid draws its own card, so the numbered heading is added here rather than
              inside it — `bare` is exactly what that is for. */}
          <EditorSection
            bare
            step={STEPS.variants}
            title={tVariants('heading')}
            hint={<VariantComboHint />}
          >
            <VariantsSection media={variantMedia} onOpenPicker={setPickerTarget} />
          </EditorSection>
        </div>

        <aside
          aria-label={t('Rail.label')}
          className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:sticky xl:top-24 xl:grid-cols-1"
        >
          <CollectionsPanel collections={collections} onCreate={createCollection} />
          <TagsPanel pool={tagPool} />
        </aside>
      </div>

      {/* All four dialogs live here, not inside the sections that open them: the media picker is
          opened from a leaf row AND from a group header AND from the bulk bar, and the confirm
          is raised from several places. One host, one piece of state each. */}
      <CategoryPickerDialog
        open={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        tree={categoryTree}
        onCreateCategory={(name) => createCategory(name, null)}
        onCreateSub={(parentId, name) => createCategory(name, parentId)}
      />

      {/* These two are MOUNTED ONLY WHILE OPEN. Both subscribe to the whole form (the preview
          reads every field; the picker reads `variants`), so leaving them mounted would re-render
          a dialog nobody can see on every keystroke in a 2000-row grid. Both already re-seed
          themselves on open, so a fresh mount is the same state they would have had. */}
      {pickerTarget && (
        <VariantMediaPickerDialog target={pickerTarget} onClose={() => setPickerTarget(null)} />
      )}
      {isPreviewOpen && <PreviewDialog open onClose={() => setIsPreviewOpen(false)} />}

      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
    </form>
  );
};

/**
 * The top bar reads the live title and counts unpriced rows. Its own component so those two
 * subscriptions re-render a header, not the whole editor — a price keystroke in row 900 must not
 * touch the other 1999 rows.
 */
const EditorTopBarLive = ({
  mode,
  isSaving,
  canSubmit,
  onPreview,
  onRevert,
  onSave,
}: {
  mode: 'create' | 'edit';
  isSaving: boolean;
  canSubmit: boolean;
  onPreview: () => void;
  onRevert: () => void;
  onSave: () => void;
}) => {
  const { control } = useFormContext<ProductFormValues>();
  const title = useWatch({ control, name: 'title' }) ?? '';
  const variants = useWatch({ control, name: 'variants' }) ?? [];

  return (
    <EditorTopBar
      mode={mode}
      title={title}
      unpricedCount={variants.filter((variant) => variant.price == null).length}
      isSaving={isSaving}
      canSubmit={canSubmit}
      onPreview={onPreview}
      onRevert={onRevert}
      onSave={onSave}
    />
  );
};

/** "۲ × ۳ = ۶ ترکیب ممکن". Watches `options`, so it re-renders alone as axes are typed. */
const VariantComboHint = () => {
  const t = useTranslations('Commerce.Editor.Variants');
  const { control } = useFormContext<ProductFormValues>();
  const options = useWatch({ control, name: 'options' }) ?? [];

  const axes = options.filter((option) => option.values.length > 0);
  if (!axes.length) return <>{t('comboNone')}</>;

  const factor = axes.map((axis) => formatCount(axis.values.length)).join(' × ');
  const count = axes.reduce((total, axis) => total * axis.values.length, 1);
  return <>{t('comboLabel', { factor, count: formatCount(count) })}</>;
};
