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

import { Button, Card, CardContent, CardHeader, CardTitle, Form } from '@/components/ui';
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
import { MediaSection } from './sections/MediaSection';
import { ShippingSection } from './sections/ShippingSection';
import { VariantsSection } from './sections/VariantsSection';

interface ProductEditorPageProps {
  mode: 'create' | 'edit';
  productId?: string;
}

const MOBILE_MEDIA_QUERY = '(max-width: 900px)';

// Six section ids, in the order the design spec lists them. Only `basic`/`shipping` render
// real content in this task — the rest are placeholders Tasks 4/5/6/7/8 fill in, so the
// scrollspy/nav mechanism is provable end-to-end before those tasks start.
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

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const payload = buildCreatePayload(values);
        const { data } = await api.post<IResponseMessage<{ id: string }>>(
          '/commerce/products',
          payload,
        );
        toast.success(t('Toast.created'));
        await mutate(mutateIncludeStringKey('/commerce/products'));
        router.push(`/products/${data.data.id}`);
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
    if (id === 'basic') return <BasicInfoSection />;
    if (id === 'shipping') return <ShippingSection />;
    if (id === 'media') {
      return <MediaSection mode={mode} productId={productId} media={product?.media ?? []} />;
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

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t(`Nav.${id}`)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t('placeholderNotice')}</p>
        </CardContent>
      </Card>
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
