'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { SealCheckIcon, WarningCircleIcon } from '@phosphor-icons/react/dist/ssr';
import { Alert, AlertDescription, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { hasActiveCreditSubscription, getRemainingDays } from '@/utils/subscription';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';
import { useIsWebView } from '@/hooks/useIsWebView';

interface PageCoverageBadgeProps {
  instagramId: string;
}

const EXPIRING_SOON_THRESHOLD_DAYS = 7;

export function PageCoverageBadge({ instagramId }: PageCoverageBadgeProps) {
  const t = useTranslations('Settings.Accounts');
  const router = useRouter();
  const isWebView = useIsWebView();
  const { subscriptions } = useSubscriptionStore();

  const pageSubscription = subscriptions?.find(
    (sub) => sub.instagramId === instagramId && sub.status === SubscriptionStatusEnum.ACTIVE,
  );

  const reservedSubs =
    subscriptions?.filter(
      (sub) => sub.instagramId === instagramId && sub.status === SubscriptionStatusEnum.RESERVED,
    ) || [];

  const totalReservedDays = reservedSubs.reduce(
    (sum, sub) => sum + (sub.planDuration?.durationDays ?? 0),
    0,
  );

  const buyAdditionalRow = (
    <Button
      size="sm"
      variant="outline"
      className="mt-1.5 h-7 w-full text-xs"
      onClick={() => router.push(`/settings/subscription?instagramId=${instagramId}`)}
    >
      {t('buy_additional_cta')}
    </Button>
  );

  if (pageSubscription) {
    const remainingDays = getRemainingDays(pageSubscription.expire);
    const totalDays = remainingDays + totalReservedDays;
    const isExpiringSoon = totalDays < EXPIRING_SOON_THRESHOLD_DAYS;

    return (
      <div className="mt-2">
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border p-1.5 ps-1.5 pe-2.5',
            isExpiringSoon ? 'border-red-600/20 bg-red-50' : 'border-green-600/20 bg-green-50',
          )}
        >
          {isExpiringSoon ? (
            <WarningCircleIcon size={18} weight="fill" className="ms-1 shrink-0 text-red-600" />
          ) : (
            <SealCheckIcon size={18} weight="fill" className="ms-1 shrink-0 text-green-600" />
          )}
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-xs font-semibold',
              isExpiringSoon ? 'text-red-800' : 'text-green-800',
            )}
          >
            {t('page_days_left', { days: totalDays })}
          </span>
          {!isWebView && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50"
              onClick={() => router.push(`/settings/subscription?instagramId=${instagramId}`)}
            >
              {t('buy_additional_cta')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!isWebView && hasActiveCreditSubscription(subscriptions)) {
    return (
      <div className="mt-2">
        <Alert
          variant="note"
          className="border-blue-600/20 bg-blue-50 p-2 text-xs text-blue-700 [&_svg]:text-blue-600"
        >
          <AlertDescription>{t('page_covered_by_credit')}</AlertDescription>
        </Alert>
        {buyAdditionalRow}
      </div>
    );
  }

  if (!isWebView && reservedSubs.length > 0) {
    return <div className="mt-2">{buyAdditionalRow}</div>;
  }

  return null;
}
