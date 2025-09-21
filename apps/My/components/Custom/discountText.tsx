import { usePlanSelection } from "@/app/(Console)/settings/upgrade/hooks/usePlanSelection";
import { ReferralCodeTypeEnum } from "@/types/plans/plans.enum";

export const DiscountText = () => {
  const { plansData } = usePlanSelection();
  const discountFrom = plansData?.discount?.from;
  const discount = plansData?.discount?.discount;
  const referralCodeType = plansData?.discount?.type;

  return (
    <>
      {plansData?.discount?.haveDiscount && (
        <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-center text-sm text-green-600 md:px-1 md:py-3">
          🎁{" "}
          {`${discount?.toLocaleString("fa-IR")} ${referralCodeType === ReferralCodeTypeEnum.FIXED ? "تومان" : "درصد"}`}{" "}
          از طرف {`${discountFrom?.firstname} ${discountFrom?.lastname}`} هدیه
          گرفته‌اید 🎁
          <br />
          (قابل استفاده فقط تا 3 روز آینده)
        </p>
      )}
    </>
  );
};
