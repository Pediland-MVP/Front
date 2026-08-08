'use client';

import api from '@/hooks/swr/api-client';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import { ExceptionMessage } from '@/types/exceptionMessage';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { mutate } from 'swr';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { XCircleIcon } from '@phosphor-icons/react/dist/csr/XCircle';

const REDIRECT_DELAY_SEC = 4;

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Subscription.Verify');
  const t_ec = useTranslations('ERROR_CODES');

  const [refId, setRefId] = useState<string | null>(null);
  const [pooled, setPooled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<ExceptionMessage | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY_SEC);

  useEffect(() => {
    mutate(mutateIncludeStringKey('plans'));
  }, []);

  useEffect(() => {
    const authority = searchParams.get('Authority');
    const zarinpalStatus = searchParams.get('Status');
    const trackId = searchParams.get('trackId');

    // Detect which gateway sent us back: Zibal returns `trackId`, Zarinpal
    // returns `Authority` + `Status`. The backend verify endpoint is generic
    // (`/payments/subscription/:gatewayType/verify`) and re-verifies server-side.
    const gatewayType = trackId ? 'zibal' : authority && zarinpalStatus ? 'zarinpal' : null;

    if (!gatewayType) {
      // Not a real gateway callback (e.g. a direct visit) — never fake success.
      setIsLoading(false);
      return;
    }

    api
      .get(`/payments/subscription/${gatewayType}/verify?${searchParams.toString()}`)
      .then(async (res) => {
        setRefId(res.data?.data?.ref_id ?? null);
        setPooled(Boolean(res.data?.data?.pooled));
        setVerified(true);
        setIsLoading(false);
        // The subscription is already activated server-side by this point
        // (verify awaits activation before responding), so redirecting only
        // needs to wait long enough for the user to read the success state.
        await mutate(mutateIncludeStringKey('subscription'));
      })
      .catch((e) => {
        setError(e.response?.data ?? null);
        setIsLoading(false);
      });
  }, [searchParams, router]);

  useEffect(() => {
    if (!verified) return;
    if (secondsLeft <= 0) {
      router.push(pooled ? '/connect' : '/settings/instagram?isAfterPurchasingPlan');
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [verified, pooled, secondsLeft, router]);

  const redirectProgress = ((REDIRECT_DELAY_SEC - secondsLeft) / REDIRECT_DELAY_SEC) * 100;

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      {isLoading ? (
        <LoaderSpin />
      ) : verified ? (
        <Card className="w-full max-w-sm items-center gap-3 px-6 py-8 text-center md:px-10">
          <CheckCircleIcon weight="duotone" className="text-green-600" size={72} />

          <h1 className="text-lg font-semibold text-green-600">{t('sucessFull')}</h1>

          <p className="text-muted-foreground text-sm leading-6">{t('sucessFullDescription')}</p>

          {refId && (
            <span className="mt-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-black/50">
              {t('refId', { refId })}
            </span>
          )}

          <div className="mt-3 flex w-full flex-col items-center gap-1.5">
            <Progress value={redirectProgress} className="h-1.5" />
            <span className="text-muted-foreground text-xs">
              {t('redirecting', { seconds: secondsLeft })}
            </span>
          </div>

          <Button variant="outline" size="sm" className="mt-1" onClick={() => setSecondsLeft(0)}>
            {t('redirectNow')}
          </Button>
        </Card>
      ) : (
        <Card className="w-full max-w-sm items-center gap-3 px-6 py-8 text-center md:px-10">
          <XCircleIcon weight="duotone" className="text-destructive" size={72} />

          <h1 className="text-destructive text-lg font-semibold">{t('error')}</h1>

          <p className="text-muted-foreground text-sm leading-6">
            {error?.code ? t_ec(error.code) : t_ec('SERVER_CONNECTION_ERROR')}
          </p>
        </Card>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <LoaderSpin />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
