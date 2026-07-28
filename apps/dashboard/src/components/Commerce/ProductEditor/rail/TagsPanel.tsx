'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import { EditorRailCard } from '../ui/EditorSection';
import {
  editorAddButtonSm,
  editorChip,
  editorChipSuggest,
  editorInputSm,
} from '../ui/editorChrome';
import { MAX_TAGS, type ProductFormValues } from '../productEditor.schema';

/** How many pool suggestions the design shows at once. */
const SUGGESTION_LIMIT = 6;

/**
 * Both commas split. A Persian keyboard produces `،` (U+060C), so accepting only the ASCII
 * comma would silently turn "کتانی، دویدن" into one three-word tag.
 */
const SPLIT = /[,،]/;

interface TagsPanelProps {
  /** The workspace tag pool from `GET /commerce/tags`. Used only to offer suggestions. */
  pool: string[];
}

/**
 * Rail card ۲ — free-form tags.
 *
 * `tags` holds NAMES, not ids: the backend resolves-or-creates each against the workspace pool,
 * so the editor never has to know whether a tag already exists.
 */
export const TagsPanel = ({ pool }: TagsPanelProps) => {
  const t = useTranslations('Commerce.Editor.Tags');
  const { control, setValue } = useFormContext<ProductFormValues>();
  const tags = useWatch({ control, name: 'tags' }) ?? [];
  const [draft, setDraft] = useState('');

  const isFull = tags.length >= MAX_TAGS;

  const suggestions = useMemo(
    () =>
      pool
        .filter((name) => !tags.some((tag) => tag.toLowerCase() === name.toLowerCase()))
        .slice(0, SUGGESTION_LIMIT),
    [pool, tags],
  );

  /**
   * Adds one or many names in a single write. Duplicates are skipped case-insensitively,
   * because the backend resolves tags that way — a UI that disagreed would show a chip that
   * silently merges into another one on save.
   */
  const addNames = (raw: string) => {
    const names = raw
      .split(SPLIT)
      .map((part) => part.trim())
      .filter(Boolean);

    const next = [...tags];
    const added: string[] = [];
    for (const name of names) {
      if (next.length >= MAX_TAGS) break;
      if (next.some((tag) => tag.toLowerCase() === name.toLowerCase())) continue;
      next.push(name);
      added.push(name);
    }

    if (!added.length) {
      // Only shout when the CEILING is what blocked it. A plain duplicate is a no-op the
      // merchant can already see (the chip is right there), so it needs no error.
      if (names.length && isFull) toast.error(t('limitReached'));
      return;
    }

    setValue('tags', next, { shouldDirty: true });
    toast.success(
      added.length === 1
        ? t('addedOne', { name: added[0] })
        : t('addedMany', { count: e2pNumbers(String(added.length)) }),
    );
  };

  const submitDraft = () => {
    addNames(draft);
    // Cleared unconditionally: after pressing افزودن the field is spent, whether every name in
    // it was new or all of them were duplicates.
    setDraft('');
  };

  const remove = (name: string) => {
    setValue(
      'tags',
      tags.filter((tag) => tag !== name),
      { shouldDirty: true },
    );
    toast.success(t('removed', { name }));
  };

  return (
    <EditorRailCard
      title={t('title')}
      count={tags.length ? t('count', { count: e2pNumbers(String(tags.length)) }) : t('countEmpty')}
    >
      {tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className={cn(editorChip, 'bg-tint2 text-primary font-bold')}>
              <span className="max-w-[140px] truncate">{tag}</span>
              <button
                type="button"
                aria-label={t('remove', { name: tag })}
                data-testid={`tag-remove-${tag}`}
                onClick={() => remove(tag)}
                className="hover:bg-dtint hover:text-dtext grid size-[18px] flex-none place-items-center rounded-full transition-colors"
              >
                <XIcon className="size-2.5" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-mut text-xs">{t('empty')}</p>
      )}

      <div className="flex gap-1.5">
        <input
          value={draft}
          maxLength={50}
          data-testid="tag-input"
          aria-label={t('newTag')}
          placeholder={t('newTagPlaceholder')}
          onChange={(event) => setDraft(event.target.value)}
          // Enter adds the tag rather than submitting the surrounding product form.
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            submitDraft();
          }}
          className={editorInputSm}
        />
        <button
          type="button"
          disabled={isFull || draft.trim().length === 0}
          data-testid="tag-add"
          onClick={submitDraft}
          className={editorAddButtonSm}
        >
          {t('add')}
        </button>
      </div>

      <p className="text-mut text-xs">{t('splitHint')}</p>

      {suggestions.length > 0 && (
        <div>
          <div className="text-mut mb-1.5 text-xs">{t('suggestTitle')}</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                disabled={isFull}
                data-testid={`tag-suggestion-${name}`}
                onClick={() => addNames(name)}
                className={editorChipSuggest}
              >
                {`+ ${name}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </EditorRailCard>
  );
};
