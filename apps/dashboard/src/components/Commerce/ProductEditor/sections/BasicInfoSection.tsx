'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import useSWRImmutable from 'swr/immutable';

import type { CommerceCategory, CommerceCategoryNode, PaginatedResult } from '@/types/commerce';
import { buildCategoryTree } from '@/utils/commerce/buildCategoryTree';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';

import type { ProductFormValues } from '../productForm.schema';

const NO_CATEGORY_VALUE = 'none';

interface CategoryOption {
  id: string;
  label: string;
  depth: number;
}

const flattenCategoryTree = (nodes: CommerceCategoryNode[], depth = 0): CategoryOption[] =>
  nodes.flatMap((node) => [
    { id: node.id, label: node.name, depth },
    ...flattenCategoryTree(node.children, depth + 1),
  ]);

export const BasicInfoSection = () => {
  const t = useTranslations('Commerce.Editor');
  const form = useFormContext<ProductFormValues>();

  const variants = useWatch({ control: form.control, name: 'variants' });
  // Design spec: `kind` should lock once the product has ≥1 order line — the frontend can't
  // know that without an extra round-trip, so v1 disables `kind` whenever we're editing an
  // existing product at all (every fetched product already has ≥1 saved variant, i.e. a
  // variant with a real `id` — the backend never allows a product to have zero live
  // variants). The backend's `COMMERCE_KIND_LOCKED` error remains the fallback for the narrow
  // race where a product had 0 order lines at page-load but gets its first order before save.
  const isKindLocked = (variants ?? []).some((variant) => Boolean(variant.id));

  const { data: categoriesData } =
    useSWRImmutable<PaginatedResult<CommerceCategory[]>>('/commerce/categories');
  const categoryOptions = useMemo(
    () => flattenCategoryTree(buildCategoryTree(categoriesData?.items ?? [])),
    [categoriesData],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Nav.basic')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Basic.title')}</FormLabel>
              <FormControl>
                <Input maxLength={255} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Basic.description')}</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Basic.status')}</FormLabel>
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
                <FormLabel>{t('Basic.kind')}</FormLabel>
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

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Basic.category')}</FormLabel>
              <FormControl>
                <Select
                  dir="rtl"
                  value={field.value ?? NO_CATEGORY_VALUE}
                  onValueChange={(value) =>
                    field.onChange(value === NO_CATEGORY_VALUE ? null : value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('Basic.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY_VALUE}>{t('Basic.categoryNone')}</SelectItem>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {'  '.repeat(option.depth)}
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
