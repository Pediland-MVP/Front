import { mutateIncludeStringKey } from "@/app/utils/mutateIncludeStringKey";
import LoadingSpinner from "@/components/theme/ui/loadingSpinner";
import useConnectInstagram from "@/hooks/useConnectInstagram";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { mutate } from "swr";

export default function ConnectInstagram() {
  const { callbackIG, isCallbackIGLoading } = useConnectInstagram();

  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter()

  useEffect(() => {
    if (code) {
       callbackIG(code).then(async () => {
        router.push('/settings/instagram')
        await mutate(mutateIncludeStringKey('me'));
      })
    }
  }, [searchParams]);

  return (
    <div>
      <LoadingSpinner />
      <p>Connecting to instagram...</p>
    </div>
  );
}
