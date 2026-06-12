"use client";

import api from "@/hooks/swr/api-client";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { mutate } from "swr";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Subscription.Verify");
  const t_ec = useTranslations("ERROR_CODES");

  const [refId, setRefId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ExceptionMessage | null>(null);

  useEffect(() => {
    mutate(mutateIncludeStringKey("plans"));
  }, []);

  useEffect(() => {
    const authority = searchParams.get("Authority");
    const status = searchParams.get("Status");
    if (!authority || !status) {
      setIsLoading(false);
      return;
    }

    api
      .get(
        `/payments/subscription/zarinpal/verify?Authority=${authority}&Status=${status}`,
      )
      .then(async (res) => {
        setRefId(res.data?.data?.ref_id ?? null);
        setIsLoading(false);
        await mutate(mutateIncludeStringKey("subscription"));
        router.push(`/settings/instagram?isAfterPurchasingPlan`);
      })
      .catch((e) => {
        setError(e.response?.data ?? null);
        setIsLoading(false);
      });
  }, [searchParams, router]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-y-2">
      {isLoading ? (
        <LoaderSpin />
      ) : error ? (
        <>
          <p className="text-4xl font-bold text-red-600">{t("error")}</p>
          <p>
            {error.code
              ? t_ec(error.code)
              : t_ec("SERVER_CONNECTION_ERROR")}
          </p>
        </>
      ) : (
        <>
          <p className="text-4xl font-bold text-green-600">{t("sucessFull")}</p>
          <p>{t("sucessFullDescription")}</p>
          <p>{t("refId", { refId })}</p>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <LoaderSpin />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
