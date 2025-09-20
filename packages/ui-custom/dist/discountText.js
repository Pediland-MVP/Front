"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DiscountText;
var usePlanSelection_1 = require("@/app/(Console)/settings/upgrade/hooks/usePlanSelection");
var plans_enum_1 = require("@/types/plans/plans.enum");
function DiscountText() {
    var _a, _b, _c, _d;
    var plansData = (0, usePlanSelection_1.usePlanSelection)().plansData;
    var discountFrom = (_a = plansData === null || plansData === void 0 ? void 0 : plansData.discount) === null || _a === void 0 ? void 0 : _a.from;
    var discount = (_b = plansData === null || plansData === void 0 ? void 0 : plansData.discount) === null || _b === void 0 ? void 0 : _b.discount;
    var referralCodeType = (_c = plansData === null || plansData === void 0 ? void 0 : plansData.discount) === null || _c === void 0 ? void 0 : _c.type;
    return (<>
      {((_d = plansData === null || plansData === void 0 ? void 0 : plansData.discount) === null || _d === void 0 ? void 0 : _d.haveDiscount) && (<p className="text-green-600 mt-4 text-center border border-green-200 bg-green-50 rounded-xl p-3 md:py-3 md:px-1 text-sm">
          🎁{" "}
          {"".concat(discount === null || discount === void 0 ? void 0 : discount.toLocaleString("fa-IR"), " ").concat(referralCodeType === plans_enum_1.ReferralCodeTypeEnum.FIXED ? "تومان" : "درصد")}{" "}
          از طرف {"".concat(discountFrom === null || discountFrom === void 0 ? void 0 : discountFrom.firstname, " ").concat(discountFrom === null || discountFrom === void 0 ? void 0 : discountFrom.lastname)} هدیه گرفته‌اید 🎁
          <br />
          (قابل استفاده فقط تا 3 روز آینده)
        </p>)}
    </>);
}
