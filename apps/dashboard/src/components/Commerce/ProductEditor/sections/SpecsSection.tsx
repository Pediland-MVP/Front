'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { PlusIcon, XIcon } from 'lucide-react';

import { usePermissions } from '@/hooks/usePermissions';

import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui';

import { EditorSection } from '../ui/EditorSection';
import {
  editorAddButton,
  editorEmptyBox,
  editorIconButtonDanger,
  editorInputSm,
  editorInputGhost,
  editorSubBox,
} from '../ui/editorChrome';
import type { ProductFormValues } from '../productForm.schema';

/** Mirrors the backend's `@ArrayMaxSize(50)` on `specs` so the UI refuses before the API does. */
const SPEC_LIMIT = 50;

/**
 * Static product facts shown to the buyer — "جنس رویه: مش تنفسی".
 *
 * Not to be confused with `CommerceProductField`, which is the buyer's *input* form on the
 * product page. These are ordered `{title, body}` pairs stored as jsonb on the product, because
 * they are only ever read whole with it — never filtered, searched or joined.
 */
export const SpecsSection = ({ step, mode }: { step: number; mode: 'create' | 'edit' }) => {
  const t = useTranslations('Commerce.Editor.Specs');
  const { can } = usePermissions();
  const canEdit = can(mode === 'create' ? 'product:create' : 'product:edit');
  const { control } = useFormContext<ProductFormValues>();

  const specs = useFieldArray({ control, name: 'specs', keyName: '_sid' });

  return (
    <EditorSection step={step} title={t('title')} hint={t('description')} cardClassName="p-3">
      <div className="flex flex-col gap-2.5">
        {specs.fields.length === 0 && (
          <div className={editorEmptyBox}>
            <div className="mb-1 text-sm font-bold">{t('empty')}</div>
            <p className="text-mut m-0 text-xs text-pretty">{t('emptyHint')}</p>
          </div>
        )}

        {specs.fields.map((row, index) => (
          <div key={row._sid} className={`${editorSubBox} flex flex-col gap-2`}>
            <div className="flex items-center gap-1.5">
              <FormField
                control={control}
                name={`specs.${index}.title`}
                render={({ field }) => (
                  <FormItem className="min-w-0 flex-1 space-y-0">
                    <FormControl>
                      <input
                        {...field}
                        disabled={!canEdit}
                        data-testid={`spec-title-${index}`}
                        aria-label={t('titlePlaceholder')}
                        placeholder={t('titlePlaceholder')}
                        className={editorInputGhost}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {canEdit && (
                <button
                  type="button"
                  aria-label={t('remove')}
                  data-testid={`spec-remove-${index}`}
                  onClick={() => specs.remove(index)}
                  className={editorIconButtonDanger}
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            <FormField
              control={control}
              name={`specs.${index}.body`}
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <input
                      {...field}
                      disabled={!canEdit}
                      data-testid={`spec-body-${index}`}
                      aria-label={t('bodyPlaceholder')}
                      placeholder={t('bodyPlaceholder')}
                      className={editorInputSm}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}

        {canEdit && (
          <button
            type="button"
            data-testid="spec-add"
            // Capped to match the backend's ArrayMaxSize(50): better a disabled button than a
            // 400 after the merchant has typed the 51st row.
            disabled={specs.fields.length >= SPEC_LIMIT}
            onClick={() => specs.append({ title: '', body: '' })}
            className={editorAddButton}
          >
            <PlusIcon className="size-3.5" />
            {t('add')}
          </button>
        )}
      </div>
    </EditorSection>
  );
};
