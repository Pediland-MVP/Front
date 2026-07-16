'use client';
import { toast } from 'sonner';
import { PaymentNamespace } from '@/types/payments/payment.namespace';
import { useTranslations } from 'next-intl';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, CopyIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const Authority = searchParams.get('Authority');
  const Status = searchParams.get('Status') as 'OK' | 'NOK' | null;
  const ItsFree = searchParams.get('ItsFree') === 'true';
  const t_ec = useTranslations('ERROR_CODES');
  const [isLoading, setIsLoading] = useState(false);
  const [isOk, setIsOk] = useState<boolean>();
  const [response, setResponse] = useState<PaymentNamespace.GET.OrderpaymentVerify>();
  const t = useTranslations('Checkout');

  useEffect(() => {
    if (ItsFree) {
      setIsOk(true);
      return;
    }

    if (!Authority && !Status) return;
    setIsLoading(true);
    fetch(`${API_URL}/payments/zarinpal/verify?Authority=${Authority}&Status=${Status}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (res.ok) {
          const json = (await res.json()) as PaymentNamespace.GET.OrderpaymentVerify;
          setIsOk(true);
          setResponse(json);
          return;
        }
        setIsOk(false);
      })
      .catch((e) => {
        toast.error(t_ec('CHECK_CONNECTION'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [Authority, Status, ItsFree]);

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Spinner className="text-primary size-8" />
      </div>
    );
  }

  return (
    <div className="flex h-svh items-center justify-center bg-gray-50 p-4">
      {isOk === true ? (
        <div className="_checkout flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border bg-white p-6 text-center shadow-sm md:p-10">
          <CheckCircleIcon weight="duotone" className="text-green-600" size={72} />

          <h1 className="text-lg font-semibold text-green-600">{t('orderProcessing')}</h1>

          <p className="text-muted-foreground text-sm leading-6">
            {response?.data.orderProcessText || t('orderProcessingDescription')}
          </p>

          {response?.data?.ref_id && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(String(response.data.ref_id));
                toast.success(t('refIdCopied'));
              }}
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-black/50 transition-colors hover:bg-gray-200"
            >
              <span>
                {t('refId')}: {response.data.ref_id}
              </span>
              <CopyIcon size={14} />
            </button>
          )}
        </div>
      ) : (
        isOk === false && (
          <div className="_checkout flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border bg-white p-6 text-center shadow-sm md:p-10">
            <XCircleIcon weight="duotone" className="text-destructive" size={72} />

            <h1 className="text-destructive text-lg font-semibold">{t('paymentFailed')}</h1>

            <p className="text-muted-foreground text-sm leading-6">
              {t('paymentFailedDescription')}
            </p>

            <Button variant="outline" className="mt-2" onClick={() => router.back()}>
              {t('back')}
            </Button>
          </div>
        )
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-svh items-center justify-center">
          <Spinner className="text-primary size-8" />
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
