'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { PlanTierBadge } from '@/components/Settings/PlanTierBadge';
import usePayPlan from '@/app/(Console)/settings/subscription/hooks/usePayPlan';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { setPendingInstagramUsername } from '@/utils/pendingInstagramConnect';
import { useInstagramFollowersLookup } from '../../app/(Connect)/connect/hooks/useInstagramFollowersLookup';
import { usePlansByFollowers } from '../../app/(Connect)/connect/hooks/usePlansByFollowers';
import { useAllVisiblePlans } from '../../app/(Connect)/connect/hooks/useAllVisiblePlans';

interface SetupInstagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetupInstagramDialog({ open, onOpenChange }: SetupInstagramDialogProps) {
  const t = useTranslations('SetupInstagramDialog');
  const { setActive } = useSubscriptionStore();

  const [username, setUsername] = useState('');
  const [checkedUsername, setCheckedUsername] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number | undefined>(undefined);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [buyingDurationId, setBuyingDurationId] = useState<number | null>(null);

  const { lookup, isLookupLoading } = useInstagramFollowersLookup();
  const { plan: matchedPlan, isLoading: isMatchedPlanLoading } =
    usePlansByFollowers(followersCount);
  const { plans: allPlans, isLoading: isAllPlansLoading } = useAllVisiblePlans(lookupFailed);
  const { pay, isPayLoading } = usePayPlan();

  const reset = () => {
    setUsername('');
    setCheckedUsername(null);
    setFollowersCount(undefined);
    setLookupFailed(false);
    setBuyingDurationId(null);
  };

  const onCheckUsername = async () => {
    if (!username.trim()) return;
    setLookupFailed(false);
    try {
      const result = await lookup(username.trim());
      setCheckedUsername(result.username);
      setFollowersCount(result.followersCount);
    } catch {
      setCheckedUsername(username.trim());
      setLookupFailed(true);
    }
  };

  const onBuy = async (planId: number, durationId: number) => {
    setBuyingDurationId(durationId);
    await pay({ planId, durationId }, setActive, () => {
      if (checkedUsername) setPendingInstagramUsername(checkedUsername);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-lg gap-5 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {!checkedUsername ? (
          <div className="space-y-4">
            <Input
              placeholder={t('username_placeholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <DialogFooter>
              <ButtonLoading
                type="button"
                isLoading={isLookupLoading}
                className="w-full"
                onClick={onCheckUsername}
              >
                {t('check_button')}
              </ButtonLoading>
            </DialogFooter>
          </div>
        ) : lookupFailed ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">{t('apify_error_description')}</p>
            {isAllPlansLoading ? (
              <LoaderSpin />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {allPlans?.map((plan) => {
                  const longestDuration = [...plan.durations].sort(
                    (a, b) => b.durationDays - a.durationDays,
                  )[0];
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => longestDuration && onBuy(plan.id, longestDuration.id)}
                      className="rounded-xl border border-slate-200 p-4 text-right hover:border-violet-300"
                    >
                      <PlanTierBadge plan={{ name: plan.name }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : isMatchedPlanLoading ? (
          <LoaderSpin />
        ) : matchedPlan ? (
          <div className="space-y-3">
            <PlanTierBadge plan={{ name: matchedPlan.name }} />
            <div className="space-y-2">
              {[...matchedPlan.durations]
                .sort((a, b) => a.durationDays - b.durationDays)
                .map((duration) => (
                  <ButtonLoading
                    key={duration.id}
                    isLoading={isPayLoading && buyingDurationId === duration.id}
                    onClick={() => onBuy(matchedPlan.id, duration.id)}
                    className="w-full justify-between"
                    variant="outline"
                  >
                    <span>{duration.name}</span>
                  </ButtonLoading>
                ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t('no_matching_plan')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
