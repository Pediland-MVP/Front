import { usePlanSelection } from "@/app/(Console)/settings/subscription/hooks/usePlanSelection";
import { ReferralCodeTypeEnum } from "@/types/plans/plans.enum";
import { Card, CardContent } from "../ui";
import { GiftIcon } from "@phosphor-icons/react/dist/ssr";

export const DiscountAlert = () => {
  const { plansData } = usePlanSelection();
  const discountFrom = plansData?.discount?.from;
  const discount = plansData?.discount?.discount;
  const referralCodeType = plansData?.discount?.type;

  const fixed = referralCodeType === ReferralCodeTypeEnum.FIXED;

  return (
    <>
      {!plansData?.discount?.haveDiscount && (
        <Card className="rounded-lg border-green-200 bg-green-50 p-0 text-[13px] font-medium text-green-600">
          <CardContent className="flex flex-col items-center gap-1.5 px-3 py-2">
            <div className="item-center flex gap-2">
              <GiftIcon
                size={28}
                weight="duotone"
                className="text-purple-500"
              />
              <p className="flex items-center gap-1">
                شما {fixed ? "مبلغ " : ""}
                <span className="font-bold">{`${discount?.toLocaleString("fa-IR")} ${fixed ? "تومان" : "درصد"}`}</span>{" "}
                از طرف {`${discountFrom?.firstname} ${discountFrom?.lastname}`}{" "}
                به عنوان هدیه دریافت کردید. این هدیه تا{" "}
                <span className="font-bold">3 روز آینده</span> قابل استفاده است.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
