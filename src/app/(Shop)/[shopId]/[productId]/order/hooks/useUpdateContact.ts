import { useFormContext } from "react-hook-form";
import { useCheckout } from "../useCheckout";
import { mutate } from "swr";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useState } from "react";
import useCheckoutStep from "./useCheckoutStep";
import { OrderNamespace } from "@/types/order/order.namespace";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function useUpdateContact() {
  const { getValues } = useFormContext();
  const { pendingOrder, setStep } = useCheckout();
  const t_ec = useTranslations("ERROR_CODES");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const { nextStep } = useCheckoutStep();

  async function updateContact() {
    setLoading(true);
    await fetch(`${API_URL}/orders/${pendingOrder?.id}/updateContact`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        ...getValues(),
      }),
      credentials: "include",
    })
      .then(async (res) => {
        if (res.ok) {
          const json = (await res.json()) as OrderNamespace.POST.UpdateContact;
          if (json.code === "PAID_FREE") {
            router.push("/payments/verify?ItsFree=true");
            return;
          }
          mutate((key) => typeof key === "string" && key.includes("pending"));
          setStep(nextStep());
          return;
        }

        const resJson = (await res.json()) as ExceptionMessage;
        toast(t_ec(resJson.code));
      })
      .catch((e) => {
        toast(t_ec("CHECK_CONNECTION"));
      })
      .finally(() => setLoading(false));
  }

  return {
    updateContact,
    loading,
  };
}
