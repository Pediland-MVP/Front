"use client";

import { useState } from "react";
import { ExceptionMessage } from "@/types/exceptionMessage";
// UI
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Minus, Plus, Spinner } from "@phosphor-icons/react/dist/ssr";
import { useCheckout } from "../useCheckout";



export function Quantity() {
  const { orderId, token, shopId, product, orderQuantity: _orderQuantity } = useCheckout()
  const [orderQuantity, setOrderQuantity] = useState(_orderQuantity || 1);
  const [productQuantity, setProductQuantity] = useState(product?.quantity)
  const [isPending, setIsPending] = useState(false);

  const handleAdjustment = async (adjustment: "increment" | "decrement") => {
    setIsPending(true);

    if (adjustment === 'increment' && orderQuantity === productQuantity) {
      toast({
        title: "موجودی انبار کافی نیست",
        variant: "destructive",
      });
      return
    }

    await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${orderId}/${token}/${adjustment === 'decrement' ? 'quantityDown' : 'quantityUp'}`,
      {
        method: "POST",
        credentials: "include",
      }
    )
      .then(async (res) => {
        const response = await res.json()
        if (!res.ok) {
          switch ((response as ExceptionMessage).code) {
            case "ORDER_EXPIRED":
              toast({
                title: "سفارش شما منقضی شده است",
                variant: "destructive",
              });
              return;
            case "PRODUCT_OUT_OF_STOCK":
              toast({
                title: "موجودی انبار کافی نیست",
                variant: "destructive",
              });
              return;
            case "ORDER_QUANTITY_IS_ZERO":
              toast({
                title: "موجودی نمیتواند کمتر از صفر باشد",
                variant: "destructive",
              });
              return;
          }
        }

        setOrderQuantity(response.data.orderQuantity);
        setProductQuantity(response.productQuantity)
      })
      .catch((error) => {
        toast({
          title: "مشکلی پیش آمده است. ارتباط خود با شبکه را چک کنید",
          variant: "destructive",
        });
      })
      .finally(() => setIsPending(false));
  };

  return (
    <div className="flex items-center justify-start gap-x-2">
      <div className="text-[13px] text-gray-700 text-center">تعداد</div>

      <button
        onClick={() => handleAdjustment("decrement")}
        disabled={isPending || orderQuantity <= 1}
        type="button"
        className="rounded bg-gray-100 p-[3px] border"
      >
        {isPending ? (
          <Spinner size={12} className="animate-spin" />
        ) : (
          <Minus size={12} className={cn(orderQuantity <= 1 ? "text-gray-400" : "")} />
        )}
      </button>

      <div className="text-lg font-medium text-gray-600 select-none">{orderQuantity}</div>

      <button
        onClick={() => handleAdjustment("increment")}
        disabled={isPending || productQuantity === 0 || orderQuantity === productQuantity}
        type="button"
        className="rounded bg-gray-100 p-[3px] border"
      >
        {isPending ? (
          <Spinner size={12} className="animate-spin" />
        ) : (
          <Plus size={12} weight="bold" />
        )}
      </button>
    </div>
  );
}
