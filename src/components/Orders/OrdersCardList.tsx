"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import useSWRImmutable from "swr/immutable";

import {
  ItemsPagination,
  LoaderSpin,
  NoDataError,
  ProductCard,
} from "@components";
import { PageMeta } from "@/schemas/pageMeta";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeaturesStore";
import { OrderCard } from "./OrderCard";
import { OrderNamespace } from "@/types/order/order.namespace";
import EditOrderDialog from "@/app/(Console)/orders/components/editOrderDialog";

interface OrdersCardListProps {
  search: string;
}

export const OrdersCardList = ({ search }: OrdersCardListProps) => {
  const t = useTranslations("Orders.List");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(21);
  const { setError } = useHeaderFeatures();
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] =
    useState<OrderNamespace.GET.OneItemOfOrders | null>(null);

  let searchParams = "";
  const debouncedSearchTerm = useDebounce(search, 500);
  search ? (searchParams = `&search=${debouncedSearchTerm}`) : null;
  const apiUrl = `/orders?page=${page}&limit=${limit}${searchParams}`;
  const {
    data: ordersData,
    error: ordersError,
    isLoading: isOrdersLoading,
    mutate: fetchOrders,
  } = useSWRImmutable<OrderNamespace.GET.Orders>(apiUrl, {
    revalidateOnMount: true,
  });
  const orders = ordersData?.items ?? [];

  // ------- Pagination Start -------
  const defaultMeta: PageMeta = {
    currentPage: page,
    itemsPerPage: limit,
    itemCount: 0,
    totalItems: 0,
    totalPages: 1,
  };
  const meta: PageMeta = ordersData?.meta ?? defaultMeta;

  const onPageChange = useCallback(
    (newPage: number) => setPage(Math.max(1, newPage)),
    [],
  );

  const onLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);
  // ------- Pagination End -------

  useEffect(() => {
    if (ordersError) {
      setError(true);
    }
  }, [ordersError]);

  if (ordersError) {
    return <NoDataError />;
  }

  if (isOrdersLoading) {
    return <LoaderSpin />;
  }

  return (
    <>
      <EditOrderDialog
        open={openOrderDialog}
        setOpen={setOpenOrderDialog}
        order={selectedOrder}
      />

      <div className="flex-1">
        {orders.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground text-sm">
              {t("no_orders")}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 2xl:grid-cols-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                setOpenOrderDialog={setOpenOrderDialog}
                setSelectedOrder={setSelectedOrder}
              />
            ))}
          </div>
        )}
      </div>
      <ItemsPagination
        isLoading={isOrdersLoading}
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
