'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import e2pNumbers from '@/utils/e2pNumber';

import { Checkbox } from '@/components/ui';

import { EditorRailCard } from '../ui/EditorSection';
import { editorAddButtonSm, editorInputSm } from '../ui/editorChrome';
import type { ProductFormValues } from '../productEditor.schema';

/** Matches the backend's `@Length(1, 100)` on a collection name. */
const NAME_LIMIT = 100;

export interface RailCollection {
  id: string;
  name: string;
  /**
   * The server-computed live product count. Never `productIds.length` — the backend derives
   * this so the id list can be dropped from that payload later without breaking the badge.
   */
  productCount: number;
}

interface CollectionsPanelProps {
  collections: RailCollection[];
  /**
   * Creates a collection on the server and returns it. The page shell owns this because the
   * same create must revalidate the shared `/commerce/collections` SWR key that the rest of
   * the editor reads. A `null` return means the call failed — the caller has already shown
   * the error, and this panel keeps the typed name so it can be retried without retyping.
   */
  onCreate: (name: string) => Promise<{ id: string; name: string } | null>;
}

/**
 * Rail card ۱ — which collections this product belongs to.
 *
 * Membership is form data (`collectionIds`), not an immediate API call, in BOTH modes: create
 * sends the ids inline with `POST /commerce/products` so a product is never briefly visible
 * outside the collections the merchant chose, and edit diffs them at save time.
 */
export const CollectionsPanel = ({ collections, onCreate }: CollectionsPanelProps) => {
  const t = useTranslations('Commerce.Editor.Collections');
  const { control, setValue } = useFormContext<ProductFormValues>();
  const selected = useWatch({ control, name: 'collectionIds' }) ?? [];

  // Search is deliberately NOT a form field. It only filters what is drawn, so putting it in
  // the form would make the product `isDirty` — and light up the Save button — just from
  // typing in a search box.
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return collections;
    return collections.filter((collection) => collection.name.toLowerCase().includes(needle));
  }, [collections, query]);

  const write = (next: string[]) => setValue('collectionIds', next, { shouldDirty: true });

  const toggle = (id: string, next: boolean) =>
    write(
      next
        ? selected.includes(id)
          ? selected
          : [...selected, id]
        : selected.filter((current) => current !== id),
    );

  const select = (id: string) => {
    if (!selected.includes(id)) write([...selected, id]);
  };

  const submitDraft = async () => {
    const name = draft.trim();
    if (!name || isCreating) return;

    // An exact-name match must never become a second collection: the merchant means "put it in
    // that one", and the backend would reject the duplicate slug anyway — with an error that
    // reads as a failure rather than as the thing they actually wanted.
    const existing = collections.find((collection) => collection.name.trim() === name);
    if (existing) {
      select(existing.id);
      setDraft('');
      setQuery('');
      toast.success(t('alreadyExists', { name: existing.name }));
      return;
    }

    setIsCreating(true);
    try {
      const created = await onCreate(name);
      if (!created) return; // failed — keep the draft so it can be retried as-is
      select(created.id);
      setDraft('');
      setQuery('');
      toast.success(t('created', { name: created.name }));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <EditorRailCard
      title={t('title')}
      count={
        selected.length
          ? t('countSelected', { count: e2pNumbers(String(selected.length)) })
          : t('countNone')
      }
      footer={
        <div className="flex gap-1.5">
          <input
            value={draft}
            maxLength={NAME_LIMIT}
            data-testid="collection-create-input"
            aria-label={t('newCollection')}
            placeholder={t('newCollectionPlaceholder')}
            onChange={(event) => setDraft(event.target.value)}
            // Enter creates the collection rather than submitting the surrounding product form.
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              void submitDraft();
            }}
            className={editorInputSm}
          />
          <button
            type="button"
            disabled={isCreating || draft.trim().length === 0}
            data-testid="collection-create-add"
            onClick={() => void submitDraft()}
            className={editorAddButtonSm}
          >
            {t('add')}
          </button>
        </div>
      }
    >
      <input
        value={query}
        data-testid="collection-search"
        aria-label={t('search')}
        placeholder={t('searchPlaceholder')}
        onChange={(event) => setQuery(event.target.value)}
        className={editorInputSm}
      />

      <div
        role="group"
        aria-label={t('title')}
        className="-mx-1 flex max-h-[246px] flex-col gap-0.5 overflow-y-auto px-1"
      >
        {visible.map((collection) => {
          const isOn = selected.includes(collection.id);
          return (
            <div
              key={collection.id}
              className="hover:bg-tint flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors"
            >
              <Checkbox
                className="size-4"
                checked={isOn}
                aria-label={collection.name}
                data-testid={`collection-checkbox-${collection.id}`}
                onCheckedChange={(next) => toggle(collection.id, next === true)}
              />
              {/*
                Mouse convenience only: the row's text is a second hit target for the same
                toggle. A native `<label htmlFor>` cannot do this — Radix's Checkbox renders a
                `<button>`, and a label does not activate a button. It is hidden from assistive
                tech and skipped by Tab so the checkbox above stays the single announced
                control instead of every row reading twice.
              */}
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => toggle(collection.id, !isOn)}
                className="flex min-w-0 flex-1 items-center gap-2 text-start"
              >
                <span className="min-w-0 flex-1 truncate font-semibold">{collection.name}</span>
                <span className="text-mut flex-none">
                  {t('productCount', { count: e2pNumbers(String(collection.productCount)) })}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/*
        Covers both "the workspace has no collections yet" and "the search matched nothing" —
        in both cases the footer's create row is the answer, which is exactly what it says.
      */}
      {visible.length === 0 && <p className="text-mut px-1 text-xs">{t('noSearchMatch')}</p>}
    </EditorRailCard>
  );
};
