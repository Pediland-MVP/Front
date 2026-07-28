'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { PlusIcon, XIcon } from 'lucide-react';

import type { ProductFormValues } from '../productEditor.schema';
import {
  editorAddButton,
  editorCard,
  editorEmptyBox,
  editorIconButtonDanger,
  editorInputGhost,
  editorInputSm,
  editorSubBox,
} from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';

/**
 * Step ۸ — the spec sheet: purely descriptive title/body pairs (جنس، کشور سازنده، گارانتی).
 *
 * Deliberately NOT the same thing as step ۷. An option axis multiplies into variation rows and a
 * buyer picks from it; a spec is text on the page. Merging them is the mistake that produces a
 * "کشور سازنده" dropdown with one choice.
 *
 * Both inputs are `register`-ed, so typing in a spec re-renders nothing — no confirmation is
 * needed to delete a row either, because nothing downstream depends on it.
 */
export const SpecsSection = ({ step = 8 }: { step?: number }) => {
  const t = useTranslations('Commerce.Editor.Specs');
  const { control, register } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'specs' });

  return (
    <EditorSection bare step={step} title={t('title')} hint={t('hint')}>
      <div className={editorCard}>
        <div className="flex flex-col gap-2.5 p-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              data-testid={`spec-${index}`}
              className={`${editorSubBox} flex flex-col gap-2`}
            >
              <div className="flex items-center gap-1.5">
                <input
                  {...register(`specs.${index}.title`)}
                  aria-label={t('titlePlaceholder')}
                  placeholder={t('titlePlaceholder')}
                  className={editorInputGhost}
                />
                <button
                  type="button"
                  aria-label={t('removeSpec')}
                  onClick={() => remove(index)}
                  className={editorIconButtonDanger}
                >
                  <XIcon className="size-3" />
                </button>
              </div>
              <input
                {...register(`specs.${index}.body`)}
                aria-label={t('bodyPlaceholder')}
                placeholder={t('bodyPlaceholder')}
                className={editorInputSm}
              />
            </div>
          ))}

          {fields.length === 0 && (
            <div className={editorEmptyBox}>
              <div className="mb-1 text-sm font-bold">{t('empty')}</div>
              <p className="text-mut m-0 text-xs text-pretty">{t('emptyHint')}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => append({ title: '', body: '' })}
            className={editorAddButton}
          >
            <PlusIcon className="size-3" />
            {t('addSpec')}
          </button>
        </div>
      </div>
    </EditorSection>
  );
};
