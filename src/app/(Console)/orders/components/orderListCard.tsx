"use client";

import { useState } from "react";
import Link from "next/link";
import { Pagination } from "./pagination";
import useDebounce from "@/hooks/useDebounce";
// import EditContactDialog from "./editContactDialog";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/theme/ui/table";
import ImageWithFallback from "@/components/ui/imageWithCallback";
import { Pencil } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/theme/ui/card";
import OrderListSkeleton from "./orderListSkeleton";
import { Badge } from "@/components/ui/badge";
import EditOrderDialog from "./editOrderDialog";
import CardToCardDialog from "./cardToCard.dialog";
import { ORDER_STATUS, OrderNamespace } from "@/types/order/order.namespace";
import useSWR from "swr";
import { ORDER_PAYMENT_METHODS } from "@/types/order/order.enum";
import moment from "moment-jalaali";
import { cn } from "@/lib/utils";
import { getOrderPrices } from "@/utils/getOrderPrices";

type Lead = {
  profile: string;
  name: string;
  username: string;
  messages: number;
  lastSeen: string;
};

type OrderListCardProps = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
};

export default function OrderListCard({
  search,
  setSearch,
}: OrderListCardProps) {
  const [sortColumn, setSortColumn] = useState<keyof Lead>("messages");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(35);
  const [page, setPage] = useState<number>(1);
  const debouncedSearchTerm = useDebounce(search, 500);
  const [open, setOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] =
    useState<OrderNamespace.GET.OneItemOfOrders>();

  const {
    data: ordersData,
    error: ordersError,
    isLoading: isOrdersLoading,
    mutate: fetchOrders,
  } = useSWR<OrderNamespace.GET.Orders>(
    `/orders?page=${page}&limit=${limit}${search ? `&search=${debouncedSearchTerm}` : ""}`
  );
  const orders = ordersData?.items || [];
  const ordersMeta = ordersData?.meta || undefined;

  const onPageChange = (value: number) => {
    setPage(value);
  };

  const onPageSizeChange = (value: number) => {
    setLimit(value);
  };

  const handleSort = (column: keyof Lead) => {
    setSortColumn(column);
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const editOrderHandler = (order: OrderNamespace.GET.OneItemOfOrders) => {
    setOpen(true);
    setSelectedOrder(order);
  };

  const t = useTranslations("Orders.List");

  return (
    <Card className="border-b-2 border-gray-100">
      {/* <EditContactDialog orderId={orderId} open={open} setOpen={setOpen} /> */}
      <EditOrderDialog
        open={open}
        setOpen={setOpen}
        order={selectedOrder}
      />

      <div className="_table">
        <Table className="">
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort("name")}
                className={cn(
                  `cursor-pointer hover:text-black lg:w-[8%]`,
                  `text-center`
                )}
              >
                {t("product")}
              </TableHead>

              <TableHead className={cn("lg:w-[2%]", `text-center`)}>
                {t("paymentMethod")}
              </TableHead>

              <TableHead className={cn("lg:w-[3%]", `text-center`)}>
                {t("image")}
              </TableHead>

              <TableHead
                className={cn(
                  "cursor-pointer hover:text-black lg:w-[2%]",
                  `text-center`
                )}
              >
                {t("quantity")}
              </TableHead>

              <TableHead
                className={cn(
                  "cursor-pointer hover:text-black lg:w-[4%]",
                  `text-center`
                )}
              >
                {t("price")}
              </TableHead>

              <TableHead
                className={cn(
                  "cursor-pointer hover:text-black lg:w-[8%]",
                  `text-center`
                )}
                onClick={() => handleSort("messages")}
              >
                {t("details")}
              </TableHead>

              <TableHead className={cn("lg:w-[3%] _space", `text-center`)}>
                {t("status")}
              </TableHead>

              <TableHead className={cn("lg:w-[3%] _space", `text-center`)}>
                {t("date")}
              </TableHead>

              <TableHead className={cn("lg:w-[2%]", `text-center`)}>
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody id="scrollableDiv">
            {isOrdersLoading ? (
              <OrderListSkeleton rowCount={limit} />
            ) : (
              orders.map((order) => {

                const { isDiscount, paidPrice, totalPrice } = getOrderPrices(order.orderProducts);

                return (
                  <TableRow
                    key={order.id}
                    className={cn(
                      selectedLeads.includes(order.id) ? "bg-muted" : ""
                    )}
                  >
                    <TableCell>
                      <Link
                        href={`/products/${order?.orderProducts[0]?.product?.id}`}
                        target="_blank"
                        className="hover:text-pink-700 flex justify-start items-center gap-x-3"
                      >
                        <div className="relative w-16 h-16 roundedlg">
                          <ImageWithFallback
                            fill={true}
                            src={
                              order.orderProducts[0]?.product?.images[0].url ??
                              "/images/no-image.png"
                            }
                            fallbackSrc="/images/no-image.png"
                            alt={`${order.id} order`}
                            className="rounded-sm fill-background"
                          />
                        </div>
                        <p className="text-md font-medium">
                          {order.orderProducts[0]?.product?.title}
                        </p>
                      </Link>
                    </TableCell>

                    <TableCell>
                      {order.paymentMethod ===
                      ORDER_PAYMENT_METHODS.CARD_TO_CARD
                        ? "کارت به کارت"
                        : "زرین پال"}
                    </TableCell>

                    <TableCell className="flex justify-center">
                      <CardToCardDialog
                        url={
                          order?.orderCardToCard?.url || "/images/no-image.png"
                        }
                      />
                    </TableCell>

                    <TableCell className="text-center">
                      {order.orderProducts[0]?.quantity}
                    </TableCell>

                    <TableCell className="text-center">
                      <span
                        dir="ltr"
                        className={`${isDiscount && "line-through"}`}
                      >
                        {paidPrice.toLocaleString()}
                      </span>
                      <br />
                      {isDiscount && (
                        <span>{totalPrice.toLocaleString()}</span>
                      )}
                    </TableCell>

                    <TableCell className="_space text-center">
                      {`${order.lead.contact.firstname} ${order.lead.contact.lastname}${order?.orderShipping?.city?.name && order?.orderShipping?.city?.province?.name ? `\n ${order.orderShipping.city.name}, ${order.orderShipping.city.province.name}` : ""}`}
                    </TableCell>

                    <TableCell className="_space">
                      <Badge
                        variant={
                          order.status === ORDER_STATUS.COMPLETED
                            ? "success"
                            : order.status === ORDER_STATUS.CANCELLED
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {t(`orderStatus.${order.status}`)}
                      </Badge>
                    </TableCell>

                    <TableCell className="_space">
                      {moment(order.createDate).format("HH:MM jYYYY/jMM/jDD")}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Pencil
                          size={20}
                          weight="light"
                          className="text-gray-500 hover:text-pink-700 cursor-pointer"
                          onClick={() => editOrderHandler(order)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={page}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSize={limit}
        totalItems={ordersMeta?.totalItems || limit}
        totalPages={ordersMeta?.totalPages || 1}
      />
    </Card>
  );
}
