import { toast } from 'sonner';
import { ExceptionMessage } from '@/types/exceptionMessage';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export const useUpdateAttributes = () => {
  const [loading, setLoading] = useState(false);
  const t = useTranslations('Checkout');
  const t_ec = useTranslations('ERROR_CODES');

  const updateAttributes = async (attributeValueIds: number[]) => {
    setLoading(true);
    await fetch(`${API_URL}/orders/updateAttributes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        attributeValueIds,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          return;
        }

        const resJson = (await res.json()) as ExceptionMessage;
        toast.error(t_ec(resJson.code));
      })
      .catch((e) => {
        toast.error(t_ec('CHECK_CONNECTION'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return {
    updateAttributes,
    isUpdateAttributesLoading: loading,
  };
};
