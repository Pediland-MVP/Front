"use client";

import { useState } from "react";
import Link from "next/link";
import { Pagination } from "./pagination";
import useSWRImmutable from "swr/immutable";
import { fetcher } from "@/hooks/swr/fetcher";
import useDebounce from "@/hooks/useDebounce";
// import EditContactDialog from "./editContactDialog";
import { useLocale, useTranslations } from "next-intl";
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
import { Eye, Pencil } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/theme/ui/card";
import OrderListSkeleton from "./orderListSkeleton";
import { Badge } from "@/components/ui/badge";
import EditOrderDialog from "./editOrderDialog";
import CardToCardDialog from "./cardToCard.dialog";
import { ORDER_STATUS, OrderNamespace } from "@/types/order/order.namespace";
import useSWR from "swr";
import { ORDER_PAYMENT_METHODS } from "@/types/order/order.enum";

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
  const [limit, setLimit] = useState<number>(10);
  // const [orders, setContacts] = useState<ContactNamespace.Contacts>([]);
  const [page, setPage] = useState<number>(1);
  const debouncedSearchTerm = useDebounce(search, 500);
  const [open, setOpen] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>("");

  const {
    data: ordersData,
    error: ordersError,
    isLoading: isOrdersLoading,
    mutate: fetchOrders,
  } = useSWR<OrderNamespace.GET.Orders>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders?page=${page}&limit=${limit}${search ? `&search=${debouncedSearchTerm}` : ""}`,
    fetcher
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

  const handleSelect = (orderId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const t = useTranslations("Orders.List");
  const locale = useLocale();

  return (
    <Card className="border-b-2 border-gray-100">
      {/* <EditContactDialog orderId={orderId} open={open} setOpen={setOpen} /> */}
      <EditOrderDialog
        open={open}
        setOpen={setOpen}
        order={orders.find((order: any) => order.id === orderId)!}
      />

      <div className="_table">
        <Table className=" min-h-[1140]">
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort("name")}
                className={`cursor-pointer hover:text-black lg:w-[10%] ${locale === "fa" ? "text-right" : "text-left"}`}
              >
                {t("product")}
              </TableHead>

              <TableHead className="lg:w-[2%] text-center">
                {t('paymentMethod')}
              </TableHead>

              <TableHead className="lg:w-[7%] text-center">
                {t("image")}
              </TableHead>

              <TableHead
                className="cursor-pointer text-center hover:text-black lg:w-[4%]"
                onClick={() => handleSort("username")}
              >
                {t("quantity")}
              </TableHead>

              <TableHead
                className="cursor-pointer text-center hover:text-black lg:w-[8%]"
                onClick={() => handleSort("messages")}
              >
                {t("price")}
              </TableHead>

              <TableHead
                className="cursor-pointer text-center hover:text-black lg:w-[8%]"
                onClick={() => handleSort("messages")}
              >
                {t("details")}
              </TableHead>

              <TableHead className="lg:w-[3%] _space">{t('status')}</TableHead>

              <TableHead className="text-center lg:w-[7%]">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody id="scrollableDiv">
            {isOrdersLoading ? (
              <OrderListSkeleton rowCount={limit} />
            ) : (
              orders.map((order) => {
                const totalPrice = order.orderProducts[0]?.quantity *
                order.orderProducts[0]?.price

                const realPrice = order.orderProducts[0]?.quantity *
                order.orderProducts[0]?.product.price

                const isInDiscount = totalPrice !== realPrice

                return(
                <TableRow
                  key={order.id}
                  className={selectedLeads.includes(order.id) ? "bg-muted" : ""}
                >
                  <TableCell className="">
                    <Link
                      href={`/console/products/${order?.orderProducts[0]?.product?.id}`}
                      target="_blank"
                      className="hover:text-pink-700 flex justify-start items-center gap-x-3"
                    >
                      <ImageWithFallback
                        src={
                          order.orderProducts[0]?.product.images[0].url ??
                          '/images/no-image.png'
                        }
                        fallbackSrc='/images/no-image.png'
                        alt={`${order.id} order`}
                        width={70}
                        height={70}
                        className="rounded-sm"
                      />
                      <p className="text-md font-medium">
                        {order.orderProducts[0]?.product.title}
                      </p>
                    </Link>
                  </TableCell>

                  <TableCell>
                        {order.paymentMethod === ORDER_PAYMENT_METHODS.CARD_TO_CARD ? 'کارت به کارت' : 'زرین پال'}
                  </TableCell>

                  <TableCell className="flex justify-center">
                    <CardToCardDialog url={order?.orderCardToCard?.url || '/images/no-image.png'} />
                  </TableCell>

                  <TableCell className="text-center">
                    {order.orderProducts[0]?.quantity}
                  </TableCell>

                  <TableCell className="text-center">
                    <span dir="ltr" className={`${isInDiscount && 'line-through'}`}>
                      {(
                        realPrice
                      ).toLocaleString()}
                      </span>
                      <br />
                      {isInDiscount && <span>{totalPrice.toLocaleString()}</span>}
                  </TableCell>

                  <TableCell className="_space">
                    {`${order.lead.contact.firstname} ${order.lead.contact.lastname}${(order?.shipping?.city?.name && order?.shipping?.city?.province?.name) ? `\n ${order.shipping.city.name}, ${order.shipping.city.province.name}` : ''}`}
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

                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Pencil
                        size={20}
                        weight="light"
                        className="text-gray-500 hover:text-pink-700 cursor-pointer"
                        onClick={() => {
                          setOpen(true);
                          setOrderId(order.id);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )})
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
