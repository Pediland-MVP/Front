import { usePlanSelection } from "@/app/(Console)/settings/subscription/hooks/usePlanSelection";
// TODO: Refactor Types & Schemas
import { ReferralCodeTypeEnum } from "@/types/plans/plans.enum";

import { Card, CardContent } from "@components";

export const DiscountAlert = () => {
  const { plansData } = usePlanSelection();
  const discountFrom = plansData?.discount?.from;
  const discount = plansData?.discount?.discount;
  const referralCodeType = plansData?.discount?.type;
  const fixed = referralCodeType === ReferralCodeTypeEnum.FIXED;

  return (
    <>
      {plansData?.discount?.haveDiscount && (
        <Card className="rounded-lg border-green-200 bg-green-50 p-0 text-[13px] font-medium text-green-600">
          <CardContent className="px-3 py-2">
            <div className="space-y-1 text-center">
              <p>
                🎁 شما {fixed ? "مبلغ " : ""}
                <span className="font-bold">{`${discount?.toLocaleString("fa-IR") || 0} ${fixed ? "تومان" : "درصد"}`}</span>{" "}
                از طرف{" "}
                {`${discountFrom?.firstname || "..."} ${discountFrom?.lastname || "..."}`}{" "}
                به عنوان هدیه دریافت کردید. 🎁
              </p>
              <p>
                این هدیه تا <span className="font-bold">3 روز آینده</span> قابل
                استفاده است.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
