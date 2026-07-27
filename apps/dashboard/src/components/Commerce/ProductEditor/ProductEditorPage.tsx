'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm, type FieldNamesMarkedBoolean } from 'react-hook-form';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';

import api from '@/hooks/swr/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import type { CommerceProductDetail } from '@/types/commerce';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import type { IResponseMessage } from '@/types/responseMessage';

import { Button, Form } from '@/components/ui';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { NoDataError } from '@/components/Global/NoDataError';

import { EditorScrollspyNav, type EditorSectionId } from './EditorScrollspyNav';
import {
  buildEmptyProductFormValues,
  buildProductFormSchema,
  mapProductDetailToFormValues,
  type ProductFormValues,
} from './productForm.schema';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { CollectionsSection } from './sections/CollectionsSection';
import { TagsSection } from './sections/TagsSection';
import { SpecsSection } from './sections/SpecsSection';
import { InventorySection } from './sections/InventorySection';
import { MediaSection } from './sections/MediaSection';
import { ShippingSection } from './sections/ShippingSection';
import { VariantsSection } from './sections/VariantsSection';

interface ProductEditorPageProps {
  mode: 'create' | 'edit';
  productId?: string;
}

const MOBILE_MEDIA_QUERY = '(max-width: 900px)';

// Six section ids, in the order the design spec lists them. As of Task 8, every section has
// its real content wired in below — `org` (Categories & collections) renders
// `CollectionsSection`, which handles collection MEMBERSHIP only; category assignment is the
// single `categoryId` field already handled by `BasicInfoSection` (spec correction).
const SECTION_IDS: EditorSectionId[] = [
  'basic',
  'media',
  'variants',
  'inventory',
  'org',
  'shipping',
];

const buildOptionsPayload = (options: ProductFormValues['options']) =>
  options.map((option) => ({
    ...(option.id && { id: option.id }),
    name: option.name,
    style: option.style,
    values: option.values.map((value) => ({
      ...(value.id && { id: value.id }),
      value: value.value,
      ...(value.colorHex && { colorHex: value.colorHex }),
    })),
  }));

const buildVariantsPayload = (variants: ProductFormValues['variants']) =>
  variants.map((variant) => ({
    ...(variant.id && { id: variant.id }),
    valueIndexes: variant.valueIndexes,
    ...(variant.sku && { sku: variant.sku }),
    price: variant.price,
    ...(variant.compareAtPrice !== undefined && { compareAtPrice: variant.compareAtPrice }),
    ...(variant.salePrice !== undefined && { salePrice: variant.salePrice }),
    ...(variant.saleStartsAt && { saleStartsAt: variant.saleStartsAt }),
    ...(variant.saleEndsAt && { saleEndsAt: variant.saleEndsAt }),
    isActive: variant.isActive,
    trackInventory: variant.trackInventory,
    allowBackorder: variant.allowBackorder,
    ...(variant.weight !== undefined && { weight: variant.weight }),
    ...(variant.initialStock !== undefined && { initialStock: variant.initialStock }),
  }));

/**
 * `POST /commerce/products` requires the full nested payload in one call — `options`/
 * `variants` are ALWAYS included. The backend rejects an empty `variants[]`
 * (`COMMERCE_INVALID_SELECTION`); this task's create-mode defaults
 * (`buildEmptyProductFormValues`) already provide the empty-safe single "base" variant, so a
 * brand-new product can be saved from just Basic Info + Shipping. Tasks 4-8 build the real
 * options/variants editing UI on top of the same form state — this function keeps working
 * unchanged once that UI starts writing real values into the form.
 */
const buildCreatePayload = (values: ProductFormValues) => ({
  title: values.title,
  description: values.description,
  status: values.status,
  kind: values.kind,
  ...(values.categoryId && { categoryId: values.categoryId }),
  // Written into the join table inside the same transaction as the product — a product being
  // created has no id, so it cannot use the collection-side `PUT /commerce/collections/:id`.
  ...(values.collectionIds.length > 0 && { collectionIds: values.collectionIds }),
  // Always sent, including empty: the backend treats an absent key as "leave unchanged", and on
  // create there is nothing to leave. `basePrice`/`baseCompare`/`baseStock` are deliberately
  // NOT sent — they are editor-only seeds that already landed on the variants.
  tags: values.tags,
  specs: values.specs,
  shippingCost: values.shippingCost,
  options: buildOptionsPayload(values.options),
  variants: buildVariantsPayload(values.variants),
});

/**
 * `PUT /commerce/products/:id` only sends `options`/`variants` when the form's
 * `dirtyFields` shows they were actually touched — the backend treats a missing
 * `options`/`variants` key as "leave unchanged" (see Back's
 * `product.service.ts#updateProduct`), so a product whose Variants section was never opened
 * never risks a spurious round-trip of data this task didn't touch. Task 5's `VariantsSection`
 * is the only UI that writes into `options`/`variants` via `useFieldArray`, and every write
 * through `useFieldArray`/`setValue` marks `dirtyFields.options`/`dirtyFields.variants`, so
 * this check is accurate in both directions. `categoryId` is sent as-is (including `null`)
 * because the backend supports an explicit `null` to clear an existing category — omitting it
 * here would make "remove category" impossible from Basic Info.
 */
const buildUpdatePayload = (
  values: ProductFormValues,
  dirtyFields: FieldNamesMarkedBoolean<ProductFormValues>,
) => ({
  title: values.title,
  description: values.description,
  status: values.status,
  kind: values.kind,
  categoryId: values.categoryId,
  // Same dirty-gating as options/variants: an absent key means "leave unchanged" server-side,
  // so a product whose Tags/Specs section was never opened never round-trips that data.
  ...(dirtyFields.tags && { tags: values.tags }),
  ...(dirtyFields.specs && { specs: values.specs }),
  shippingCost: values.shippingCost,
  ...(dirtyFields.options && { options: buildOptionsPayload(values.options) }),
  ...(dirtyFields.variants && { variants: buildVariantsPayload(values.variants) }),
});

export const ProductEditorPage = ({ mode, productId }: ProductEditorPageProps) => {
  const t = useTranslations('Commerce.Editor');
  const t_ec = useTranslations('ERROR_CODES');
  const router = useRouter();
  const { can } = usePermissions();

  const canSubmit = mode === 'create' ? can('product:create') : can('product:edit');

  const shouldFetch = mode === 'edit' && !!productId;
  const {
    data: productResponse,
    error: productError,
    isLoading: isProductLoading,
  } = useSWRImmutable<IResponseMessage<CommerceProductDetail>>(
    shouldFetch ? `/commerce/products/${productId}` : null,
  );
  const product = productResponse?.data;

  const schema = useMemo(() => buildProductFormSchema(t), [t]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildEmptyProductFormValues(),
  });

  // `useSWRImmutable` can still re-deliver a fresh `product` object on revalidation (e.g. tab
  // refocus elsewhere mutating the same key) — only seed the form once, so a later
  // revalidation never clobbers in-progress, unsaved edits.
  const hasSeededForm = useRef(false);
  useEffect(() => {
    if (mode === 'edit' && product && !hasSeededForm.current) {
      form.reset(mapProductDetailToFormValues(product));
      hasSeededForm.current = true;
    }
  }, [mode, product, form]);

  const sections = useMemo(() => SECTION_IDS.map((id) => ({ id, label: t(`Nav.${id}`) })), [t]);

  const sectionRefs = useRef<Partial<Record<EditorSectionId, HTMLElement | null>>>({});
  const [activeSection, setActiveSection] = useState<EditorSectionId>('basic');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Create mode: files picked before the product exists. Held here (not in the form) so the
  // zod schema stays serialisable, and uploaded by `uploadPendingMedia` once we have an id.
  const [pendingMedia, setPendingMedia] = useState<File[]>([]);

  /**
   * Uploads the create-mode media queue against the freshly created product, in array order
   * so index 0 becomes `position` 0 (the cover). Sequential on purpose: the endpoint takes one
   * file per call and positions are assigned server-side in arrival order, so firing these in
   * parallel would make the cover non-deterministic.
   *
   * Returns the number that failed. A failure here does NOT fail the create — the product is
   * already committed, so we surface a partial-success toast and still navigate to the editor,
   * where the user can retry the upload against the now-existing product.
   */
  const uploadPendingMedia = async (newProductId: string, files: File[]): Promise<number> => {
    let failed = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await api.post(`/commerce/products/${newProductId}/media`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        failed += 1;
      }
    }
    return failed;
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const payload = buildCreatePayload(values);
        const { data } = await api.post<IResponseMessage<{ id: string }>>(
          '/commerce/products',
          payload,
        );
        const newProductId = data.data.id;

        const failedUploads = pendingMedia.length
          ? await uploadPendingMedia(newProductId, pendingMedia)
          : 0;
        if (failedUploads > 0) {
          // The product itself saved — only some files did not. Say so explicitly rather than
          // showing a plain success, so the user knows to retry in the editor.
          toast.warning(t('Toast.createdWithMediaErrors', { count: failedUploads }));
        } else {
          toast.success(t('Toast.created'));
        }
        setPendingMedia([]);

        await mutate(mutateIncludeStringKey('/commerce/products'));
        router.push(`/products/${newProductId}`);
      } else if (productId) {
        const payload = buildUpdatePayload(values, form.formState.dirtyFields);
        await api.put(`/commerce/products/${productId}`, payload);
        toast.success(t('Toast.updated'));
        await mutate(mutateIncludeStringKey('/commerce/products'));
        router.push(`/products/${productId}`);
      }
    } catch (error) {
      const code = isAxiosError(error)
        ? (error.response?.data as ExceptionMessage | undefined)?.code
        : undefined;

      if (code === 'COMMERCE_KIND_LOCKED') {
        toast.error(t('Errors.kindLocked'));
      } else if (code) {
        toast.error(t_ec(code));
      } else {
        toast.error(t('Errors.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (shouldFetch && isProductLoading) {
    return <LoaderSpin />;
  }

  if (shouldFetch && productError) {
    return <NoDataError />;
  }

  const registerSectionRef = (id: EditorSectionId) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  };

  const renderSectionContent = (id: EditorSectionId) => {
    if (id === 'basic') {
      return (
        <div className="flex flex-col gap-5">
          <BasicInfoSection />
          {/* Specs are product FACTS, so they belong with the basic info rather than with the
              buyer-facing form fields they are easily confused with. */}
          <SpecsSection mode={mode} />
        </div>
      );
    }
    if (id === 'shipping') return <ShippingSection />;
    if (id === 'media') {
      return (
        <MediaSection
          mode={mode}
          productId={productId}
          media={product?.media ?? []}
          pendingFiles={pendingMedia}
          onPendingFilesChange={setPendingMedia}
        />
      );
    }
    if (id === 'variants') {
      return (
        <VariantsSection
          mode={mode}
          productId={productId}
          media={product?.media ?? []}
          existingVariants={product?.variants ?? []}
        />
      );
    }
    if (id === 'inventory') {
      return (
        <InventorySection
          mode={mode}
          productId={productId}
          existingVariants={product?.variants ?? []}
        />
      );
    }
    // `org` was the last section still on the generic placeholder card — every `EditorSectionId`
    // is now handled above, so this branch (and the fallback below it) is exhaustive.
    return (
      <div className="flex flex-col gap-5">
        <CollectionsSection mode={mode} productId={productId} />
        <TagsSection mode={mode} />
      </div>
    );
  };

  const cancelHref = mode === 'edit' && productId ? `/products/${productId}` : '/products';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-5">
        <div
          className={cn('flex flex-1 flex-col gap-5', !isMobile && 'flex-row items-start gap-6')}
        >
          <EditorScrollspyNav
            sections={sections}
            sectionRefs={sectionRefs}
            activeSection={activeSection}
            onSelect={setActiveSection}
            isMobile={isMobile}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-5">
            {SECTION_IDS.filter((id) => !isMobile || id === activeSection).map((id) => (
              <div key={id} ref={registerSectionRef(id)} className="scroll-mt-24">
                {renderSectionContent(id)}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-2 border-t px-4 py-3 md:-mx-5">
          <ButtonLoading type="submit" isLoading={isSubmitting} disabled={!canSubmit}>
            {t('SaveBar.save')}
          </ButtonLoading>
          <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
            {t('SaveBar.cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
