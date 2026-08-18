'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CircleIcon } from '@phosphor-icons/react/dist/ssr/Circle';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';

import { CardContent } from '@/components/ui/card';
import { CardSimple } from '../ui-custom/CardSimple';
import { ProgressRadial } from '../Console/ProgressRadial';
import { PlanTierBadge } from './PlanTierBadge';
import { Subscription } from '@/types/subscriptions/subscriptions';
import { Instagram } from '@/types/user';
import { getRemainingDays } from '@/utils/subscription';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';

interface PageSubscriptionCardProps {
  subscription: Subscription;
  instagram?: Instagram;
}

export const PageSubscriptionCard = ({ subscription, instagram }: PageSubscriptionCardProps) => {
  const t = useTranslations('Subscription');
  const [imgError, setImgError] = useState(false);
  const labelClass = 'text-muted-foreground text-sm font-me';
  const { subscriptions } = useSubscriptionStore();

  // Reserved subs for this page always have `expire = null` (queued, not ticking yet) — their
  // days come from `planDuration.durationDays` instead. Added to both the active sub's remaining
  // days and its total duration so the radial still reads as "days left out of days owned".
  const reservedDays = (subscriptions ?? [])
    .filter(
      (sub) =>
        sub.instagramId === subscription.instagramId &&
        sub.status === SubscriptionStatusEnum.RESERVED,
    )
    .reduce((sum, sub) => sum + (sub.planDuration?.durationDays ?? 0), 0);

  const remainingDays = getRemainingDays(subscription.expire) + reservedDays;
  const totalDays = subscription.planDuration.durationDays + reservedDays;

  return (
    <CardSimple className="border-violet-200 bg-violet-50/50">
      <CardContent className="flex flex-col gap-2 p-3 text-[15px] md:p-5">
        {instagram && (
          <div className="mb-1 flex items-center gap-2 border-b border-violet-100 pb-2">
            {instagram.profilePicture?.url && !imgError ? (
              <Image
                src={instagram.profilePicture.url}
                alt={instagram.username}
                width={24}
                height={24}
                className="aspect-square rounded-full"
                onError={() => setImgError(true)}
              />
            ) : (
              <InstagramLogoIcon size={20} />
            )}
            <span className="text-secondary truncate text-sm font-semibold">
              @{instagram.username}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className={labelClass}>وضعیت:</span>
              <span className="text-primary flex items-center gap-1 font-semibold">
                {t(subscription.status)}
              </span>
              <CircleIcon size={10} weight="fill" className="animate-pulse text-green-500" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className={labelClass}>نوع اشتراک:</span>
              <span className="text-primary font-semibold">{subscription.planDuration.name}</span>
            </div>

            <PlanTierBadge plan={subscription.planDuration.plan} className="mt-1" />
          </div>
          <ProgressRadial
            percentage={remainingDays}
            size={90}
            strokeWidth={8}
            type="days"
            totalDays={totalDays}
          />
        </div>
      </CardContent>
    </CardSimple>
  );
};
