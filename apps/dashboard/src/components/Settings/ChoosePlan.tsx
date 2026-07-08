'use client';

import usePayPlan from '@/app/(Console)/settings/subscription/hooks/usePayPlan';
import usePlansForPage from '@/app/(Console)/settings/subscription/hooks/usePlansForPage';
import useUser from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Instagram } from '@/types/user';
import { formatNumber } from '@/utils/formatNumber';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleIcon, ClockCountdownIcon, InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr';
import { MoveLeftIcon, ShoppingBagIcon, ShoppingCartIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { InstagramInvalid } from '../Console/InstagramInvalid';
import { Alert, AlertDescription, Button, Card, CardContent, CardFooter } from '../ui';
import { ButtonLoading } from '../ui-custom/ButtonLoading';
import { LoaderSpin } from '../ui-custom/LoaderSpin';
import { DiscountAlert } from './DiscountAlert';
import { DiscountCode } from './DiscountCode';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';
import { CardSimple } from '../ui-custom/CardSimple';
import { PageSubscriptionCard } from './PageSubscriptionCard';
import { ProgressRadial } from '../Console/ProgressRadial';
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

export const ChoosePlan = ({ instagramId }: ChoosePlanProps) => {
  const t = useTranslations('Subscription');
  const [selectedDurationId, setSelectedDurationId] = useState<number | null>(null);

  // instagramId prop (from a per-page "buy" CTA) skips the page picker entirely.
  const [showBuyFlow, setShowBuyFlow] = useState<boolean>(!!instagramId);
  const [selectedInstagramId, setSelectedInstagramId] = useState<string | undefined>(instagramId);

  const { user } = useUser();

  const {
    active,
    setActive,
    subscriptions,
    isLoading: isSubscriptionsLoading,
    discountCode,
    setDiscountCode,
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
  const isSelectedPageAlreadyCovered = selectedInstagramId
    ? pageSubscriptions.some((sub) => sub.instagramId === selectedInstagramId)
    : false;

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

  const labelClass = 'text-muted-foreground text-sm font-me';

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

      {!showBuyFlow && (
        <div className="flex justify-center md:justify-start">
          <Button size="lg" onClick={() => setShowBuyFlow(true)}>
            <ShoppingCartIcon />
            {t('buy_subscription')}
          </Button>
        </div>
      )}

      {showBuyFlow && !selectedInstagramId && (
        <div>
          <h3 className="text-secondary mb-1 text-[15px] font-medium">{t('choose_page_title')}</h3>
          <p className="text-muted-foreground mb-3 text-sm">{t('choose_page_description')}</p>

          {!user?.instagrams?.length ? (
            <Alert className="border-yellow-600/40 bg-yellow-50 text-sm text-yellow-600">
              {t('no_pages_connected')}{' '}
              <Link href="/connect" className="font-semibold underline">
                {t('connect_page_cta')}
              </Link>
            </Alert>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {user.instagrams.map((ig) => (
                <Card
                  key={ig.id}
                  className="hover:border-primary/40 cursor-pointer gap-0 p-0 transition-colors"
                  onClick={() => setSelectedInstagramId(ig.id)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="shrink-0">
                      {ig.profilePicture?.url ? (
                        <Image
                          src={ig.profilePicture.url}
                          alt={ig.username}
                          width={40}
                          height={40}
                          className="aspect-square rounded-full"
                        />
                      ) : (
                        <InstagramLogoIcon size={40} />
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate font-medium">@{ig.username}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {showBuyFlow && selectedInstagramId && (
        <div>
          {!instagramId && (
            <Button
              onClick={() => setSelectedInstagramId(undefined)}
              variant="link"
              className="mb-2 px-0 font-normal"
            >
              {t('back')}
              <MoveLeftIcon />
            </Button>
          )}

          {isSelectedIgTokenInvalid ? (
            <InstagramInvalid />
          ) : isPlanForPageLoading ? (
            <LoaderSpin />
          ) : !currentPlan || planForPageError ? (
            <Alert className="border-yellow-600/40 bg-yellow-50 text-sm text-yellow-600">
              {t('no_plan_for_followers')}
            </Alert>
          ) : (
            <>
              {isSelectedPageAlreadyCovered && (
                <Alert
                  variant="note"
                  className="mb-4 border-blue-600/20 bg-blue-50 text-sm text-blue-700"
                >
                  <AlertDescription>{t('renewal_will_queue_notice')}</AlertDescription>
                </Alert>
              )}

              <h3 className="text-secondary mb-4 flex items-center gap-1 text-[15px] font-medium">
                <ClockCountdownIcon size={20} />
                {t('package_title')}:
              </h3>

              <Alert variant="destructive" className="mb-4">
                <AlertDescription icon>{t('vpnAlert')}</AlertDescription>
              </Alert>

              <div className="flex flex-col gap-4 md:flex-row">
                {currentPlan.durations
                  .sort((a, b) => b.id - a.id)
                  .map((duration, id) => {
                    const unitPrice =
                      duration.discountPrice > 0
                        ? Number(duration.discountPrice)
                        : Number(duration.price);
                    let totalBasePrice: number | string;
                    let monthlyPrice: number | string;

                    if (duration.durationDays === 30) {
                      monthlyPrice = unitPrice / 1000;
                      totalBasePrice = formatNumber(unitPrice);
                    } else if (duration.durationDays === 90) {
                      monthlyPrice = Math.floor(Math.floor(unitPrice / 3) / 1000);
                      totalBasePrice = formatNumber(unitPrice);
                    } else if (duration.durationDays === 365) {
                      monthlyPrice = Math.round(Math.round(unitPrice / 12) / 1000);
                      totalBasePrice = formatNumber(unitPrice);
                    }

                    const topId = 0;

                    return (
                      <Card
                        key={id}
                        className={cn(
                          'flex-1 gap-0 p-0',
                          id === topId
                            ? 'border-violet-200 shadow-violet-200'
                            : 'border-blue-200/60 shadow-blue-200/60',
                        )}
                      >
                        <CardContent
                          className={cn(
                            'flex w-full flex-1 flex-col items-center gap-3 rounded-t-xl px-4 py-5 sm:px-3',
                            id === topId ? 'bg-violet-50/50' : 'bg-blue-50/30',
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <h4
                              className={cn(
                                'font-bold sm:text-[15px]',
                                id === topId ? 'text-primary' : 'text-secondary/80',
                              )}
                            >
                              {t('subscription')} {duration.name}
                            </h4>
                          </div>
                          <div
                            className={cn(
                              'text-center text-lg',
                              id === topId ? 'font-semibold text-green-600' : 'font-medium',
                            )}
                          >
                            {monthlyPrice}{' '}
                            <span className="text-base sm:text-[15px]">هزار تومان ماهانه</span>
                          </div>

                          <div className="flex h-full">
                            <div className="text-muted-foreground flex items-center gap-1.5 text-[15px] sm:text-sm">
                              (جمع {totalBasePrice} {t('toman')})
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="w-full p-0">
                          <ButtonLoading
                            isLoading={selectedDurationId === duration.id && isPayLoading}
                            type="button"
                            variant="ghost"
                            size="lg"
                            className={cn(
                              'h-9 w-full rounded-t-none! rounded-b-xl! font-semibold',
                              id === topId
                                ? 'text-primary hover:text-primary bg-violet-100/90 hover:bg-violet-200/70'
                                : 'text-secondary/70 hover:text-secondary bg-blue-100/70 hover:bg-blue-100',
                            )}
                            onClick={() => selectPlanHandler(duration.id)}
                          >
                            <ShoppingBagIcon />
                            {t('buy')}
                          </ButtonLoading>
                        </CardFooter>
                      </Card>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-3 sm:pb-6 md:mb-0 md:flex-row">
        <DiscountCode />

        {reservedSubscriptions?.length > 0 && (
          <Button
            onClick={() => setActive({ choosePlan: false, subscriptionInfo: true })}
            variant="link"
            className="font-normal"
          >
            اشتراک‌های رزرو شده
            <MoveLeftIcon />
          </Button>
        )}
      </div>
    </div>
  );
};
