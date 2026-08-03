import { useSubscriptionStore } from '@/store/subscriptionStore';
// TODO: Refactor Types & Schemas
import { ReferralCodeTypeEnum } from '@/types/plans/plans.enum';

import { Card, CardContent } from '@/components/ui';
import { GiftIcon } from '@phosphor-icons/react/dist/ssr/Gift';

export const DiscountAlert = () => {
  const {
    active,
    setActive,
    plansData,
    subscriptions,
    isLoading: isSubscriptionsLoading,
    discountCode,
    setDiscountCode,
  } = useSubscriptionStore();

  const discountFrom = plansData?.discount?.from;
  const discount = plansData?.discount?.discount;
  const referralCodeType = plansData?.discount?.type;
  const fixed = referralCodeType === ReferralCodeTypeEnum.FIXED;

  return (
    <>
      {plansData?.discount?.haveDiscount && (
        <Card className="rounded-lg border-green-200 bg-green-50 p-0 text-sm leading-relaxed font-medium text-green-600">
          <CardContent className="flex items-center gap-2 px-3 py-2">
            <div>
              <GiftIcon size={26} weight="duotone" />
            </div>
            <p>
              {fixed ? 'مبلغ ' : ''}
              <span className="font-bold">{`${discount?.toLocaleString('fa-IR') || 0} ${fixed ? 'تومان' : 'درصد'}`}</span>{' '}
              از طرف {`${discountFrom?.firstname || '...'} ${discountFrom?.lastname || '...'}`} به
              عنوان هدیه دریافت کردید.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
