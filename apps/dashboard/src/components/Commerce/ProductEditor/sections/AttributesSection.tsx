'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import type { ProductFormValues } from '../productEditor.schema';
import {
  editorAddButton,
  editorAddButtonSm,
  editorCard,
  editorChip,
  editorEmptyBox,
  editorIconButton,
  editorIconButtonDanger,
  editorInputGhost,
  editorInputSm,
  editorSubBox,
} from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';

/** Mirrors `@ArrayMaxSize(3)` on the backend's `options` — the add button disables at three. */
export const MAX_ATTRS = 3;

/** A destructive action the page must confirm before it runs. */
export interface EditorConfirm {
  title: string;
  body: string;
  ok: string;
  run: () => void;
}

/**
 * Step ۷ — the option axes.
 *
 * This section owns the axes; step ۹ owns the rows they imply. It never touches `variants`
 * itself — it mutates `options` and lets `useVariantSync` diff the result — but it DOES decide
 * when a mutation is destructive enough to need a confirmation, because it is the only place that
 * knows a value is about to disappear.
 *
 * Confirmation is dispatched through `onConfirm` rather than rendered here. A dialog opened from
 * inside a repeated row unmounts with the row it belongs to, which is exactly what happens when
 * the merchant confirms — the page hosts the single dialog instead.
 */
export const AttributesSection = ({
  step = 7,
  onConfirm,
}: {
  step?: number;
  onConfirm: (confirm: EditorConfirm) => void;
}) => {
  const t = useTranslations('Commerce.Editor.Attributes');
  const { control, register, getValues, setValue } = useFormContext<ProductFormValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'options' });

  // `useFieldArray`'s `fields` is a SNAPSHOT, refreshed only when the array's own shape changes —
  // it does not see a `setValue` into `options.N.values`. The chips render off this live watch.
  const options = useWatch({ control, name: 'options' }) ?? [];
  const variantCount = (useWatch({ control, name: 'variants' }) ?? []).length;

  /** One draft string per axis, keyed by the field-array id. UI state, never form data. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const addValues = (index: number, fieldId: string) => {
    const raw = drafts[fieldId] ?? '';
    // A comma splits — latin `,` or Persian `،` — so "قرمز، آبی, سبز" lands as three values in
    // one go. The design promises this in its own hint copy and then does not implement it.
    const parts = raw
      .split(/[,،]/)
      .map((part) => part.trim())
      .filter(Boolean);

    setDrafts((prev) => ({ ...prev, [fieldId]: '' }));
    if (!parts.length) return;

    const current = getValues(`options.${index}.values`) ?? [];
    const seen = new Set(current.map((value) => value.value));
    const fresh = parts
      .filter((part) => !seen.has(part))
      .map((part) => ({
        // `localKey` is what `variants[].valueIds` points at for a value created this session —
        // the backend id does not exist until Save, and the variation rows need an identity now.
        localKey: crypto.randomUUID(),
        value: part,
      }));
    if (!fresh.length) return;

    setValue(`options.${index}.values`, [...current, ...fresh], { shouldDirty: true });
  };

  const removeValue = (index: number, localKey: string, label: string) => {
    const drop = () => {
      const current = getValues(`options.${index}.values`) ?? [];
      setValue(
        `options.${index}.values`,
        current.filter((value) => value.localKey !== localKey),
        { shouldDirty: true },
      );
    };

    // Only ask when there is something to lose. On a product with no rows yet this is a free edit
    // and a confirm dialog would just be in the way.
    if (variantCount > 0) {
      onConfirm({
        title: t('confirmValueTitle'),
        body: t('confirmValueBody', { value: label }),
        ok: t('confirmRemove'),
        run: drop,
      });
      return;
    }
    drop();
  };

  const removeAxis = (index: number) => {
    if (variantCount > 0) {
      onConfirm({
        title: t('confirmAxisTitle'),
        body: t('confirmAxisBody'),
        ok: t('confirmRemove'),
        run: () => remove(index),
      });
      return;
    }
    remove(index);
  };

  const atMax = fields.length >= MAX_ATTRS;

  return (
    <EditorSection bare step={step} title={t('title')} hint={t('hint')}>
      <div className={editorCard}>
        <div className="flex flex-col gap-2.5 p-3">
          {fields.map((field, index) => {
            const values = options[index]?.values ?? [];

            return (
              <div key={field.id} className={editorSubBox} data-testid={`attr-${index}`}>
                <div className="mb-2.5 flex items-center gap-1.5">
                  <div className="flex flex-none flex-col gap-px">
                    {/*
                      Reordering is not cosmetic: the FIRST axis becomes the variation tree's top
                      level — the parent rows a merchant collapses and bulk-edits. Moving "رنگ"
                      above "سایز" turns a size-first list into a colour-first one.
                    */}
                    <button
                      type="button"
                      disabled={index === 0}
                      title={t('moveUp')}
                      aria-label={t('moveUp')}
                      onClick={() => move(index, index - 1)}
                      className={cn(editorIconButton, 'h-3.5 w-5 rounded-sm')}
                    >
                      <ChevronUpIcon className="size-2.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === fields.length - 1}
                      title={t('moveDown')}
                      aria-label={t('moveDown')}
                      onClick={() => move(index, index + 1)}
                      className={cn(editorIconButton, 'h-3.5 w-5 rounded-sm')}
                    >
                      <ChevronDownIcon className="size-2.5" />
                    </button>
                  </div>

                  <input
                    {...register(`options.${index}.name`)}
                    aria-label={t('namePlaceholder')}
                    placeholder={t('namePlaceholder')}
                    className={editorInputGhost}
                  />

                  <span className="text-mut flex-none text-xs">
                    {t('count', { count: e2pNumbers(String(values.length)) })}
                  </span>

                  <button
                    type="button"
                    aria-label={t('removeAxis')}
                    onClick={() => removeAxis(index)}
                    className={editorIconButtonDanger}
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {values.map((value) => (
                    <span key={value.localKey} className={editorChip}>
                      {value.colorHex && (
                        <span
                          aria-hidden="true"
                          style={{ background: value.colorHex }}
                          className="size-3.5 flex-none rounded-full border border-black/15"
                        />
                      )}
                      <span>{value.value}</span>
                      <button
                        type="button"
                        aria-label={t('removeValue', { value: value.value })}
                        onClick={() => removeValue(index, value.localKey, value.value)}
                        className="bg-muted text-mut hover:bg-dtint hover:text-dtext grid size-5.5 flex-none place-items-center rounded-full transition-colors"
                      >
                        <XIcon className="size-2.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-2.5 flex gap-1.5">
                  <input
                    value={drafts[field.id] ?? ''}
                    aria-label={t('valuePlaceholder')}
                    placeholder={t('valuePlaceholder')}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      // Otherwise Enter submits the form — this input is inside the <form>.
                      e.preventDefault();
                      addValues(index, field.id);
                    }}
                    className={editorInputSm}
                  />
                  <button
                    type="button"
                    onClick={() => addValues(index, field.id)}
                    className={editorAddButtonSm}
                  >
                    {t('add')}
                  </button>
                </div>
                <p className="text-mut mt-1.5 text-xs">{t('splitHint')}</p>
              </div>
            );
          })}

          {fields.length === 0 && (
            <div className={editorEmptyBox}>
              <div className="mb-1 text-sm font-bold">{t('empty')}</div>
              <p className="text-mut m-0 text-xs text-pretty">{t('emptyHint')}</p>
            </div>
          )}

          <button
            type="button"
            disabled={atMax}
            title={atMax ? t('maxReached') : undefined}
            // `style: 'button'` is the default this editor writes. A value only becomes a colour
            // swatch by carrying a hex — the design has no style picker.
            // `localKey` is required on an option the same way it is on a value (schema.ts has no
            // `?` on either): a field-array row needs a stable identity before Save mints a real
            // id, and `append` — unlike `useFieldArray`'s own `field.id` — does not invent one.
            onClick={() =>
              append({ localKey: crypto.randomUUID(), name: '', style: 'button', values: [] })
            }
            className={editorAddButton}
          >
            <PlusIcon className="size-3" />
            {t('addAttribute')}
          </button>
        </div>
      </div>
    </EditorSection>
  );
};
