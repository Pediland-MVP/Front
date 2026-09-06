'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { FileDigitIcon, PackageIcon, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ProductFormValues } from '../productEditor.schema';
import { EditorSection } from '../ui/EditorSection';

const KIND_OPTIONS: Array<{ value: ProductFormValues['kind']; Icon: LucideIcon }> = [
  { value: 'physical', Icon: PackageIcon },
  { value: 'digital', Icon: FileDigitIcon },
];

/**
 * Step ۱ — physical vs digital. Chosen once via `ChooseProductKindDialog` on create, but the
 * backend allows changing it later too (`ProductService.updateProduct`) -- until the product has
 * its first order line, at which point it answers `COMMERCE_KIND_LOCKED` and `useProductSave`
 * already turns that into `Errors.kindLocked`. No "locked" state is computed here on purpose:
 * `CommerceProductDetail` carries no such flag, so the switch always renders enabled and the
 * save error is the single source of truth for "too late to change".
 */
export const ProductKindSection = ({ step }: { step: number }) => {
  const t = useTranslations('Commerce.Editor.Kind');
  const { watch, setValue } = useFormContext<ProductFormValues>();
  const kind = watch('kind');

  return (
    <EditorSection step={step} title={t('title')}>
      <div className="grid grid-cols-2 gap-3">
        {KIND_OPTIONS.map(({ value, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue('kind', value, { shouldDirty: true })}
            aria-pressed={kind === value}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-colors',
              kind === value
                ? 'border-primary bg-tint2 text-primary'
                : 'border-lnv text-muted-foreground hover:border-primary/40',
            )}
          >
            <Icon className="size-6" />
            {t(value)}
          </button>
        ))}
      </div>
      <p className="text-mut mt-2 text-xs">{t('hint')}</p>
    </EditorSection>
  );
};
