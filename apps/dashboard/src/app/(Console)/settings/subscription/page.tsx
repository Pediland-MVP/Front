'use client';

import { useTranslations } from 'next-intl';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LayoutSettings } from '@/components/Layout/LayoutSettings';
import { ChoosePlan } from '@/components/Settings/ChoosePlan';
import { SubscriptionsDetails } from '@/components/Settings/SubscriptionsDetails';
import { useIsWebView } from '@/hooks/useIsWebView';

export default function SubscriptionPage() {
  const t = useTranslations('Subscription');
  const t_ec = useTranslations('ERROR_CODES');
  const { can, isLoading } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const instagramId = searchParams.get('instagramId') ?? undefined;
  const isWebView = useIsWebView();
  // useIsWebView() defaults to `true` (fail-closed) until its own effect resolves — without this
  // gate, a real browser would briefly evaluate the block below before the check corrects itself.
  const [hasCheckedWebView, setHasCheckedWebView] = useState(false);
  useEffect(() => setHasCheckedWebView(true), []);

  useEffect(() => {
    if (hasCheckedWebView && isWebView) {
      router.replace('/');
    }
  }, [hasCheckedWebView, isWebView, router]);

  if (isLoading || !hasCheckedWebView || isWebView) {
    return (
      <LayoutSettings className="_subscription-page">
        <div className="flex h-[200px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
        </div>
      </LayoutSettings>
    );
  }

  if (!can('billing:view')) {
    return (
      <LayoutSettings className="_subscription-page">
        <div className="mb-3 space-y-1">
          <h2 className="text-primary font-semibold">{t('title')}</h2>
        </div>
        <div className="text-muted-foreground rounded-xl border bg-white py-12 text-center text-sm shadow-xs">
          {t_ec('PERMISSION_DENIED')}
        </div>
      </LayoutSettings>
    );
  }

  return (
    <LayoutSettings className="_subscription-page">
      <div className="mb-3 space-y-1">
        <h2 className="text-primary font-semibold">{t('title')}</h2>
      </div>

      <SubscriptionsDetails />

      <ChoosePlan instagramId={instagramId} />
    </LayoutSettings>
  );
}
