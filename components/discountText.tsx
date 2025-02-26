import { usePlanSelection } from "@/app/(Console)/console/settings/upgrade/hooks/usePlanSelection";
import { ReferralCodeTypeEnum } from "@/types/plans/plans.enum";

export default function DiscountText() {
  const { plansData } = usePlanSelection();
  const discountFrom = plansData?.discount?.from;
  const discount = plansData?.discount?.discount;
  const referralCodeType = plansData?.discount?.type;

  return (
    <>
      {plansData?.discount.haveDiscount && (
        <p className="text-green-600 mt-4 text-center border border-green-200 bg-green-50 rounded-xl p-3 md:py-3 md:px-1 text-[15px]">
          🎁{" "}
          {`${discount?.toLocaleString("fa-IR")} ${referralCodeType === ReferralCodeTypeEnum.FIXED ? "تومان" : "درصد"}`}{" "}
          از طرف {`${discountFrom?.firstname} ${discountFrom?.lastname}`} هدیه گرفته‌اید 🎁
          <br/>
          (قابل استفاده فقط تا 3 روز آینده)
        </p>
      )}
    </>
  );
}
