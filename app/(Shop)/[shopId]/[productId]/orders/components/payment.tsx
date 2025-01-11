"use client";

import { useTranslations } from "next-intl";
import { OrderNamespace } from "@/types/order";
// UI 
import { Label } from "@/components/theme/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/theme/ui/radio-group";
import { Copy, CreditCard } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/theme/ui/button";


export default function PaymentDetails() {
  const t = useTranslations("Checkout");
  

  return (
    <div className="_customer-details md:col-span-4 p-3">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2 text-primary">
        <CreditCard size={28} weight="duotone" className="text-primary" />
        {t("paymentMethod")}
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <RadioGroup
          dir="rtl"
          className="gap-4 items-start flex flex-col"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="1" id="r1" disabled />
            <Label htmlFor="r1" className="text-base text-gray-400">
              پرداخت آنلاین (زرین پال) - بزودی
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="2" id="r2" />
            <Label htmlFor="r2" className="text-base">
              کارت به کارت
            </Label>
          </div>
        </RadioGroup>

        <div className="_card-transfer-text">
          <p className="text-sm text-gray-600 leading-relaxed">لطفا مبلغ <span className="bg-yellow-100 font-semibold px-1 text-primary">250.000 تومان</span> به حساب زیر واریز کرده و تصویر رسید پرداخت خود را در مرحله بعد بارگزاری نمایید.</p>
          <div className="_card-template border-2 border-sky-600 border-b-[6px] border-b-sky-600 bg-sky-100/60 p-4 rounded-lg flex flex-col gap-8 mt-3">
            <p className="font-bold text-sky-900">بانک سامان</p>
            <div className="flex flex-col gap-2 mb-3 text-sm text-gray-700">
              <p className="flex items-center gap-2"><span>شماره کارت:</span> <span className="font-medium">1234 1234 1234 1234</span><Copy size={22} weight="duotone" /></p>
              <p className="flex items-center gap-2"><span>شبا:</span><span className="font-medium">IR - 123400000000000000001234</span><Copy size={22} weight="duotone" /></p>
              <p><span>دارنده حساب:</span> <span className="font-medium">علی دائی</span></p>
            </div>
          </div>
        </div>

        <div className="mt-2 w-full">
          <Button className="w-full" variant={"success"}>
            {t("nextStep")}
          </Button>
        </div>
      </div>
    </div>
  );
}
