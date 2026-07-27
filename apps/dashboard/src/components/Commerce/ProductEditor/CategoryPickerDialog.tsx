'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { ChevronDownIcon } from 'lucide-react';

import api from '@/hooks/swr/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { buildCategoryTree } from '@/utils/commerce/buildCategoryTree';
import type { CommerceCategory, CommerceCategoryNode } from '@/types/commerce';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import type { IResponseMessage } from '@/types/responseMessage';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui';

import {
  editorAddButtonSm,
  editorInputSm,
  editorIconButton,
  editorEmptyBox,
} from './ui/editorChrome';

/** Same SWR key `BasicInfoSection`/`CategorySection` read the category list from. */
export const CATEGORIES_KEY = '/commerce/categories';

/**
 * Two-level category picker with inline creation.
 *
 * Creating a category needs `product:edit`, which is a DIFFERENT permission from the
 * `product:create` that lets someone add a product — so a user can legitimately be allowed to
 * pick a category here and not to make one. The create row is hidden in exactly that case rather
 * than letting the request 403 after they have typed a name.
 *
 * The tree is rendered two levels deep because that is what the design shows and what the
 * storefront navigates; `buildCategoryTree` itself is unbounded, so a deeper category still
 * appears — flattened under its top-level ancestor rather than hidden.
 */
export const CategoryPickerDialog = ({
  open,
  onOpenChange,
  categories,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CommerceCategory[];
  value: string | null;
  onChange: (next: string | null) => void;
}) => {
  const t = useTranslations('Commerce.Editor.Category');
  const t_ec = useTranslations('ERROR_CODES');
  const { can } = usePermissions();
  const canCreate = can('product:edit');

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());
  const [rootDraft, setRootDraft] = useState('');
  const [subDrafts, setSubDrafts] = useState<Record<string, string>>({});
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

  const toggleOpen = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /**
   * `parentId` is `null` for a top-level category. Revalidates the shared list on success so the
   * new row appears here AND in every other consumer of `/commerce/categories` at once.
   */
  const createCategory = async (name: string, parentId: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setCreatingFor(parentId ?? 'root');
    try {
      const { data } = await api.post<IResponseMessage<CommerceCategory>>(CATEGORIES_KEY, {
        name: trimmed,
        ...(parentId && { parentId }),
      });
      await mutate(CATEGORIES_KEY);

      if (parentId) {
        setSubDrafts((current) => ({ ...current, [parentId]: '' }));
        // A brand-new subcategory is invisible unless its parent is open.
        setOpenIds((current) => new Set(current).add(parentId));
      } else {
        setRootDraft('');
      }

      // Selecting it immediately is the point of creating it mid-form.
      if (data?.data?.id) onChange(data.data.id);
      toast.success(t('created'));
    } catch (error) {
      const code = isAxiosError(error)
        ? (error.response?.data as ExceptionMessage | undefined)?.code
        : undefined;
      toast.error(code ? t_ec(code) : t('createError'));
    } finally {
      setCreatingFor(null);
    }
  };

  const renderPickButton = (node: CommerceCategoryNode, depth: number) => (
    <button
      key={node.id}
      type="button"
      aria-pressed={value === node.id}
      data-testid={`category-pick-${node.id}`}
      onClick={() => onChange(value === node.id ? null : node.id)}
      className={cn(
        'hover:bg-tint min-w-0 flex-1 rounded-md px-2 py-1.5 text-start text-xs font-semibold transition-colors',
        depth > 0 && 'ps-6',
        value === node.id && 'bg-tint2 text-primary font-bold',
      )}
    >
      {node.name}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <div className="border-lnv border-b px-4 py-3.5">
          <DialogTitle className="text-sm font-bold">{t('dialogTitle')}</DialogTitle>
          <DialogDescription className="text-mut mt-1 text-xs">
            {t('dialogDescription')}
          </DialogDescription>
        </div>

        <div className="flex max-h-[52vh] flex-col gap-1.5 overflow-y-auto px-4 py-3">
          {tree.length === 0 && <div className={editorEmptyBox}>{t('empty')}</div>}

          {tree.map((node) => {
            const isOpen = openIds.has(node.id);
            return (
              <div key={node.id} className="border-ln overflow-hidden rounded-lg border">
                <div className="bg-muted flex items-center gap-1.5 px-2.5 py-2">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={t('toggleChildren', { name: node.name })}
                    data-testid={`category-toggle-${node.id}`}
                    onClick={() => toggleOpen(node.id)}
                    className={cn(editorIconButton, 'text-primary size-[22px]')}
                  >
                    <ChevronDownIcon
                      className={cn('size-3.5 transition-transform', !isOpen && '-rotate-90')}
                    />
                  </button>
                  {renderPickButton(node, 0)}
                  <span className="text-mut flex-none text-xs">
                    {t('subCount', { count: node.children.length })}
                  </span>
                </div>

                {isOpen && (
                  <div className="flex flex-col gap-1 px-2.5 py-2">
                    {node.children.map((child) => renderPickButton(child, 1))}

                    {canCreate && (
                      <div className="mt-1 flex gap-1.5">
                        <input
                          value={subDrafts[node.id] ?? ''}
                          aria-label={t('newSubIn', { name: node.name })}
                          placeholder={t('newSubPlaceholder')}
                          data-testid={`category-sub-draft-${node.id}`}
                          onChange={(e) =>
                            setSubDrafts((current) => ({ ...current, [node.id]: e.target.value }))
                          }
                          // Enter creates without submitting the surrounding product form.
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            e.preventDefault();
                            void createCategory(subDrafts[node.id] ?? '', node.id);
                          }}
                          className={editorInputSm}
                        />
                        <button
                          type="button"
                          disabled={creatingFor !== null}
                          data-testid={`category-sub-add-${node.id}`}
                          onClick={() => void createCategory(subDrafts[node.id] ?? '', node.id)}
                          className={editorAddButtonSm}
                        >
                          {t('add')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-muted border-lnv flex flex-col gap-2 border-t px-4 py-3">
          {canCreate && (
            <div className="flex gap-1.5">
              <input
                value={rootDraft}
                aria-label={t('newRoot')}
                placeholder={t('newRootPlaceholder')}
                data-testid="category-root-draft"
                onChange={(e) => setRootDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  void createCategory(rootDraft, null);
                }}
                className={editorInputSm}
              />
              <button
                type="button"
                disabled={creatingFor !== null}
                data-testid="category-root-add"
                onClick={() => void createCategory(rootDraft, null)}
                className={editorAddButtonSm}
              >
                {t('createRoot')}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              data-testid="category-clear"
              onClick={() => onChange(null)}
              className="text-mut hover:text-foreground flex-1 text-start text-xs transition-colors"
            >
              {t('clear')}
            </button>
            <button
              type="button"
              data-testid="category-confirm"
              onClick={() => onOpenChange(false)}
              className="bg-primary text-primary-foreground h-[34px] rounded-lg px-4 text-sm font-bold"
            >
              {t('confirm')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
