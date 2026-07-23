'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { PencilIcon, Trash2Icon } from 'lucide-react';

import api from '@/hooks/swr/api-client';
import type { CommerceCollectionListItem, PaginatedResult } from '@/types/commerce';
import type { ExceptionMessage } from '@/types/exceptionMessage';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { DeleteConfirmationDialog } from '@/components/Global/DeleteConfirmationDialog';
import { CollectionDialog, collectionsKey } from './CollectionDialog';

interface CollectionsListProps {
  isCreateDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
}

// `GET /commerce/collections` returns a synthetic single page (`PaginatedResult`, per
// project convention — see CLAUDE.md §9). There is NO manual/rule-based collection-type
// concept on the backend at all (spec correction item 6) — no type badge/toggle anywhere in
// this component or `CollectionDialog`.
export const CollectionsList = ({
  isCreateDialogOpen,
  onCreateDialogOpenChange,
}: CollectionsListProps) => {
  const t = useTranslations('Commerce.Taxonomy.Collection');
  const t_ec = useTranslations('ERROR_CODES');

  const {
    data: collectionsData,
    error: collectionsError,
    isLoading: isCollectionsLoading,
  } = useSWRImmutable<PaginatedResult<CommerceCollectionListItem[]>>(collectionsKey);

  const collections = collectionsData?.items ?? [];

  const [editingCollection, setEditingCollection] = useState<CommerceCollectionListItem | null>(
    null,
  );
  const [deletingCollection, setDeletingCollection] = useState<CommerceCollectionListItem | null>(
    null,
  );

  const handleDeleteConfirm = async () => {
    if (!deletingCollection) return;

    try {
      await api.delete(`/commerce/collections/${deletingCollection.id}`);
      toast.success(t('deleteSuccess'));
    } catch (error) {
      const code = isAxiosError(error)
        ? (error.response?.data as ExceptionMessage | undefined)?.code
        : undefined;
      toast.error(code ? t_ec(code) : t('deleteError'));
    } finally {
      setDeletingCollection(null);
      await mutate(collectionsKey);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isCollectionsLoading ? (
          <LoaderSpin />
        ) : collectionsError ? (
          <p className="text-destructive text-sm">{t('loadError')}</p>
        ) : collections.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {collections.map((collection) => (
              <div
                key={collection.id}
                data-testid={`collection-row-${collection.id}`}
                className="bg-card flex items-center gap-2 rounded-md border px-2 py-1.5"
              >
                <span className="flex-1 truncate text-sm">{collection.name}</span>

                <Badge variant="secondary" className="shrink-0">
                  {t('productCount', { count: collection.productIds.length })}
                </Badge>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingCollection(collection)}
                >
                  <PencilIcon className="size-4 text-green-600" />
                  <span className="sr-only">{t('edit')}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingCollection(collection)}
                >
                  <Trash2Icon className="text-destructive size-4" />
                  <span className="sr-only">{t('delete')}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CollectionDialog open={isCreateDialogOpen} onOpenChange={onCreateDialogOpenChange} />

      <CollectionDialog
        open={!!editingCollection}
        onOpenChange={(open) => {
          if (!open) setEditingCollection(null);
        }}
        collection={editingCollection ?? undefined}
      />

      <DeleteConfirmationDialog
        isOpen={!!deletingCollection}
        onClose={() => setDeletingCollection(null)}
        onConfirm={handleDeleteConfirm}
      />
    </Card>
  );
};
