'use client';

import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import { toast } from 'sonner';
import api from '@/hooks/swr/api-client';
import { ExceptionMessage } from '@/types/exceptionMessage';
import { PaymentNamespace } from '@/types/payments/payment.namespace';
import { AxiosError, AxiosResponse } from 'axios';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { mutate } from 'swr';

export default function useVerifyPlanPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const t_ec = useTranslations('ERROR_CODES');

  const verify = async () => {
    setIsLoading(true);
    await api
      .get(
        '/payments/subscription/zarinpal/verify?Authority=' +
          searchParams.get('Authority') +
          '&Status=' +
          searchParams.get('Status'),
      )
      .then(async (res: AxiosResponse<PaymentNamespace.GET.SubscriptionPaymentVerify>) => {
        await mutate(mutateIncludeStringKey('me'));
        return res.data.data.ref_id;
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        toast.error(t_ec(e.response?.data?.code));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return {
    isLoading,
    verify,
  };
}
