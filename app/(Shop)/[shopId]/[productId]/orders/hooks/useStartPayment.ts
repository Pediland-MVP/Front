import { useState } from "react";
import { useCheckout } from "../useCheckout";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { useTranslations } from "next-intl";
import { toast } from "@/components/theme/ui/use-toast";

export default function useStartPayment() {
  const [loading, setLoading] = useState<boolean>(false);
  const { pendingOrder, productId, shopId, orderQuantity, setStep } = useCheckout();
  const t_ec = useTranslations("ERROR_CODES");

  async function startPayment() {
    setLoading(true);
    await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${pendingOrder!.id}/startPayment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: orderQuantity,
        }),
        credentials: "include",
      }
    )
      .then(async (res) => {
        if (res.ok) {
          setStep(4);
          return;
        }

        const resJson = await res.json() as unknown as ExceptionMessage;
        console.log(resJson)
        if (!res.ok) {
          toast({
            title: t_ec(resJson.code),
            variant: "destructive",
          });
        }
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
    startPayment
  }
}
