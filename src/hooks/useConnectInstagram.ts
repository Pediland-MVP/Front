import api from "./swr/api-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { InstagramNamespace } from "@/types/instagram";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mutate } from "swr";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";

export default function useConnectInstagram() {
  const t = useTranslations("Settings.Accounts");
  const t_ec = useTranslations("ERROR_CODES");
  const router = useRouter();
  const [isCallbackIGLoading, setIsCallbackIGLoading] = useState(false);

  const connectIG = async () => {
    api
      .get<InstagramNamespace.GET.RedirectLink>("/instagram/connectIG")
      .then((res) => {
        router.push(res.data.data.link);
      });
  };

  const callbackIG = async (code: string) => {
    setIsCallbackIGLoading(true);
    await api
      .get(`/instagram/callbackIG?code=${code}`)
      .then(async (res) => {
        router.push("/");
        await mutate(mutateIncludeStringKey("me"));
        toast.success(t("instagramConnected"));
      })
      .catch((error: AxiosError<ExceptionMessage>) => {
        const code = error.response?.data?.code;
        // The server may return a code that has no translation (missing key or
        // an unexpected error). In that case show the raw server code so the
        // user sees something meaningful instead of the literal "ERROR_CODES.*"
        // fallback. With no code at all (e.g. network error) fall back to the
        // generic connection message.
        toast.error(
          code ? (t_ec.has(code) ? t_ec(code) : code) : t_ec("CHECK_CONNECTION"),
        );
      })
      .finally(() => {
        setIsCallbackIGLoading(false);
      });
  };

  return {
    connectIG,
    isCallbackIGLoading,
    callbackIG,
  };
}
