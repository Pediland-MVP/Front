'use client';

import usePayPlan from '@/app/(Console)/settings/subscription/hooks/usePayPlan';
import usePlansForPage from '@/app/(Console)/settings/subscription/hooks/usePlansForPage';
import useUser from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Instagram } from '@/types/user';
import { formatNumber } from '@/utils/formatNumber';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CircleIcon,
  ClockCountdownIcon,
  InstagramLogoIcon,
  WarningCircleIcon,
  TrendDownIcon,
} from '@phosphor-icons/react/dist/ssr';
import {
  MoveLeftIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { InstagramInvalid } from '../Console/InstagramInvalid';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTrigger,
} from '../ui';
import { ButtonLoading } from '../ui-custom/ButtonLoading';
import { LoaderSpin } from '../ui-custom/LoaderSpin';
import { DiscountAlert } from './DiscountAlert';
import { DiscountCode } from './DiscountCode';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';
import { CardSimple } from '../ui-custom/CardSimple';
import { PageSubscriptionCard } from './PageSubscriptionCard';
import { ProgressRadial } from '../Console/ProgressRadial';
import { PlanTierBadge } from './PlanTierBadge';
import {
  getActiveCreditSubscription,
  getActivePageSubscriptions,
  getUnboundActiveSubscriptions,
} from '@/utils/subscription';

const planSchema = z.object({
  planId: z.number(),
  durationId: z.number(),
  discountCode: z.string().optional(),
});

type FormValues = z.infer<typeof planSchema>;

interface ChoosePlanProps {
  instagramId?: string;
}

// Fallback avatar handling for Instagram profile pictures
const InstagramAvatar = ({
  url,
  username,
  size = 32,
}: {
  url?: string;
  username: string;
  size?: number;
}) => {
  const [src, setSrc] = useState<string | undefined>(url);
  const [error, setError] = useState(false);

  useEffect(() => {
    setSrc(url);
    setError(false);
  }, [url]);

  if (!src || error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400"
      >
        <InstagramLogoIcon size={size * 0.6} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={username}
      width={size}
      height={size}
      className="aspect-square shrink-0 rounded-full object-cover"
      onError={() => setError(true)}
    />
  );
};

export const ChoosePlan = ({ instagramId }: ChoosePlanProps) => {
  const t = useTranslations('Subscription');
  const [selectedDurationId, setSelectedDurationId] = useState<number | null>(null);

  // instagramId prop skipped the page picker if passed from parent component.
  const [showBuyFlow, setShowBuyFlow] = useState<boolean>(!!instagramId);
  const [selectedInstagramId, setSelectedInstagramId] = useState<string | undefined>(instagramId);

  const { user } = useUser();

  const {
    active,
    setActive,
    subscriptions,
    isLoading: isSubscriptionsLoading,
    discountCode,
  } = useSubscriptionStore();

  const creditSubscription = getActiveCreditSubscription(subscriptions);
  const pageSubscriptions = getActivePageSubscriptions(subscriptions);
  const unboundActiveSubscriptions = getUnboundActiveSubscriptions(subscriptions);

  const reservedSubscriptions = subscriptions?.filter(
    (sub) => sub.status === SubscriptionStatusEnum.RESERVED,
  );

  const instagramById = useMemo(() => {
    const map = new Map<string, Instagram>();
    user?.instagrams?.forEach((ig) => map.set(ig.id, ig));
    return map;
  }, [user?.instagrams]);

  const selectedInstagram = selectedInstagramId
    ? instagramById.get(selectedInstagramId)
    : undefined;
  const isSelectedIgTokenInvalid = selectedInstagram?.isIgTokenValid === false;

  const {
    plan: currentPlan,
    isLoading: isPlanForPageLoading,
    error: planForPageError,
  } = usePlansForPage(selectedInstagramId);

  const { pay, isPayLoading } = usePayPlan();

  const form = useForm<FormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planId: 0,
      durationId: 0,
      discountCode: '',
    },
  });

  useEffect(() => {
    if (currentPlan?.id) {
      form.setValue('planId', currentPlan.id);
    }
  }, [currentPlan, form]);

  useEffect(() => {
    if (!selectedInstagramId && user?.instagrams?.length === 1) {
      setSelectedInstagramId(user.instagrams[0].id);
    }
  }, [selectedInstagramId, user?.instagrams]);

  const selectPlanHandler = (durationId: number) => {
    setSelectedDurationId(durationId);
    form.setValue('durationId', durationId);
    onSubmit(form.getValues());
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const paymentData = {
        planId: data.planId,
        durationId: data.durationId,
        ...(discountCode && { discountCode }),
        ...(selectedInstagramId && { instagramId: selectedInstagramId }),
      };
      await pay(paymentData, setActive);
    } catch (error) {
      console.error('Error in onSubmit', error);
      toast.error(error);
    }
  };

  const labelClass = 'text-muted-foreground text-sm font-medium';

  // Durations sorted by days ascending (shortest first)
  const sortedDurations = useMemo(() => {
    return [...(currentPlan?.durations ?? [])].sort((a, b) => a.durationDays - b.durationDays);
  }, [currentPlan]);

  // Recommended duration id is the longest duration (highest value)
  const recommendedDurationId = sortedDurations[sortedDurations.length - 1]?.id;

  // Monthly base price (usually from the shortest duration card)
  const monthlyBaselinePrice = useMemo(() => {
    if (!sortedDurations.length) return null;
    const shortest = sortedDurations[0];
    const basePrice =
      Number(shortest.discountPrice) > 0 ? Number(shortest.discountPrice) : Number(shortest.price);
    const months =
      shortest.durationDays === 365 ? 12 : Math.max(1, Math.round(shortest.durationDays / 30));
    return Math.round(basePrice / months);
  }, [sortedDurations]);

  if (!active.choosePlan) return null;

  return (
    <div className="flex-1 space-y-4">
      {creditSubscription && (
        <CardSimple className="border-violet-200 bg-violet-50/50">
          <CardContent className="flex flex-col gap-2 p-3 text-[15px] md:p-5">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={labelClass}>وضعیت:</span>
                  <span className="text-primary flex items-center gap-1 font-semibold">
                    {t(creditSubscription.status)}
                  </span>
                  <CircleIcon size={10} weight="fill" className="animate-pulse text-green-500" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={labelClass}>نوع اشتراک:</span>
                  <span className="text-primary font-semibold">300 پیام رایگان</span>
                </div>
              </div>
              <ProgressRadial
                percentage={isSubscriptionsLoading ? 0 : creditSubscription.credit}
                size={90}
                strokeWidth={8}
                type="credit"
              />
            </div>
          </CardContent>
        </CardSimple>
      )}

      {pageSubscriptions.length > 0 && (
        <div>
          <h3 className="text-secondary mb-2 text-[15px] font-medium">
            {t('page_coverage_title')}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {pageSubscriptions.map((sub) => (
              <PageSubscriptionCard
                key={sub.id}
                subscription={sub}
                instagram={sub.instagramId ? instagramById.get(sub.instagramId) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {unboundActiveSubscriptions.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {unboundActiveSubscriptions.map((sub) => (
            <CardSimple className="border-dashed border-blue-200/80 bg-blue-50/50" key={sub.id}>
              <CardContent className="text-secondary/70 flex flex-col gap-1 p-4 text-[15px] md:p-5">
                <div className="flex items-center gap-1.5">
                  <span className={labelClass}>وضعیت:</span>
                  <span className="font-medium">{t('unassigned_active_subscription')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={labelClass}>نوع اشتراک:</span>
                  <span className="font-medium">{sub.planDuration.name}</span>
                </div>
                <PlanTierBadge plan={sub.planDuration.plan} className="mt-1" />
              </CardContent>
            </CardSimple>
          ))}
        </div>
      )}

      {!creditSubscription &&
        pageSubscriptions.length === 0 &&
        unboundActiveSubscriptions.length === 0 && (
          <p className="text-muted-foreground text-sm">{t('no_active_subscription')}</p>
        )}

      <DiscountAlert />

      {/* The whole purchase process runs inside a dialog. */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:pb-6">
        <Dialog
          open={showBuyFlow}
          onOpenChange={(open) => {
            setShowBuyFlow(open);
            if (!open) {
              // Reset to the initial state so reopening starts fresh.
              setSelectedInstagramId(instagramId);
              setSelectedDurationId(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="rounded-xl bg-violet-600 shadow-lg transition-all hover:bg-violet-700 active:scale-95"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {t('buy_subscription')}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-hidden overflow-y-auto rounded-2xl border border-slate-100 bg-white p-0 text-right shadow-2xl sm:max-w-3xl">
            {/* Header Section */}
            <div className="via-violet-750 relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-8 text-white">
              {/* Subtle decorative glow */}
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-400/20 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" />

              <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-right text-xl font-bold tracking-tight">
                    <ShoppingCartIcon className="h-6 w-6 text-violet-200" />
                    {t('buy_subscription')}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-violet-100/90">
                    {t('buy_dialog_subtitle')}
                  </p>
                </div>

                {/* Selected Page Badge */}
                {selectedInstagramId && selectedInstagram && (
                  <div className="flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md md:self-auto">
                    <div className="shrink-0 overflow-hidden rounded-full border border-white/20">
                      <InstagramAvatar
                        url={selectedInstagram.profilePicture?.url}
                        username={selectedInstagram.username}
                        size={24}
                      />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      @{selectedInstagram.username}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              {!selectedInstagramId && (
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-800">
                      <span className="h-4 w-1 rounded-full bg-violet-600" />
                      {t('choose_page_title')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">{t('choose_page_description')}</p>
                  </div>

                  {!user?.instagrams?.length ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
                      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                        <InstagramLogoIcon size={32} weight="duotone" className="text-violet-555" />
                        <div className="absolute -top-1 -right-1 h-3 w-3 animate-ping rounded-full bg-violet-400" />
                      </div>
                      <h4 className="mb-1 text-sm font-semibold text-slate-800">
                        {t('no_pages_connected')}
                      </h4>
                      <Link
                        href="/connect"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-violet-700"
                      >
                        {t('connect_page_cta')}
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {user.instagrams.map((ig) => {
                        const isTokenInvalid = ig.isIgTokenValid === false;
                        const hasActiveSub = pageSubscriptions.some(
                          (sub) => sub.instagramId === ig.id,
                        );
                        const activeSub = pageSubscriptions.find(
                          (sub) => sub.instagramId === ig.id,
                        );

                        return (
                          <div
                            key={ig.id}
                            className={cn(
                              'group relative flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md',
                              isTokenInvalid &&
                                'border-rose-100 bg-rose-50/30 hover:border-rose-300',
                            )}
                            onClick={() => setSelectedInstagramId(ig.id)}
                          >
                            <div className="relative shrink-0">
                              <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px] transition-transform duration-300 group-hover:scale-105">
                                <div className="rounded-full bg-white p-[2px]">
                                  <InstagramAvatar
                                    url={ig.profilePicture?.url}
                                    username={ig.username}
                                    size={40}
                                  />
                                </div>
                              </div>
                              {/* Status Dot */}
                              <div
                                className={cn(
                                  'absolute right-0 bottom-0 h-3 w-3 rounded-full border border-white',
                                  isTokenInvalid
                                    ? 'animate-pulse bg-rose-500'
                                    : hasActiveSub
                                      ? 'animate-pulse bg-emerald-500'
                                      : 'bg-slate-300',
                                )}
                              />
                            </div>

                            <div className="min-w-0 flex-1 text-right">
                              <span className="block truncate text-sm font-semibold text-slate-800">
                                @{ig.username}
                              </span>

                              {/* Badges/Subtext */}
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {isTokenInvalid ? (
                                  <span className="inline-flex items-center gap-0.5 rounded-md border border-rose-100/55 bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                                    نیاز به اتصال مجدد
                                  </span>
                                ) : hasActiveSub ? (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100/55 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                    اشتراک فعال ({activeSub?.planDuration.name})
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400">
                                    بدون اشتراک فعال
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Hover Arrow Indicator */}
                            <div className="me-1 text-violet-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <ArrowRight className="h-4 w-4 rotate-180 transform" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedInstagramId && (
                <div>
                  {/* Sub-Header with Back Button */}
                  {!instagramId && user?.instagrams && user.instagrams.length > 1 && (
                    <div className="flex items-center justify-end border-b border-slate-100 bg-slate-50/50 px-6 py-2.5">
                      <Button
                        onClick={() => setSelectedInstagramId(undefined)}
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        {t('back')}
                      </Button>
                    </div>
                  )}

                  <div className="p-6">
                    {isSelectedIgTokenInvalid ? (
                      <div className="py-2">
                        <InstagramInvalid />
                      </div>
                    ) : isPlanForPageLoading ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-16">
                        <LoaderSpin />
                        <span className="text-xs font-medium text-slate-400">
                          در حال دریافت پلن‌های متناسب...
                        </span>
                      </div>
                    ) : !currentPlan || planForPageError ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/30 px-4 py-12 text-center text-amber-800">
                        <WarningCircleIcon
                          size={40}
                          className="text-amber-550 mb-2"
                          weight="duotone"
                        />
                        <p className="text-sm font-semibold">{t('no_plan_for_followers')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
                        {/* RIGHT COLUMN: Plan Features & Summary (5 columns on desktop) */}
                        <div className="order-last space-y-4 md:order-first md:col-span-5">
                          <div className="border-slate-150 rounded-2xl border bg-slate-50/40 p-4">
                            <h4 className="border-slate-150 mb-3 flex items-center gap-1.5 border-b pb-2 text-sm font-bold text-slate-800">
                              <span className="h-4 w-1 rounded-full bg-violet-600" />
                              ویژگی‌های بسته {currentPlan.name}
                            </h4>

                            {/* Features list */}
                            <ul className="space-y-3 text-right text-xs text-slate-600">
                              {currentPlan.features?.length > 0 ? (
                                currentPlan.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>{feature}</span>
                                  </li>
                                ))
                              ) : (
                                <>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>دایرکت خودکار پیشرفته (پاسخ سریع و هوشمند)</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>کامنت مارکتینگ هوش مصنوعی</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>ارسال پیام خودکار به فالوورهای جدید</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>گزارش‌دهی هوشمند و آمار پیشرفت روزانه</span>
                                  </li>
                                </>
                              )}
                            </ul>

                            {/* Display plan description if any */}
                            {currentPlan.description && (
                              <p className="mt-3 rounded-xl bg-slate-100/50 p-2.5 text-right text-[11px] leading-relaxed text-slate-400">
                                {currentPlan.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* LEFT COLUMN: Duration and Payment Cards (7 columns on desktop) */}
                        <div className="space-y-4 md:col-span-7">
                          {/* Warning Messages */}
                          <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs text-amber-800">
                            <WarningCircleIcon
                              size={16}
                              weight="fill"
                              className="text-amber-550 shrink-0"
                            />
                            <p className="leading-none">{t('vpnAlert')}</p>
                          </div>

                          <h4 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                            انتخاب دوره اشتراک
                          </h4>

                          {/* Durations list */}
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
                              const isBuying = selectedDurationId === duration.id && isPayLoading;

                              // Total discount on original price
                              const totalDiscountPct = hasDiscount
                                ? Math.round(
                                    (1 - Number(duration.discountPrice) / Number(duration.price)) *
                                      100,
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
                                    <div className="bg-violet-650 absolute top-0 left-0 flex items-center gap-1 rounded-br-xl px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                      <Sparkles className="h-3.5 w-3.5 fill-violet-200" />
                                      {t('best_value')}
                                    </div>
                                  )}

                                  <div className="flex flex-1 flex-col justify-between p-5 text-right">
                                    <div>
                                      {/* Name of duration and discount badge */}
                                      <div className="mb-2 flex items-center gap-2">
                                        <span className="text-base font-bold text-slate-800">
                                          {duration.name}
                                        </span>
                                        {totalDiscountPct > 0 && (
                                          <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                            {totalDiscountPct}٪ تخفیف
                                          </span>
                                        )}
                                      </div>

                                      {/* Price per month */}
                                      <div className="mt-1 flex items-baseline gap-1">
                                        <span className="text-slate-850 text-2xl font-extrabold tracking-tight tabular-nums">
                                          {formatNumber(monthlyPrice)}
                                        </span>
                                        <span className="text-xs font-medium text-slate-400">
                                          {t('per_month_unit')}
                                        </span>
                                      </div>

                                      {/* Savings vs baseline */}
                                      {savingsPct > 0 && (
                                        <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                          <TrendDownIcon size={14} weight="bold" />
                                          <span>
                                            {t('cheaper_than_monthly', { percent: savingsPct })}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Total Price display */}
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100/80 pt-3 text-xs">
                                      <span className="text-slate-400">{t('total_price')}:</span>
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
                                          {t('toman')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Buy Button Sidebar / Area */}
                                  <div className="border-slate-150 flex shrink-0 flex-col justify-center justify-stretch border-t bg-slate-50/50 p-4 sm:w-36 sm:border-t-0 sm:border-r sm:border-dashed">
                                    <ButtonLoading
                                      isLoading={isBuying}
                                      type="button"
                                      variant={isRecommended ? 'default' : 'outline'}
                                      className={cn(
                                        'w-full gap-1.5 rounded-xl py-5 text-xs font-bold shadow-xs transition-all duration-300 hover:shadow-md active:scale-95',
                                        isRecommended
                                          ? 'to-indigo-650 hover:from-violet-750 border-0 bg-gradient-to-r from-violet-600 text-white hover:to-indigo-700'
                                          : 'border-slate-200 text-slate-700 hover:bg-slate-100',
                                      )}
                                      onClick={() => selectPlanHandler(duration.id)}
                                    >
                                      <ShoppingBagIcon className="h-4 w-4" />
                                      {t('buy')}
                                    </ButtonLoading>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Coupon / Promo section — kept last so it doesn't distract from
                              plan selection; showing it first drove support tickets asking
                              for a discount code before users even chose a plan. */}
                          <div className="border-slate-150 rounded-2xl border bg-white p-4 shadow-xs">
                            <DiscountCode />
                          </div>
                          <DiscountAlert />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {reservedSubscriptions?.length > 0 && (
          <Button
            onClick={() => setActive({ choosePlan: false, subscriptionInfo: true })}
            variant="link"
            className="group flex items-center gap-1 font-normal text-violet-600 hover:text-violet-700"
          >
            اشتراک‌های رزرو شده
            <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
