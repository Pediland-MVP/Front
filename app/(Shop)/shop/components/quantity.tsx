"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ExceptionMessage } from "@/types/exceptionMessage";

type QuantityProps = {
    orderQuantity: number;
    productQuantity: number
}
export function Quantity({ orderQuantity: _orderQuantity, productQuantity: _productQuantity }: QuantityProps) {
  const [orderQuantity, setOrderQuantity] = useState(_orderQuantity);
  const [productQuantity, setProductQuantity] = useState(_productQuantity)
  const [isPending, setIsPending] = useState(false);

  const handleAdjustment = async (adjustment: "increment" | "decrement") => {
    setIsPending(true);
    const shopId = "ba4c3ff2-4b94-47a1-97c7-f041c73dbd49";
    const orderId = "c3d5d99e-cab2-4082-ad1d-16e67c04b926";
    const secret = "d7220ce2-8780-4be8-a95d-8f5dea9ff6cc";

    if (adjustment === 'increment' && orderQuantity === productQuantity) {
      toast({
        title: "موجودی انبار کافی نیست",
        variant: "destructive",
      });
      return
    }

    await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${orderId}/${secret}/${adjustment === 'decrement' ? 'quantityDown' : 'quantityUp'}`,
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
    <div className="flex items-center justify-start gap-x-3">        
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleAdjustment("decrement")}
            disabled={isPending || orderQuantity <= 1}
            type="button"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        <div className="text-4xl font-bold select-none">{orderQuantity}</div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleAdjustment("increment")}
            disabled={isPending || productQuantity === 0 || orderQuantity === productQuantity}
            type="button"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        
      
    </div>
  );
}
