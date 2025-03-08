import api from "./swr/api-client";
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { InstagramNamespace } from "@/types/instagram";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function useConnectInstagram() {
  const t = useTranslations("Settings.Accounts");
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
        toast({
          title: t("instagramConnected"),
        });
      })
      .catch((e) => {
        toast({
          title: t("instagramConnectionError"),
          variant: "destructive",
        });
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
