"use client";
import { toast } from "sonner";
import { PaymentNamespace } from "@/types/payments/payment.namespace";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { use, useEffect, useState } from "react";

type VerifyPageProps = {
  searchParams: Promise<{
    ItsFree?: boolean;
    Authority?: string;
    Status?: "OK" | "NOK";
  }>;
};
export default function VerifyPage({ searchParams }: VerifyPageProps) {
  const { Authority, Status, ItsFree } = use(searchParams);
  const t_ec = useTranslations("ERROR_CODES");
  const [isLoading, setIsLoading] = useState(false);
  const [isOk, setIsOk] = useState<boolean>();
  const [response, setResponse] =
    useState<PaymentNamespace.GET.OrderpaymentVerify>();
  const t = useTranslations("Checkout");

  useEffect(() => {
    if (ItsFree) {
      setIsOk(true);
      return;
    }

    if (!Authority && !Status) return;
    setIsLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/payments/zarinpal/verify?Authority=${Authority}&Status=${Status}`,
      {
        credentials: "include",
      },
    )
      .then(async (res) => {
        if (res.ok) {
          const json =
            (await res.json()) as PaymentNamespace.GET.OrderpaymentVerify;
          setIsOk(true);
          setResponse(json);
          return;
        }
        setIsOk(false);
      })
      .catch((e) => {
        toast.error(t_ec("CHECK_CONNECTION"));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [Authority, Status, ItsFree]);

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <span className="loading loading-spinner text-primary">
          درحال بارگزاری
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-svh items-center justify-center">
      {isOk === true ? (
        <div className="_checkout flex h-svh flex-col items-center justify-center rounded-xl border bg-white p-5 md:p-10">
          <Image
            src={"/images/emojies/smiling-face-with-hearts.webp"}
            height={200}
            width={200}
            alt={"قلب"}
          />
          <p className="text-center text-lg">
            {response?.data.orderProcessText || t("orderProcessingDescription")}
          </p>

          {response?.data?.ref_id && (
            <span className="text-xs text-black/40">
              کد رهگیری درگاه پرداخت:‌ {response.data.ref_id}
            </span>
          )}
        </div>
      ) : (
        isOk === false && (
          <div className="flex flex-col items-center justify-center gap-2">
            <Image
              src={"/images/emojies/broken-heart.webp"}
              height={200}
              width={200}
              alt={"قلب شکسته"}
            />
            <span className="text-primary text-2xl font-semibold">
              پرداخت با شکست مواجه شد
            </span>
          </div>
        )
      )}
    </div>
  );
}
