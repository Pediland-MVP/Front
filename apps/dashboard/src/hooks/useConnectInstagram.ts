import api from './swr/api-client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { InstagramNamespace } from '@/types/instagram';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { mutate } from 'swr';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';

export default function useConnectInstagram() {
  const t = useTranslations('Settings.Accounts');
  const t_ec = useTranslations('ERROR_CODES');
  const router = useRouter();
  const [isCallbackIGLoading, setIsCallbackIGLoading] = useState(false);

  const connectIG = async () => {
    api.get<InstagramNamespace.GET.RedirectLink>('/instagram/connectIG').then((res) => {
      router.push(res.data.data.link);
    });
  };

  const callbackIG = async (code: string) => {
    setIsCallbackIGLoading(true);
    await api
      .get(`/instagram/callbackIG?code=${code}`)
      .then(async (res) => {
        await mutate(mutateIncludeStringKey('me'));
        mutate(mutateIncludeStringKey('plans'));
        router.push('/');
        toast.success(t('instagramConnected'));
      })
      .catch((error) => {
        toast.error(t_ec(error.response?.data?.code));
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
