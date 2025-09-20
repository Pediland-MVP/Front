import { toast } from "sonner";
import { useCheckout } from "../useCheckout";
import { useTranslations } from "next-intl";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { useState } from "react";

export default function useProcessOrder() {
  const { pendingOrder, setIsCompleted } = useCheckout();
  const [loading, setLoading] = useState(false);
  const t = useTranslations("Checkout");
  const t_ec = useTranslations("ERROR_CODES");

  async function processOrder() {
    setLoading(true);
    await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${pendingOrder?.id}/process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    )
      .then(async (res) => {
        if (res.ok) {
          setIsCompleted(true);
          return;
        }

        const resJson = (await res.json()) as ExceptionMessage;
        toast.error(t_ec(resJson.code));
      })
      .catch(() => {
        toast.error(t_ec("CHECK_CONNECTION"));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return {
    processOrder,
    loading,
  };
}
