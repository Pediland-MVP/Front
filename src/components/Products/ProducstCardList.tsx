"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { ProductNamespace } from "@/types/product";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import useSWRImmutable from "swr/immutable";

import api from "@/hooks/swr/api-client";
import { toast } from "sonner";
import { mutate } from "swr";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { AxiosError } from "axios";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { PageMeta } from "@/schemas/pageMeta";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeaturesStore";
import { NoDataError } from "../Global/NoDataError";
import { LoaderSpin } from "../ui-custom/LoaderSpin";
import { DeleteConfirmationDialog } from "../Global/DeleteConfirmationDialog";
import { ProductCard } from "./ProductCard";
import { ItemsPagination } from "../Console/ItemsPagination";
import { Alert, AlertDescription, AlertTitle } from "../ui";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";

interface ProducstCardListProps {
  search: string;
  allowAdd: boolean;
}

export const ProducstCardList = ({
  search,
  allowAdd,
}: ProducstCardListProps) => {
  const t = useTranslations("Products.List");
  const t_ec = useTranslations("ERROR_CODES");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(21);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { setError } = useHeaderFeatures();

  let searchParams = "";
  const debouncedSearchTerm = useDebounce(search, 500);
  search ? (searchParams = `&search=${debouncedSearchTerm}`) : null;
  const apiUrl = `/products?page=${page}&limit=${limit}${searchParams}`;
  const {
    data: productsData,
    error: productsError,
    isLoading: isProductsLoading,
    mutate: fetchproducts,
  } = useSWRImmutable<ProductNamespace.GET>(apiUrl, {
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

  const onPageChange = useCallback(
    (newPage: number) => setPage(Math.max(1, newPage)),
    [],
  );

  const onLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);
  // ------- Pagination End -------

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
    if (itemToDelete) {
      await api
        .delete(`/products/${itemToDelete}`)
        .then((res) => {
          toast.success(t("Toast.deleted"));
          mutate(mutateIncludeStringKey("/products"));
        })
        .catch((error: AxiosError<ExceptionMessage>) => {
          console.error(error);
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
  }, [productsError]);

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

      <div className="flex-1">
        {!allowAdd && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle className="mb-0 w-full text-sm">
              برای افزودن کالا یا خدمت، ابتدا{" "}
              <Link href="/settings/card" className="text-secondary">
                از ایـنـجـا
              </Link>{" "}
              تنظیمات کارت بانکی خود را انجام دهید.
            </AlertTitle>
          </Alert>
        )}

        {products.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground text-sm">
              {t("no_products")}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 2xl:grid-cols-4">
            {products.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                handleDelete={handleDelete}
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
