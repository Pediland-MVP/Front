import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import useConnectInstagram from "@/hooks/useConnectInstagram";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { mutate } from "swr";

export default function ConnectInstagram() {
  const { callbackIG, isCallbackIGLoading } = useConnectInstagram();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter();

  const t = useTranslations("Settings.Accounts.ConnectInstagram");

  useEffect(() => {
    const submitCode = async (code: string) => {
      await callbackIG(code);
    };
    if (code) {
      submitCode(code);
    }
  }, [searchParams]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-y-3">
      <LoaderSpin />
      <p className="font-medium">{t("connecting")}</p>
    </div>
  );
}
