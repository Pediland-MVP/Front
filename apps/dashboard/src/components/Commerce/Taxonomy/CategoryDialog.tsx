'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { mutate } from 'swr';

import api from '@/hooks/swr/api-client';
import type { CommerceCategory, CommerceCategoryNode } from '@/types/commerce';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import { buildCategoryTree } from '@/utils/commerce/buildCategoryTree';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';

const NO_PARENT_VALUE = 'none';
export const categoriesKey = '/commerce/categories';

interface ParentOption {
  id: string;
  label: string;
  depth: number;
}

const flattenTree = (nodes: CommerceCategoryNode[], depth = 0): ParentOption[] =>
  nodes.flatMap((node) => [
    { id: node.id, label: node.name, depth },
    ...flattenTree(node.children, depth + 1),
  ]);

// Every id belonging to `rootId`'s own subtree (itself + all descendants) — a category can
// never become its own parent nor the parent of one of its own descendants. This is only a
// client-side UI guard: the backend's `COMMERCE_CATEGORY_CYCLE` check remains the final
// authority (e.g. a stale client-side tree could still let a real cycle slip through, which
// the server catches — see `handleSubmit`'s error handling below).
const collectSubtreeIds = (nodes: CommerceCategoryNode[], rootId: string): Set<string> => {
  const findNode = (list: CommerceCategoryNode[]): CommerceCategoryNode | undefined => {
    for (const node of list) {
      if (node.id === rootId) return node;
      const found = findNode(node.children);
      if (found) return found;
    }
    return undefined;
  };

  const collectIds = (node: CommerceCategoryNode): string[] => [
    node.id,
    ...node.children.flatMap(collectIds),
  ];

  const root = findNode(nodes);
  return new Set(root ? collectIds(root) : [rootId]);
};

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CommerceCategory[];
  /** Present = edit mode; absent = create mode. */
  category?: CommerceCategory;
}

export const CategoryDialog = ({
  open,
  onOpenChange,
  categories,
  category,
}: CategoryDialogProps) => {
  const t = useTranslations('Commerce.Taxonomy.CategoryDialog');
  const t_ec = useTranslations('ERROR_CODES');

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = Boolean(category);

  // Re-seed every time the dialog opens for a (possibly different) category — same
  // re-seed-on-open convention `AdjustStockDialog`/`VariantMediaPickerDialog` use, so a
  // previous edit's in-progress state never leaks into the next open.
  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? '');
    setParentId(category?.parentId ?? null);
  }, [open, category]);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  const parentOptions = useMemo(() => {
    const all = flattenTree(tree);
    if (!category) return all;
    const excluded = collectSubtreeIds(tree, category.id);
    return all.filter((option) => !excluded.has(option.id));
  }, [tree, category]);

  const isInvalid = name.trim().length === 0;

  const handleSubmit = async () => {
    if (isInvalid) return;

    setIsSaving(true);
    try {
      if (isEdit && category) {
        await api.put(`/commerce/categories/${category.id}`, {
          name: name.trim(),
          parentId,
        });
      } else {
        await api.post('/commerce/categories', {
          name: name.trim(),
          parentId,
        });
      }
      toast.success(isEdit ? t('updateSuccess') : t('createSuccess'));
      onOpenChange(false);
    } catch (error) {
      const code = isAxiosError(error)
        ? (error.response?.data as ExceptionMessage | undefined)?.code
        : undefined;
      toast.error(code ? t_ec(code) : t('genericError'));
    } finally {
      try {
        await mutate(categoriesKey);
      } catch {
        // intentionally silent — a revalidate hiccup here must never be misreported as the
        // save itself failing (the toast above already reflects the real result).
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category-dialog-name">{t('name')}</Label>
            <Input
              id="category-dialog-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
            />
            {isInvalid && <p className="text-destructive text-xs">{t('nameRequired')}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('parent')}</Label>
            <Select
              dir="rtl"
              value={parentId ?? NO_PARENT_VALUE}
              onValueChange={(value) => setParentId(value === NO_PARENT_VALUE ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('parentPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PARENT_VALUE}>{t('parentNone')}</SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {'  '.repeat(option.depth)}
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <ButtonLoading
            type="button"
            isLoading={isSaving}
            disabled={isInvalid}
            onClick={handleSubmit}
          >
            {t('submit')}
          </ButtonLoading>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
