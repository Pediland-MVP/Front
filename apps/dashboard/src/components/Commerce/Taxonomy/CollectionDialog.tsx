'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { mutate } from 'swr';

import api from '@/hooks/swr/api-client';
import type { CommerceCollectionListItem } from '@/types/commerce';
import type { ExceptionMessage } from '@/types/exceptionMessage';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/components/ui';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';

export const collectionsKey = '/commerce/collections';

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; absent = create mode. */
  collection?: CommerceCollectionListItem;
}

// Name-only: `UpsertCommerceCollectionDto` is `{name, productIds?}`, but a collection's
// product membership is managed from the product editor's Collections section (Task 8), not
// here. Sending `{name}` alone on an edit relies on `PUT /commerce/collections/:id` treating
// omitted fields as "leave unchanged" — confirmed by `CollectionsSection#handleToggle`, which
// PUTs `{productIds}` alone (no `name`) when toggling membership and never wipes the name.
// There is also NO manual/rule-based collection-type field on the backend (spec correction
// item 6) — this dialog intentionally has no type toggle.
export const CollectionDialog = ({ open, onOpenChange, collection }: CollectionDialogProps) => {
  const t = useTranslations('Commerce.Taxonomy.CollectionDialog');
  const t_ec = useTranslations('ERROR_CODES');

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = Boolean(collection);

  // Re-seed every time the dialog opens for a (possibly different) collection — same
  // re-seed-on-open convention `CategoryDialog`/`AdjustStockDialog` use.
  useEffect(() => {
    if (!open) return;
    setName(collection?.name ?? '');
  }, [open, collection]);

  const isInvalid = name.trim().length === 0;

  const handleSubmit = async () => {
    if (isInvalid) return;

    setIsSaving(true);
    try {
      if (isEdit && collection) {
        await api.put(`/commerce/collections/${collection.id}`, { name: name.trim() });
      } else {
        await api.post('/commerce/collections', { name: name.trim() });
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
        await mutate(collectionsKey);
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="collection-dialog-name">{t('name')}</Label>
          <Input
            id="collection-dialog-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
          />
          {isInvalid && <p className="text-destructive text-xs">{t('nameRequired')}</p>}
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
