'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';

import type { ProductFormValues } from '../productEditor.schema';
import { EditorSection } from '../ui/EditorSection';

/**
 * Step ۳ — the category.
 *
 * `categoryId` is form data and is watched from context like everything else. `categoryPath` is
 * NOT: it is the display form of that id ("پوشاک › کفش ورزشی"), resolved by the page against the
 * category tree it already loaded. Storing the path in the form would mean the form holding two
 * representations of the same fact, which then have to be kept in step.
 */
export const CategorySection = ({
  step = 3,
  categoryPath,
  onOpenPicker,
}: {
  step?: number;
  categoryPath: string | null;
  onOpenPicker: () => void;
}) => {
  const t = useTranslations('Commerce.Editor.Category');
  const {
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();
  const categoryId = useWatch({ control, name: 'categoryId' });

  const chosen = Boolean(categoryId);

  return (
    <EditorSection step={step} title={t('title')} cardClassName="flex flex-wrap items-center gap-3">
      <div className="min-w-[220px] flex-1" data-bad={errors.categoryId ? 'empty' : undefined}>
        <div className="text-sm font-bold" data-testid="category-path">
          {chosen ? (categoryPath ?? '—') : t('none')}
        </div>
        <p className={cn('mt-1 text-xs', errors.categoryId ? 'text-dtext' : 'text-mut')}>
          {errors.categoryId?.message ?? t('hint')}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenPicker}
        className="border-lnv bg-card text-primary hover:bg-tint h-[38px] rounded-lg border px-3.5 text-sm font-bold transition-colors"
      >
        {chosen ? t('change') : t('choose')}
      </button>
    </EditorSection>
  );
};
