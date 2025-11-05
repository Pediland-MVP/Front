import { useFormContext } from "react-hook-form";
import { set, z } from "zod";
import { orderFormSchema } from "../../../../../../components/Shop/CheckoutPage";
import { useCheckout } from "../useCheckout";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import useCheckoutStep from "./useCheckoutStep";
import { OrderNamespace } from "@/types/order/order.namespace";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function useShipping() {
  const { getValues } = useFormContext<z.infer<typeof orderFormSchema>>();
  const { setStep, pendingOrder } = useCheckout();

  const { nextStep } = useCheckoutStep();

  const t_ec = useTranslations("ERROR_CODES");
  const [loading, setLoading] = useState(false);

  const { productId } = useCheckout();
  const router = useRouter();

  const updateShipping = async (values?: z.infer<typeof orderFormSchema>) => {
    setLoading(true);
    const { cityId, address, postalcode } = values || getValues();
    await fetch(`${API_URL}/orders/${pendingOrder?.id}/updateShipping`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cityId,
        address,
        postalcode,
        productIds: [productId],
      }),
      credentials: "include",
    })
      .then(async (res) => {
        if (res.ok) {
          const json = (await res.json()) as OrderNamespace.POST.UpdateShipping;
          if (json.code === "PAID_FREE") {
            router.push("/payments/verify?ItsFree=true");
            return;
          }
          setStep(nextStep());
          return;
        }
        const resJson = (await res.json()) as ExceptionMessage;
        toast.error(t_ec(resJson.code));
      })
      .catch(() => toast.error(t_ec("CHECK_CONNECTION")))
      .finally(() => setLoading(false));
  };

  return {
    updateShipping,
    loading,
  };
}
