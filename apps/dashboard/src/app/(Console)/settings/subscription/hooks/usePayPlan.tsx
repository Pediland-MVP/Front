import api from '@/hooks/swr/api-client';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import { AxiosError, AxiosResponse } from 'axios';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { SubscriptionContext } from '../../../../../store/subscriptionStore';
// TODO: Refactor Types & Schemas
import { ExceptionMessage } from '@/types/exceptionMessage';
import { SubscriptionNamespace } from '@/types/subscriptions/subscription.namspace';

export default function usePayPlan() {
  const router = useRouter();
  const t_ec = useTranslations('ERROR_CODES');
  const t_rc = useTranslations('RESPONSE_CODES');
  const [isPayLoading, setIsPayLoading] = useState<boolean>(false);

  const pay = async (
    values: { planId: number; durationId: number; discountCode?: string; instagramId?: string },
    setActive: SubscriptionContext['setActive'],
  ) => {
    setIsPayLoading(true);
    await api
      .post('/subscriptions/subscribe', values)
      .then(async (res: AxiosResponse<SubscriptionNamespace.POST.Subscribe>) => {
        if (res.data.code === 'PAID_FREE') {
          toast.success(t_rc(res.data.code));
          await mutate(mutateIncludeStringKey('subscriptions'));
          mutate(mutateIncludeStringKey('plans'));
          setActive({
            choosePlan: false,
            subscriptionInfo: true,
          });
          return;
        }
        router.push(res.data.data.link);
        return;
      })
      .catch(async (e: AxiosError<ExceptionMessage>) => {
        const error = t_ec(e.response?.data.code);
        toast.error(error);
      })
      .finally(() => {
        setIsPayLoading(false);
      });
  };

  return {
    isPayLoading,
    pay,
  };
}
