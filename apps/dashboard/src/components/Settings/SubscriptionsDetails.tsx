'use client';

import { useMemo } from 'react';
import useUser from '@/hooks/useUser';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';
import { Instagram } from '@/types/user';
import { formatNumber } from '@/utils/formatNumber';
import { useTranslations } from 'next-intl';

import { Button, CardContent } from '@/components/ui';
import { ClockCountdownIcon } from '@phosphor-icons/react/dist/ssr/ClockCountdown';
import { ClockIcon, MoveLeftIcon, ShoppingCartIcon } from 'lucide-react';
import { LoaderSpin } from '../ui-custom/LoaderSpin';
import { CardSimple } from '../ui-custom/CardSimple';

export const SubscriptionsDetails = () => {
  const t = useTranslations('Subscription');
  const { user } = useUser();

  const {
    active,
    setActive,
    subscriptions,
    isLoading: isSubscriptionsLoading,
  } = useSubscriptionStore();

  const reservedSubscriptions = subscriptions?.filter(
    (sub) => sub.status === SubscriptionStatusEnum.RESERVED,
  );

  const instagramById = useMemo(() => {
    const map = new Map<string, Instagram>();
    user?.instagrams?.forEach((ig) => map.set(ig.id, ig));
    return map;
  }, [user?.instagrams]);

  const labelClass = 'text-muted-foreground text-sm font-me';

  if (!active.subscriptionInfo) return null;

  if (isSubscriptionsLoading || !subscriptions) return <LoaderSpin />;

  return (
    <div className="space-y-3">
      {reservedSubscriptions?.length > 0 && (
        <div className="_reserved-subscription">
          <div className="text-secondary mb-3 flex items-center gap-1.5">
            <div>
              <ClockCountdownIcon size={20} />
            </div>
            <p className="text-sm">
              اشتراک‌های زیر پس از اتمام اشتراک فعال به ترتیب اولویت فعال خواهند شد.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {reservedSubscriptions?.map((sub, index) => (
              <CardSimple className="border-dashed border-blue-200/80 bg-blue-50/50" key={sub.id}>
                <CardContent className="text-secondary/70 flex flex-col gap-1 p-4 text-[15px] md:p-5">
                  <div className="flex items-center gap-1.5">
                    <span className={labelClass}>وضعیت:</span>
                    <span className="font-medium">{t(sub.status)}</span>
                  </div>
                  {sub.instagramId && instagramById.get(sub.instagramId) && (
                    <div className="flex items-center gap-1.5">
                      <span className={labelClass}>{t('covered_page')}:</span>
                      <span className="font-medium">
                        @{instagramById.get(sub.instagramId)?.username}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className={labelClass}>نوع اشتراک:</span>
                    <span className="font-medium">
                      {sub.type === 'credit' ? '300 پیام رایگان' : sub.planDuration?.name}
                    </span>
                  </div>
                  {sub.type !== 'credit' && (
                    <div className="flex items-center gap-1.5">
                      <span className={labelClass}>قیمت بسته:</span>
                      <span className="font-medium">
                        {formatNumber(sub.planDuration?.price)} تـومـان
                      </span>
                    </div>
                  )}
                </CardContent>
              </CardSimple>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => setActive({ choosePlan: true, subscriptionInfo: false })}
          variant="link"
          className="font-normal"
        >
          بازگشت
          <MoveLeftIcon />
        </Button>
      </div>
    </div>
  );
};
