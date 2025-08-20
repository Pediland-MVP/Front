"use client";
import useSWRImmutable from "swr/immutable";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { useEffect } from "react";
import { mutate } from "swr";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const {
    data: refId,
    isLoading,
    error,
  } = useSWRImmutable(
    searchParams.get("Authority") && searchParams.get("Status")
      ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/payments/subscription/zarinpal/verify?Authority=${searchParams.get("Authority")}&Status=${searchParams.get("Status")}`
      : null
  );
  const t = useTranslations("Upgrade.Verify");
  const t_ec = useTranslations("ERROR_CODES");

  useEffect(() => {
    mutate(mutateIncludeStringKey("plans"))
  }, [])

  const router = useRouter()

  useEffect(() => {
    if (refId) {
      router.push(`/settings/instagram?isAfterPurchasingPlan`)
    }
  }, [refId, router])

  return (
    <div className="w-full h-full flex flex-col gap-y-2 justify-center items-center">
      {isLoading ? (
        <LoadingSpinner/>
      ) : error ? (
        <>
            <p className="text-4xl font-bold text-red-600">{t("error")}</p>
            <p>{t_ec((error.data as ExceptionMessage)?.code)}</p>
        </>
      ) :
      (
        <>
          <p className="text-4xl font-bold text-green-600">{t("sucessFull")}</p>
          <p>{t("sucessFullDescription")}</p>
          <p>{t("refId", { refId: refId?.data?.ref_id })}</p>
        </>
      )}
    </div>
  );
}
