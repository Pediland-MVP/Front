"use client";

import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";

import { ExceptionMessage } from "@/types/exceptionMessage";

import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

function buildVerifyUrl(searchParams: URLSearchParams): string | null {
  const trackId = searchParams.get("trackId");
  const Authority = searchParams.get("Authority");

  if (trackId) {
    const success = searchParams.get("success") ?? "";
    const status = searchParams.get("status") ?? "";
    return `${API_URL}/payments/subscription/zibal/verify?trackId=${trackId}&success=${success}&status=${status}`;
  }

  if (Authority) {
    const Status = searchParams.get("Status") ?? "";
    return `${API_URL}/payments/subscription/zarinpal/verify?Authority=${Authority}&Status=${Status}`;
  }

  return null;
}

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Subscription.Verify");
  const t_ec = useTranslations("ERROR_CODES");

  const verifyUrl = buildVerifyUrl(searchParams);

  const {
    data: refId,
    isLoading,
    error,
  } = useSWRImmutable(verifyUrl);

  useEffect(() => {
    mutate(mutateIncludeStringKey("plans"));
  }, []);

  useEffect(() => {
    const run = async () => {
      if (refId) {
        await mutate(mutateIncludeStringKey("subscription"));
        router.push(`/settings/instagram?isAfterPurchasingPlan`);
      }
    };
    run();
  }, [refId, router]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-y-2">
      {isLoading ? (
        <LoaderSpin />
      ) : error ? (
        <>
          <p className="text-4xl font-bold text-red-600">{t("error")}</p>
          <p>
            {error.data
              ? t_ec((error.data as ExceptionMessage)?.code)
              : t_ec("SERVER_CONNECTION_ERROR")}
          </p>
        </>
      ) : (
        <>
          <p className="text-4xl font-bold text-green-600">{t("sucessFull")}</p>
          <p>{t("sucessFullDescription")}</p>
          <p>{t("refId", { refId: refId?.data?.ref_id })}</p>
        </>
      )}
    </div>
  );
}
