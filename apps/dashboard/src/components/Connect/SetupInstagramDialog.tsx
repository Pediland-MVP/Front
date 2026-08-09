'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { PlanTierBadge } from '@/components/Settings/PlanTierBadge';
import usePayPlan from '@/app/(Console)/settings/subscription/hooks/usePayPlan';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { setPendingInstagramUsername } from '@/utils/pendingInstagramConnect';
import { getUnboundActiveSubscriptions } from '@/utils/subscription';
import { CONTINUE_WITH_PLAN_HREF } from '@/hooks/useAddInstagramGate';
import { formatNumber } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';
import { useInstagramFollowersLookup } from '../../app/(Connect)/connect/hooks/useInstagramFollowersLookup';
import { usePlansByFollowers } from '../../app/(Connect)/connect/hooks/usePlansByFollowers';
import { useAllVisiblePlans } from '../../app/(Connect)/connect/hooks/useAllVisiblePlans';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { TrendDownIcon } from '@phosphor-icons/react/dist/ssr/TrendDown';
import { ShoppingBagIcon, Sparkles } from 'lucide-react';

interface SetupInstagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetupInstagramDialog({ open, onOpenChange }: SetupInstagramDialogProps) {
  const t = useTranslations('SetupInstagramDialog');
  const tSub = useTranslations('Subscription');
  const { setActive, subscriptions } = useSubscriptionStore();

  const [username, setUsername] = useState('');
  const [checkedUsername, setCheckedUsername] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number | undefined>(undefined);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [buyingDurationId, setBuyingDurationId] = useState<number | null>(null);
  // Set when the user answers the unbound-plan step with "buy a different plan", which drops
  // them into the normal username → follower-lookup → plan flow below.
  const [dismissedUnboundStep, setDismissedUnboundStep] = useState(false);

  // A plan bought but never attached to a page. `hasAvailableSubscriptionSlot` — the flag that
  // decides whether this dialog opens at all — is tier-blind: it cannot know whether that plan's
  // follower range fits the page about to be added, because the page isn't connected yet. The
  // real check runs server-side in bindOnConnect *after* the Instagram OAuth round-trip, and a
  // mismatch there throws SUBSCRIPTION_NOT_COMPATIBLE_WITH_FOLLOWER_COUNT and rolls everything
  // back — leaving the user with a toast telling them to buy a fitting plan and no way to do it.
  // So when such a plan exists, show it first and let the user pick which way to go.
  //
  // getUnboundActiveSubscriptions excludes credit by design, which is right: credit coverage is
  // workspace-wide and follower-count-blind, so it can never mismatch and needs no decision.
  const unboundSubscriptions = getUnboundActiveSubscriptions(subscriptions);
  const showUnboundStep = unboundSubscriptions.length > 0 && !dismissedUnboundStep;

  const { lookup, isLookupLoading } = useInstagramFollowersLookup();
  const { plan: matchedPlan, isLoading: isMatchedPlanLoading } =
    usePlansByFollowers(followersCount);
  const { plans: allPlans, isLoading: isAllPlansLoading } = useAllVisiblePlans(lookupFailed);
  const { pay, isPayLoading } = usePayPlan();

  // Durations sorted shortest-first, mirroring ChoosePlan's buy dialog so returning users
  // see the same "best value" / monthly-price framing they already know from Settings.
  const sortedDurations = useMemo(() => {
    return [...(matchedPlan?.durations ?? [])].sort((a, b) => a.durationDays - b.durationDays);
  }, [matchedPlan]);
  const recommendedDurationId = sortedDurations[sortedDurations.length - 1]?.id;
  const monthlyBaselinePrice = useMemo(() => {
    if (!sortedDurations.length) return null;
    const shortest = sortedDurations[0];
    const basePrice =
      Number(shortest.discountPrice) > 0 ? Number(shortest.discountPrice) : Number(shortest.price);
    const months =
      shortest.durationDays === 365 ? 12 : Math.max(1, Math.round(shortest.durationDays / 30));
    return Math.round(basePrice / months);
  }, [sortedDurations]);

  const reset = () => {
    setUsername('');
    setCheckedUsername(null);
    setFollowersCount(undefined);
    setLookupFailed(false);
    setBuyingDurationId(null);
    setDismissedUnboundStep(false);
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden overflow-y-auto rounded-2xl border border-slate-100 bg-white p-0 text-right shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-7 text-white">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-400/20 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" />

          <div className="relative z-10 flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
              <InstagramLogoIcon size={22} weight="bold" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-right text-lg font-bold tracking-tight text-white">
                {t('title')}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs font-medium text-violet-100/90">
                {t('description')}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6">
          {showUnboundStep ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs text-amber-800">
                <WarningCircleIcon size={16} weight="fill" className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold">{t('unbound_warning_title')}</p>
                  <p className="leading-relaxed">{t('unbound_warning_description')}</p>
                </div>
              </div>

              <div className="space-y-2">
                {unboundSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-dashed border-blue-200/80 bg-blue-50/50 px-4 py-3"
                  >
                    <div className="text-sm font-medium text-slate-700">
                      {sub.planDuration.name}
                    </div>
                    <PlanTierBadge plan={sub.planDuration.plan} className="mt-1.5" />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full rounded-xl bg-violet-600 py-5 shadow-lg hover:bg-violet-700 active:scale-95"
                  asChild
                >
                  {/* Goes to /connect rather than straight into OAuth, so the user gets
                      that page's instructions and help video instead of being dropped on
                      Instagram. The query flag tells /connect this question is already
                      answered — without it its own gate would reopen this same dialog.
                      Closing here matters for the /connect → /connect case, where the
                      route stays mounted and the dialog would otherwise cover the page. */}
                  <Link href={CONTINUE_WITH_PLAN_HREF} onClick={() => onOpenChange(false)}>
                    {t('continue_with_unbound')}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl py-5"
                  onClick={() => setDismissedUnboundStep(true)}
                >
                  {t('buy_another_plan')}
                </Button>
              </div>
            </div>
          ) : !checkedUsername ? (
            <div className="space-y-4">
              <Input
                placeholder={t('username_placeholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 rounded-xl"
              />
              <ButtonLoading
                type="button"
                isLoading={isLookupLoading}
                className="w-full rounded-xl bg-violet-600 py-5 shadow-lg hover:bg-violet-700 active:scale-95"
                onClick={onCheckUsername}
              >
                {t('check_button')}
              </ButtonLoading>
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
                        disabled={isPayLoading}
                        onClick={() => longestDuration && onBuy(plan.id, longestDuration.id)}
                        className="group rounded-xl border border-slate-200 p-4 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <PlanTierBadge plan={{ name: plan.name }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : isMatchedPlanLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <LoaderSpin />
            </div>
          ) : matchedPlan ? (
            <div className="space-y-4">
              <PlanTierBadge plan={{ name: matchedPlan.name }} />

              <div className="space-y-3">
                {sortedDurations.map((duration) => {
                  const hasDiscount = Number(duration.discountPrice) > 0;
                  const unitPrice = hasDiscount
                    ? Number(duration.discountPrice)
                    : Number(duration.price);
                  const months =
                    duration.durationDays === 365
                      ? 12
                      : Math.max(1, Math.round(duration.durationDays / 30));
                  const monthlyPrice = Math.round(unitPrice / months);
                  const savingsPct =
                    monthlyBaselinePrice && monthlyBaselinePrice > monthlyPrice
                      ? Math.round((1 - monthlyPrice / monthlyBaselinePrice) * 100)
                      : 0;
                  const isRecommended = duration.id === recommendedDurationId;
                  const isBuying = buyingDurationId === duration.id && isPayLoading;
                  const totalDiscountPct = hasDiscount
                    ? Math.round(
                        (1 - Number(duration.discountPrice) / Number(duration.price)) * 100,
                      )
                    : 0;

                  return (
                    <div
                      key={duration.id}
                      className={cn(
                        'relative flex flex-col items-stretch overflow-hidden rounded-2xl border transition-all duration-300 sm:flex-row',
                        isRecommended
                          ? 'border-violet-500 bg-gradient-to-l from-violet-50/40 to-indigo-50/10 shadow-lg ring-1 shadow-violet-100/50 ring-violet-200'
                          : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-md',
                      )}
                    >
                      {isRecommended && (
                        <div className="absolute top-0 left-0 flex items-center gap-1 rounded-br-xl bg-violet-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          <Sparkles className="h-3.5 w-3.5 fill-violet-200" />
                          {tSub('best_value')}
                        </div>
                      )}

                      <div className="flex flex-1 flex-col justify-between p-4 text-right">
                        <div>
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">
                              {duration.name}
                            </span>
                            {totalDiscountPct > 0 && (
                              <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                {totalDiscountPct}٪ تخفیف
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-extrabold tracking-tight text-slate-800 tabular-nums">
                              {formatNumber(monthlyPrice)}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                              {tSub('per_month_unit')}
                            </span>
                          </div>

                          {savingsPct > 0 && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <TrendDownIcon size={14} weight="bold" />
                              <span>{tSub('cheaper_than_monthly', { percent: savingsPct })}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100/80 pt-2.5 text-xs">
                          <span className="text-slate-400">{tSub('total_price')}:</span>
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            {hasDiscount && (
                              <span className="text-slate-350 text-[11px] line-through decoration-slate-300">
                                {formatNumber(Number(duration.price))}
                              </span>
                            )}
                            <span className="font-bold text-slate-800 tabular-nums">
                              {formatNumber(unitPrice)}
                            </span>
                            <span className="text-slate-450 text-[10px] font-normal">
                              {tSub('toman')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-slate-150 flex shrink-0 flex-col justify-center border-t bg-slate-50/50 p-3 sm:w-32 sm:border-t-0 sm:border-r sm:border-dashed">
                        <ButtonLoading
                          isLoading={isBuying}
                          type="button"
                          variant={isRecommended ? 'default' : 'outline'}
                          disabled={isPayLoading}
                          className={cn(
                            'w-full gap-1.5 rounded-xl py-5 text-xs font-bold shadow-xs transition-all duration-300 hover:shadow-md active:scale-95',
                            isRecommended
                              ? 'to-indigo-650 hover:from-violet-750 border-0 bg-gradient-to-r from-violet-600 text-white hover:to-indigo-700'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-100',
                          )}
                          onClick={() => onBuy(matchedPlan.id, duration.id)}
                        >
                          <ShoppingBagIcon className="h-4 w-4" />
                          {tSub('buy')}
                        </ButtonLoading>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('no_matching_plan')}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
