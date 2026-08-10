'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { PlanTierBadge } from '@/components/Settings/PlanTierBadge';
import { WizardStepsHeader } from './WizardStepsHeader';
import { useWorkspaceTargetStep } from './useWorkspaceTargetStep';
import usePayPlan from '@/app/(Console)/settings/subscription/hooks/usePayPlan';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { setPendingInstagramUsername } from '@/utils/pendingInstagramConnect';
import { getUnboundActiveSubscriptions } from '@/utils/subscription';
import { CONTINUE_WITH_PLAN_HREF } from '@/hooks/useAddInstagramGate';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceCategories } from '@/hooks/useWorkspaceCategories';
import api from '@/hooks/swr/api-client';
import { ExceptionMessage } from '@/types/exceptionMessage';
import { formatNumber } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';
import { useInstagramFollowersLookup } from '../../app/(Connect)/connect/hooks/useInstagramFollowersLookup';
import { usePlansByFollowers } from '../../app/(Connect)/connect/hooks/usePlansByFollowers';
import { useAllVisiblePlans } from '../../app/(Connect)/connect/hooks/useAllVisiblePlans';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { TrendDownIcon } from '@phosphor-icons/react/dist/ssr/TrendDown';
import { Sparkles, Building2, GitMerge } from 'lucide-react';

interface SetupInstagramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WizardStep = 'username' | 'plan' | 'workspace';

const STEP_INDEX: Record<WizardStep, 0 | 1 | 2> = { username: 0, plan: 1, workspace: 2 };

export function SetupInstagramDialog({ open, onOpenChange }: SetupInstagramDialogProps) {
  const t = useTranslations('SetupInstagramDialog');
  const tSub = useTranslations('Subscription');
  const t_ec = useTranslations('ERROR_CODES');
  const { setActive, subscriptions } = useSubscriptionStore();
  const { workspaceId: currentWorkspaceId } = usePermissions();
  const { workspaces, changeWorkspace } = useWorkspaces();
  const { categories } = useWorkspaceCategories();

  const [step, setStep] = useState<WizardStep>('username');
  const [username, setUsername] = useState('');
  const [checkedUsername, setCheckedUsername] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number | undefined>(undefined);
  const [profilePicUrl, setProfilePicUrl] = useState<string | undefined>(undefined);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedDurationId, setSelectedDurationId] = useState<number | null>(null);
  // Set when the user answers the unbound-plan step with "buy a different plan", which drops
  // them into the normal username → follower-lookup → plan flow below.
  const [dismissedUnboundStep, setDismissedUnboundStep] = useState(false);

  const workspaceStep = useWorkspaceTargetStep({
    active: step === 'workspace',
    currentWorkspaceId,
  });

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
    setStep('username');
    setUsername('');
    setCheckedUsername(null);
    setFollowersCount(undefined);
    setProfilePicUrl(undefined);
    setLookupFailed(false);
    setSelectedPlanId(null);
    setSelectedDurationId(null);
    setDismissedUnboundStep(false);
    workspaceStep.reset();
  };

  const onCheckUsername = async () => {
    if (!username.trim()) return;
    setLookupFailed(false);
    setSelectedPlanId(null);
    setSelectedDurationId(null);
    try {
      const result = await lookup(username.trim());
      setCheckedUsername(result.username);
      setFollowersCount(result.followersCount);
      setProfilePicUrl(result.profilePicUrl);
    } catch {
      setCheckedUsername(username.trim());
      setLookupFailed(true);
    }
    setStep('plan');
  };

  const onBuy = async (planId: number, durationId: number) => {
    await pay({ planId, durationId }, setActive, () => {
      if (checkedUsername) setPendingInstagramUsername(checkedUsername);
    });
  };

  const stampResumeStateOnUrl = (targetWorkspaceId: string, planId: number, durationId: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('igwResume', '1');
    url.searchParams.set('igwPlanId', String(planId));
    url.searchParams.set('igwDurationId', String(durationId));
    if (checkedUsername) url.searchParams.set('igwUsername', checkedUsername);
    url.searchParams.set('igwTargetWs', targetWorkspaceId);
    window.history.replaceState(null, '', url.toString());
  };

  const onFinalizeWorkspaceStep = async () => {
    if (selectedPlanId == null || selectedDurationId == null) return;

    if (workspaceStep.resolvedTargetIsCurrent) {
      await onBuy(selectedPlanId, selectedDurationId);
      return;
    }

    workspaceStep.setIsFinalizing(true);
    try {
      const targetId = await workspaceStep.resolveTargetWorkspaceId(async (name, categoryId) => {
        const res = await api.post('/workspaces', { name, categoryId });
        return res.data?.data?.id ?? res.data?.id;
      });
      stampResumeStateOnUrl(targetId, selectedPlanId, selectedDurationId);
      await changeWorkspace(targetId);
    } catch (e) {
      const code = (e as AxiosError<ExceptionMessage>).response?.data?.code;
      toast.error(t_ec(code) || t('workspace_switch_error'));
      workspaceStep.setIsFinalizing(false);
    }
  };

  const stepTitles: [string, string, string] = [
    t('step_username_title'),
    t('step_plan_title'),
    t('step_workspace_title'),
  ];

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
                  {/* A workspace can hold more than one unassigned plan, and each has its
                      own follower range — so both lines are ICU plurals on the count. */}
                  <p className="font-bold">
                    {t('unbound_warning_title', { count: unboundSubscriptions.length })}
                  </p>
                  <p className="leading-relaxed">
                    {t('unbound_warning_description', { count: unboundSubscriptions.length })}
                  </p>
                  {/* Softens the caution above: the user does not pick which plan binds to
                      the new page — the server matches it on follower count at connect. */}
                  <p className="border-t border-amber-200/70 pt-1.5 leading-relaxed">
                    {t('unbound_auto_match_note')}
                  </p>
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
          ) : (
            <>
              <WizardStepsHeader titles={stepTitles} currentIndex={STEP_INDEX[step]} />

              {step === 'username' && (
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
              )}

              {step === 'plan' && (
                <div className="space-y-4">
                  {lookupFailed ? (
                    <div className="space-y-3">
                      <p className="text-muted-foreground text-sm">
                        {t('apify_error_description')}
                      </p>
                      {isAllPlansLoading ? (
                        <LoaderSpin />
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {allPlans?.map((plan) => {
                            const longestDuration = [...plan.durations].sort(
                              (a, b) => b.durationDays - a.durationDays,
                            )[0];
                            const isSelected = selectedPlanId === plan.id;
                            return (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => {
                                  if (!longestDuration) return;
                                  setSelectedPlanId(plan.id);
                                  setSelectedDurationId(longestDuration.id);
                                }}
                                className={cn(
                                  'group rounded-xl border p-4 text-right transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                                  isSelected
                                    ? 'border-violet-500 bg-violet-50/50 ring-1 ring-violet-200'
                                    : 'border-slate-200 hover:border-violet-300',
                                )}
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
                      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={profilePicUrl} alt={checkedUsername ?? ''} />
                          <AvatarFallback>
                            <InstagramLogoIcon size={18} weight="bold" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 text-right">
                          <p dir="ltr" className="truncate text-sm font-bold text-slate-800">
                            @{checkedUsername}
                          </p>
                          <p className="text-xs text-slate-500">
                            <span>{formatNumber(followersCount)}</span> {t('followers_unit')}
                          </p>
                        </div>
                      </div>

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
                          const isSelected = selectedDurationId === duration.id;
                          const totalDiscountPct = hasDiscount
                            ? Math.round(
                                (1 - Number(duration.discountPrice) / Number(duration.price)) * 100,
                              )
                            : 0;

                          return (
                            <button
                              key={duration.id}
                              type="button"
                              onClick={() => {
                                setSelectedPlanId(matchedPlan.id);
                                setSelectedDurationId(duration.id);
                              }}
                              className={cn(
                                'relative flex w-full flex-col items-stretch overflow-hidden rounded-2xl border text-right transition-all duration-300 sm:flex-row',
                                isSelected
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
                                      <span>
                                        {tSub('cheaper_than_monthly', { percent: savingsPct })}
                                      </span>
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
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t('no_matching_plan')}</p>
                  )}
                </div>
              )}

              {step === 'workspace' && (
                <div className="space-y-4">
                  <RadioGroup
                    value={workspaceStep.targetMode}
                    onValueChange={(v) => workspaceStep.setTargetMode(v as 'new' | 'existing')}
                  >
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                        workspaceStep.targetMode === 'new'
                          ? 'border-violet-500 bg-violet-50/50'
                          : 'border-slate-200 hover:border-violet-200',
                      )}
                    >
                      <RadioGroupItem value="new" className="mt-1" />
                      <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{t('option_new_title')}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {t('option_new_description')}
                        </p>
                      </div>
                    </label>

                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                        workspaceStep.targetMode === 'existing'
                          ? 'border-violet-500 bg-violet-50/50'
                          : 'border-slate-200 hover:border-violet-200',
                      )}
                    >
                      <RadioGroupItem value="existing" className="mt-1" />
                      <GitMerge className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {t('option_existing_title')}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {t('option_existing_description')}
                        </p>
                      </div>
                    </label>
                  </RadioGroup>

                  {workspaceStep.targetMode === 'new' ? (
                    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <Input
                        value={workspaceStep.newWorkspaceName}
                        onChange={(e) => workspaceStep.setNewWorkspaceName(e.target.value)}
                        placeholder={t('new_workspace_name_placeholder')}
                        className="h-11 rounded-xl"
                        disabled={workspaceStep.isFinalizing}
                      />
                      <Select
                        value={workspaceStep.newWorkspaceCategoryId}
                        onValueChange={workspaceStep.setNewWorkspaceCategoryId}
                        disabled={workspaceStep.isFinalizing}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder={t('new_workspace_category_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nameFa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Select
                      value={workspaceStep.selectedExistingWorkspaceId}
                      onValueChange={workspaceStep.setSelectedExistingWorkspaceId}
                      disabled={workspaceStep.isFinalizing}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder={t('select_workspace_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaces.map((ws) => (
                          <SelectItem key={ws.id} value={ws.id}>
                            {ws.id === currentWorkspaceId
                              ? `${ws.name} (${t('current_workspace_suffix')})`
                              : ws.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                {step !== 'username' ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={workspaceStep.isFinalizing || isPayLoading}
                    onClick={() => setStep(step === 'workspace' ? 'plan' : 'username')}
                  >
                    {t('prev_step')}
                  </Button>
                ) : (
                  <span />
                )}

                {step === 'plan' && (
                  <Button
                    type="button"
                    className="rounded-xl bg-violet-600 hover:bg-violet-700"
                    disabled={selectedPlanId == null || selectedDurationId == null}
                    onClick={() => setStep('workspace')}
                  >
                    {t('next_step')}
                  </Button>
                )}

                {step === 'workspace' && (
                  <ButtonLoading
                    type="button"
                    isLoading={
                      workspaceStep.isFinalizing ||
                      (workspaceStep.resolvedTargetIsCurrent && isPayLoading)
                    }
                    className="rounded-xl bg-violet-600 hover:bg-violet-700"
                    disabled={!workspaceStep.canFinalize}
                    onClick={onFinalizeWorkspaceStep}
                  >
                    {workspaceStep.resolvedTargetIsCurrent
                      ? t('finalize_pay')
                      : t('finalize_switch_and_continue')}
                  </ButtonLoading>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
