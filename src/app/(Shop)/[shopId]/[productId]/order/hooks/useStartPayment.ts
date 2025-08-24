import { useState } from "react";
import { useCheckout } from "../useCheckout";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui-custom/use-toast";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import { OrderNamespace } from "@/types/order/order.namespace";
import { ORDER_PAYMENT_METHODS } from "@/types/order/order.enum";

export default function useStartPayment() {
  const [loading, setLoading] = useState<boolean>(false);
  const {
    pendingOrder,
    productId,
    shopId,
    orderQuantity,
    setStep,
    paymentMethod,
  } = useCheckout();


  const t_ec = useTranslations("ERROR_CODES");
  const router = useRouter();

  async function startPayment() {
    setLoading(true);
    await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${pendingOrder?.id}/startPayment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: orderQuantity,
          paymentMethod,
        }),
        credentials: "include",
      }
    )
      .then(async (res) => {
        if (res.ok) {
          const json: OrderNamespace.POST.StartPayment = await res.json();
          await mutate(
            (key) => typeof key === "string" && key.includes("pending")
          );
          if (paymentMethod === ORDER_PAYMENT_METHODS.ZARINPAL) {
            router.push(json.data.link!);
            return;
          }
          setStep(4);
          return;
        }

        const resJson = (await res.json()) as unknown as ExceptionMessage;

        toast({
          title: t_ec(resJson.code),
          ...(resJson.code === "PRODUCT_OUT_OF_STOCK" && {
            description: "تعداد سفارش را کاهش دهید",
          }),
          variant: "destructive",
        });

        await mutate(key => typeof key === 'string' && (key.includes("/products")))
      })
      .catch((e) => {
        toast({
          title: t_ec("CHECK_CONNECTION"),
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return {
    loading,
    startPayment,
  };
}
