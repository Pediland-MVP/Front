import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import useConnectInstagram from "@/hooks/useConnectInstagram";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { mutate } from "swr";

export default function ConnectInstagram() {
  const { callbackIG, isCallbackIGLoading } = useConnectInstagram();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter()

  const t = useTranslations('Settings.Accounts.ConnectInstagram')

  useEffect(() => {
    const submitCode = async (code: string) => {
      callbackIG(code).then(async () => {
        router.push('/automations')
        await mutate(mutateIncludeStringKey('me'));
      })
    }
    if (code) {
      submitCode(code)
    }
  }, [searchParams]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-y-3">
      <LoadingSpinner size={'lg'} />
      <p className="font-medium" >{t('connecting')}</p>
    </div>
  );
}
