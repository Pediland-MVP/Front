'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { SealCheckIcon, WarningCircleIcon } from '@phosphor-icons/react/dist/ssr';
import { Alert, AlertDescription, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { getActiveCreditSubscription, getRemainingDays } from '@/utils/subscription';

interface PageCoverageBadgeProps {
  instagramId: string;
}

const EXPIRING_SOON_THRESHOLD_DAYS = 7;

export function PageCoverageBadge({ instagramId }: PageCoverageBadgeProps) {
  const t = useTranslations('Settings.Accounts');
  const router = useRouter();
  const { subscriptions } = useSubscriptionStore();

  const pageSubscription = subscriptions?.find(
    (sub) => sub.instagramId === instagramId && sub.status === 'active',
  );

  const buyAdditionalRow = (
    <div className="mt-1.5 flex items-center justify-between gap-2">
      <span className="text-muted-foreground min-w-0 flex-1 truncate text-[11px]">
        {t('buy_additional_hint')}
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 shrink-0 px-2 text-xs"
        onClick={() => router.push(`/settings/subscription?instagramId=${instagramId}`)}
      >
        {t('buy_additional_cta')}
      </Button>
    </div>
  );

  if (pageSubscription) {
    const remainingDays = getRemainingDays(pageSubscription.expire);
    const isExpiringSoon = remainingDays < EXPIRING_SOON_THRESHOLD_DAYS;

    return (
      <div className="mt-2">
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border px-2.5 py-2',
            isExpiringSoon ? 'border-red-600/20 bg-red-50' : 'border-green-600/20 bg-green-50',
          )}
        >
          {isExpiringSoon ? (
            <WarningCircleIcon size={18} weight="fill" className="shrink-0 text-red-600" />
          ) : (
            <SealCheckIcon size={18} weight="fill" className="shrink-0 text-green-600" />
          )}
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-xs font-semibold',
              isExpiringSoon ? 'text-red-800' : 'text-green-800',
            )}
          >
            {t('page_covered_by_plan', { plan: pageSubscription.planDuration.name })}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
              isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
            )}
          >
            {t('page_days_left', { days: remainingDays })}
          </span>
        </div>
        {buyAdditionalRow}
      </div>
    );
  }

  if (getActiveCreditSubscription(subscriptions)) {
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

  return null;
}
