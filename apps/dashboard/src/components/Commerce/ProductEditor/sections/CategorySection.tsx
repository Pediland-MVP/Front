'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import useSWRImmutable from 'swr/immutable';

import type { CommerceCategory, PaginatedResult } from '@/types/commerce';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';

import { CategoryPickerDialog, CATEGORIES_KEY } from '../CategoryPickerDialog';
import { EditorSection } from '../ui/EditorSection';
import type { ProductFormValues } from '../productForm.schema';

/**
 * Step 3 — where the product sits in the catalogue.
 *
 * The design shows category as a one-line summary plus a button that opens a picker, rather than
 * a `<select>`: a real workspace has a two-level tree, and a flat option list loses the parent
 * that gives a subcategory its meaning ("کتانی" under "کفش" vs under "لباس بچه").
 *
 * `status` and `kind` ride along here. The design has no home for them — its header shows status
 * as a read-only badge — but both are real, saved fields, so they keep an explicit control
 * instead of being silently dropped in a restyle.
 */
export const CategorySection = ({ step }: { step: number }) => {
  const t = useTranslations('Commerce.Editor');
  const tc = useTranslations('Commerce.Editor.Category');
  const form = useFormContext<ProductFormValues>();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const variants = useWatch({ control: form.control, name: 'variants' });
  // Design spec: `kind` should lock once the product has ≥1 order line — the frontend can't
  // know that without an extra round-trip, so v1 disables `kind` whenever we're editing an
  // existing product at all (every fetched product already has ≥1 saved variant, i.e. a
  // variant with a real `id` — the backend never allows a product to have zero live
  // variants). The backend's `COMMERCE_KIND_LOCKED` error remains the fallback for the narrow
  // race where a product had 0 order lines at page-load but gets its first order before save.
  const isKindLocked = (variants ?? []).some((variant) => Boolean(variant.id));

  const { data: categoriesData } =
    useSWRImmutable<PaginatedResult<CommerceCategory[]>>(CATEGORIES_KEY);
  const categories = useMemo(() => categoriesData?.items ?? [], [categoriesData]);

  const categoryId = useWatch({ control: form.control, name: 'categoryId' });
  const selected = categories.find((category) => category.id === categoryId);
  // Shown as "کفش / کتانی" so a subcategory is never ambiguous about which parent it belongs to.
  const categoryPath = useMemo(() => {
    if (!selected) return null;
    const parent = selected.parentId
      ? categories.find((category) => category.id === selected.parentId)
      : undefined;
    return parent ? `${parent.name} / ${selected.name}` : selected.name;
  }, [selected, categories]);

  return (
    <EditorSection step={step} title={tc('title')}>
      <div className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[200px] flex-1">
                  <div className="text-sm font-bold">{categoryPath ?? tc('none')}</div>
                  <p className="text-mut mt-1 text-xs">
                    {categoryPath ? tc('hintSelected') : tc('hintEmpty')}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="category-open-picker"
                  onClick={() => setIsPickerOpen(true)}
                  className="border-lnv bg-card text-primary hover:bg-tint h-[38px] flex-none rounded-lg border px-3.5 text-sm font-bold transition-colors"
                >
                  {categoryPath ? tc('change') : tc('choose')}
                </button>
              </div>
              <FormMessage />

              <CategoryPickerDialog
                open={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                categories={categories}
                value={field.value}
                onChange={field.onChange}
              />
            </FormItem>
          )}
        />

        <div className="border-lnv grid gap-4 border-t pt-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-mut text-xs font-bold">{t('Basic.status')}</FormLabel>
                <FormControl>
                  <Select dir="rtl" value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('Basic.StatusOptions.draft')}</SelectItem>
                      <SelectItem value="active">{t('Basic.StatusOptions.active')}</SelectItem>
                      <SelectItem value="archived">{t('Basic.StatusOptions.archived')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-mut text-xs font-bold">{t('Basic.kind')}</FormLabel>
                <FormControl>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Select
                          dir="rtl"
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isKindLocked}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="physical">
                              {t('Basic.KindOptions.physical')}
                            </SelectItem>
                            <SelectItem value="digital">
                              {t('Basic.KindOptions.digital')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    {isKindLocked && (
                      <TooltipContent>{t('Basic.kindLockedTooltip')}</TooltipContent>
                    )}
                  </Tooltip>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </EditorSection>
  );
};
