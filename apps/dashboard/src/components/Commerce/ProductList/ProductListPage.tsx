'use client';

import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import { PageMeta } from '@/schemas/pageMeta';
import { ExceptionMessage } from '@/types/exceptionMessage';
import { CommerceProductListItem, CommerceProductStatus, PaginatedResult } from '@/types/commerce';
import { AxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';

import api from '@/hooks/swr/api-client';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';

import { Button } from '@/components/ui';
import { SearchInput } from '@/components/ui-custom/SearchInput';
import { SearchToggleButton } from '@/components/ui-custom/SearchToggleButton';
import { ItemsPagination } from '@/components/Console/ItemsPagination';
import { DeleteConfirmationDialog } from '@/components/Global/DeleteConfirmationDialog';
import { NoDataError } from '@/components/Global/NoDataError';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { CommerceProductCard } from './CommerceProductCard';
import { CircleFadingPlusIcon } from 'lucide-react';

const STATUS_FILTERS: { value: CommerceProductStatus | undefined; labelKey: string }[] = [
  { value: 'active', labelKey: 'active' },
  { value: 'draft', labelKey: 'draft' },
  { value: 'archived', labelKey: 'archived' },
  { value: undefined, labelKey: 'all' },
];

export const ProductListPage = () => {
  const t = useTranslations('Commerce.List');
  const t_ec = useTranslations('ERROR_CODES');
  const router = useRouter();
  const { can } = usePermissions();
  const hasViewPermission = can('product:view');
  const canEdit = can('product:edit');
  const canDelete = can('product:delete');

  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<CommerceProductStatus | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(21);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);
  const setTools = useHeaderFeatures((s) => s.setTools);
  const clearTools = useHeaderFeatures((s) => s.clearTools);
  const setError = useHeaderFeatures((s) => s.setError);
  const error = useHeaderFeatures((s) => s.error);

  const debouncedSearch = useDebounce(search, 500);

  const apiUrl = hasViewPermission
    ? `/commerce/products?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}${
        search ? `&search=${debouncedSearch}` : ''
      }`
    : null;

  const {
    data: productsData,
    error: productsError,
    isLoading: isProductsLoading,
  } = useSWRImmutable<PaginatedResult<CommerceProductListItem[]>>(apiUrl, {
    revalidateOnMount: true,
  });
  const products = productsData?.items ?? [];

  // ------- Pagination Start -------
  const defaultMeta: PageMeta = {
    currentPage: page,
    itemsPerPage: limit,
    itemCount: 0,
    totalItems: 0,
    totalPages: 1,
  };
  const meta: PageMeta = productsData?.meta ?? defaultMeta;

  const onPageChange = useCallback((newPage: number) => setPage(Math.max(1, newPage)), []);

  const onLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);
  // ------- Pagination End -------

  const onStatusChange = useCallback((newStatus: CommerceProductStatus | undefined) => {
    setStatus(newStatus);
    setPage(1);
  }, []);

  // ------- Item Delete Start -------
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDelete = useCallback((id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (itemToDelete && canDelete) {
      await api
        .delete(`/commerce/products/${itemToDelete}`)
        .then(() => {
          toast.success(t('Toast.deleted'));
          mutate(mutateIncludeStringKey('/commerce/products'));
        })
        .catch((error: AxiosError<ExceptionMessage>) => {
          const code = error.response?.data?.code;
          toast.error(t_ec(code));
        })
        .finally(() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        });
    }
  };
  // ------- Item Delete End -------

  useEffect(() => {
    if (productsError) {
      setError(true);
    }
  }, [productsError, setError]);

  // ------- Header wiring Start -------
  const HeaderButton = useMemo(
    () => (
      <>
        <SearchToggleButton
          isSearchVisible={isSearchVisible}
          setIsSearchVisible={setIsSearchVisible}
        />

        {can('product:create') && (
          <Button
            type="button"
            size="md"
            disabled={error}
            onClick={() => router.push('/products/add')}
          >
            {t('add')}
            <CircleFadingPlusIcon />
          </Button>
        )}
      </>
    ),
    [isSearchVisible, can, error, router, t],
  );

  const HeaderTools = useMemo(
    () => (
      <SearchInput value={search} onChange={setSearch} visible={isSearchVisible} disabled={error} />
    ),
    [search, isSearchVisible, error],
  );

  useEffect(() => {
    setButtons(HeaderButton);
    setTools(HeaderTools);
  }, [HeaderButton, HeaderTools, setButtons, setTools]);

  useEffect(() => {
    return () => {
      clearButtons();
      clearTools();
    };
  }, [clearButtons, clearTools]);
  // ------- Header wiring End -------

  if (productsError) {
    return <NoDataError />;
  }

  if (isProductsLoading) {
    return <LoaderSpin />;
  }

  return (
    <>
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.labelKey}
            type="button"
            size="sm"
            variant={status === filter.value ? 'default' : 'outline'}
            className="rounded-full"
            onClick={() => onStatusChange(filter.value)}
          >
            {t(`Status.${filter.labelKey}`)}
          </Button>
        ))}
      </div>

      <div className="flex-1">
        {products.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground text-sm">{t('no_products')}</div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 2xl:grid-cols-4">
            {products.map((item) => (
              <CommerceProductCard
                key={item.id}
                product={item}
                handleDelete={handleDelete}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ItemsPagination
        isLoading={isProductsLoading}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        totalCount={meta.totalItems}
        serverPage={meta.currentPage}
        serverPerPage={meta.itemsPerPage}
        serverItemCount={meta.itemCount}
        serverTotalPages={meta.totalPages}
      />
    </>
  );
};
