'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

import { editorAddButtonSm, editorEmptyBox, editorInputSm } from '../ui/editorChrome';
import type { ProductFormValues } from '../productEditor.schema';

/**
 * Two levels, because that is what the design draws and what the storefront navigates. A
 * deeper category still reaches this list — the shell flattens it under its top-level ancestor
 * rather than hiding it.
 */
export interface CategoryPickerNode {
  id: string;
  name: string;
  subs: Array<{ id: string; name: string }>;
}

interface CategoryPickerDialogProps {
  open: boolean;
  onClose: () => void;
  tree: CategoryPickerNode[];
  /** `null` means the create failed; the caller has already shown the error. */
  onCreateCategory: (name: string) => Promise<{ id: string; name: string } | null>;
  onCreateSub: (parentId: string, name: string) => Promise<{ id: string; name: string } | null>;
}

export const CategoryPickerDialog = ({
  open,
  onClose,
  tree,
  onCreateCategory,
  onCreateSub,
}: CategoryPickerDialogProps) => {
  const t = useTranslations('Commerce.Editor.CategoryPicker');
  const { control, setValue } = useFormContext<ProductFormValues>();
  const categoryId = useWatch({ control, name: 'categoryId' }) ?? null;

  const [openIds, setOpenIds] = useState<string[]>([]);
  const [rootDraft, setRootDraft] = useState('');
  const [subDrafts, setSubDrafts] = useState<Record<string, string>>({});
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Expand the branch holding the current selection, so a picked subcategory is visible
    // rather than hidden behind a collapsed parent.
    const parent = tree.find((root) => root.subs.some((sub) => sub.id === categoryId));
    setOpenIds(parent ? [parent.id] : []);
    setRootDraft('');
    setSubDrafts({});
    // `tree`/`categoryId` are deliberately NOT dependencies: this seeds ON OPEN only. Re-running
    // it whenever the merchant picks a different category would collapse the very branch their
    // cursor is in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const path = useMemo(() => {
    for (const root of tree) {
      if (root.id === categoryId) return root.name;
      const sub = root.subs.find((candidate) => candidate.id === categoryId);
      if (sub) return `${root.name} › ${sub.name}`;
    }
    return null;
  }, [tree, categoryId]);

  const toggleOpen = (id: string) =>
    setOpenIds((current) =>
      current.includes(id) ? current.filter((openId) => openId !== id) : [...current, id],
    );

  const pick = (id: string) => setValue('categoryId', id, { shouldDirty: true });

  const createRoot = async () => {
    const name = rootDraft.trim();
    if (!name || isBusy) return;
    setIsBusy(true);
    try {
      const created = await onCreateCategory(name);
      if (!created) return; // failed — keep the draft so it can be retried as-is
      setRootDraft('');
      setOpenIds((current) => [...current, created.id]);
      // A category you just made is almost always the one you wanted, so it is selected too.
      pick(created.id);
    } finally {
      setIsBusy(false);
    }
  };

  const createSub = async (parentId: string) => {
    const name = (subDrafts[parentId] ?? '').trim();
    if (!name || isBusy) return;
    setIsBusy(true);
    try {
      const created = await onCreateSub(parentId, name);
      if (!created) return;
      setSubDrafts((current) => ({ ...current, [parentId]: '' }));
      pick(created.id);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1">
          {tree.length === 0 && (
            <div className={editorEmptyBox}>
              <p className="text-mut text-xs">{t('empty')}</p>
            </div>
          )}

          {tree.map((root) => {
            const isOpen = openIds.includes(root.id);
            return (
              <div key={root.id} className="border-ln overflow-hidden rounded-lg border">
                <div className="bg-muted flex items-center gap-1.5 px-2.5 py-2">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={t('expand', { name: root.name })}
                    data-testid={`category-expand-${root.id}`}
                    onClick={() => toggleOpen(root.id)}
                    className="text-primary grid size-5 flex-none place-items-center rounded"
                  >
                    <ChevronDownIcon
                      className={cn('size-3.5 transition-transform', !isOpen && '-rotate-90')}
                    />
                  </button>
                  <button
                    type="button"
                    aria-pressed={root.id === categoryId}
                    data-testid={`category-pick-${root.id}`}
                    onClick={() => pick(root.id)}
                    className={cn(
                      'min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-start text-sm font-semibold',
                      root.id === categoryId && 'bg-tint2 text-primary font-bold',
                    )}
                  >
                    {root.name}
                  </button>
                  <span className="text-mut flex-none text-xs">
                    {root.subs.length
                      ? t('subCount', { count: e2pNumbers(String(root.subs.length)) })
                      : t('noSub')}
                  </span>
                </div>

                {isOpen && (
                  <div className="flex flex-col gap-1 px-2.5 py-2">
                    {root.subs.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        aria-pressed={sub.id === categoryId}
                        data-testid={`category-pick-${sub.id}`}
                        onClick={() => pick(sub.id)}
                        className={cn(
                          'hover:bg-tint truncate rounded-md px-2 py-1.5 ps-5 text-start text-xs font-semibold transition-colors',
                          sub.id === categoryId && 'bg-tint2 text-primary font-bold',
                        )}
                      >
                        {sub.name}
                      </button>
                    ))}

                    <div className="mt-1 flex gap-1.5">
                      <input
                        value={subDrafts[root.id] ?? ''}
                        maxLength={255}
                        data-testid={`category-sub-input-${root.id}`}
                        aria-label={t('newSub', { name: root.name })}
                        placeholder={t('newSubPlaceholder')}
                        onChange={(event) =>
                          setSubDrafts((current) => ({ ...current, [root.id]: event.target.value }))
                        }
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return;
                          event.preventDefault();
                          void createSub(root.id);
                        }}
                        className={editorInputSm}
                      />
                      <button
                        type="button"
                        disabled={isBusy}
                        data-testid={`category-sub-add-${root.id}`}
                        onClick={() => void createSub(root.id)}
                        className={editorAddButtonSm}
                      >
                        {t('addSub')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-lnv flex flex-col gap-2 border-t pt-3">
          <div className="flex gap-1.5">
            <input
              value={rootDraft}
              maxLength={255}
              data-testid="category-root-input"
              aria-label={t('newCategory')}
              placeholder={t('newCategoryPlaceholder')}
              onChange={(event) => setRootDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                void createRoot();
              }}
              className={editorInputSm}
            />
            <button
              type="button"
              disabled={isBusy}
              data-testid="category-root-add"
              onClick={() => void createRoot()}
              className={editorAddButtonSm}
            >
              {t('addCategory')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-mut flex-1 truncate text-xs" data-testid="category-footer">
              {path ? t('current', { path }) : t('none')}
            </span>
            {/*
              Just closes. The pick already wrote `categoryId` into the form the moment it was
              clicked, so there is nothing to commit here — a Cancel that "un-picks" would be a
              second, competing source of truth.
            */}
            <Button type="button" size="sm" onClick={onClose}>
              {t('confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
