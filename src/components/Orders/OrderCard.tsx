"use client";

import { cn } from "@/lib/utils";
import { OrderNamespace } from "@/types/order/order.namespace";
import { toJalaliDate } from "@/utils/jalali";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { memo } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui";
import {
  AlertTriangleIcon,
  BarcodeIcon,
  CheckCircleIcon,
  HourglassIcon,
  InfoIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react";
import { CardImage } from "../Global/CardImage";

interface OrderCardComponentProps {
  order: OrderNamespace.GET.OneItemOfOrders;
  setOpenOrderDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedOrder: React.Dispatch<
    React.SetStateAction<OrderNamespace.GET.OneItemOfOrders | null>
  >;
}

type OrderStatus =
  | "payment"
  | "processing"
  | "sending"
  | "completed"
  | "invalid_data"
  | "cancelled";

const STATUS_MAP: Record<
  OrderStatus,
  {
    bg: string;
    text: string;
    icon: React.ElementType;
  }
> = {
  payment: {
    bg: "bg-gray-100 hover:bg-gray-100",
    text: "text-gray-500 hover:text-gray-500",
    icon: InfoIcon,
  },
  processing: {
    bg: "bg-orange-100 hover:bg-orange-100",
    text: "text-orange-500 hover:text-orange-500",
    icon: HourglassIcon,
  },
  sending: {
    bg: "bg-orange-100 hover:bg-orange-100",
    text: "text-orange-500 hover:text-orange-500",
    icon: TruckIcon,
  },
  completed: {
    bg: "bg-green-100 hover:bg-green-100",
    text: "text-green-600 hover:text-green-600",
    icon: CheckCircleIcon,
  },
  invalid_data: {
    bg: "bg-red-100 hover:bg-red-100",
    text: "text-red-500 hover:text-red-500",
    icon: AlertTriangleIcon,
  },
  cancelled: {
    bg: "bg-red-100 hover:bg-red-100",
    text: "text-red-500 hover:text-red-500",
    icon: XCircleIcon,
  },
};

const OrderCardComponent = ({
  order,
  setOpenOrderDialog,
  setSelectedOrder,
}: OrderCardComponentProps) => {
  const router = useRouter();
  const t = useTranslations("Orders.Card");

  const customerName =
    (order.lead?.contact?.firstname || "") +
    " " +
    (order.lead?.contact?.lastname || "");

  const province = order.orderShipping?.city?.province?.name?.trim();
  const city = order.orderShipping?.city?.name?.trim();
  const status = order.status as OrderStatus;
  const { bg, text, icon: Icon } = STATUS_MAP[status] || STATUS_MAP.payment;

  const customerAddress =
    province && city
      ? province === city
        ? city
        : `${province}، ${city}`
      : province || city || "...";

  return (
    <Card className="gap-0 border-violet-200 p-0 shadow-violet-200">
      <CardContent className="flex-1 p-2">
        <div className="flex gap-1.5">
          <div className="flex flex-col gap-2">
            <div className="relative h-20 w-20">
              <CardImage
                src={
                  order.orderProducts[0]?.product?.images[0].url ||
                  "/images/placeholder.webp"
                }
                alt={order.orderProducts[0]?.product?.title || ""}
              />
            </div>
            <div className="text-secondary flex flex-1 justify-center text-[13px]">
              <Badge
                variant="outline"
                className="text-muted-foreground h-6 rounded-full font-normal"
              >
                {order.orderProducts?.[0]?.product?.isDigital
                  ? t("digital")
                  : t("physical")}
              </Badge>
            </div>
          </div>

          <div className="flex flex-1 flex-col space-y-2 overflow-hidden p-1 text-[13px]">
            <div className="text-primary font-medium">
              {order.orderProducts?.[0]?.product?.title}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground truncate">
                تاریخ سفارش:
              </span>
              <span className="text-secondary">
                {toJalaliDate(order.createDate)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-secondary">
                {customerName} از {customerAddress}
              </span>
            </div>
            <div className="text-secondary flex items-center gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-medium">
                  {order.orderProducts?.[0]?.quantity}
                </span>
                <span>{t("number")}</span>
              </div>
              <span className="text-muted-foreground">از طریق</span>
              <div>
                {order.paymentMethod === "card_to_card"
                  ? t("card_to_card")
                  : t("zarinpal")}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground truncate">مبلغ:</span>
              <span
                className={cn(
                  "",
                  typeof order.orderProducts?.[0]?.discountPrice === "number"
                    ? "text-muted-foreground font-light line-through"
                    : "text-secondary font-semibold",
                )}
              >
                {order.orderProducts?.[0]?.price.toLocaleString()}
              </span>
              {typeof order.orderProducts?.[0]?.discountPrice === "number" && (
                <span className="text-secondary font-semibold">
                  {order.orderProducts?.[0]?.discountPrice?.toLocaleString()}
                </span>
              )}
              <span className="text-secondary text-[13px]">{t("tooman")}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex rounded-b-xl bg-gray-100 p-0">
        <Button
          className={cn(
            "h-9 w-full flex-1 cursor-auto gap-1 rounded-none rounded-br-xl",
            bg,
            text,
          )}
          variant="ghost"
          type="button"
          size="sm"
        >
          <Icon className={cn("size-4", text)} />
          {t(status)}
        </Button>
        <Button
          className="text-muted-foreground hover:text-secondary h-9 w-full flex-1 rounded-none rounded-bl-xl hover:bg-blue-100"
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => {
            setOpenOrderDialog(true);
            setSelectedOrder(order);
          }}
        >
          <BarcodeIcon className="text-secondary" />
          {t("order_details")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const OrderCard = memo(OrderCardComponent);
