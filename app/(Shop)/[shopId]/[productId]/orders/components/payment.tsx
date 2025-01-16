"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Label } from "@/components/theme/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/theme/ui/radio-group";
import { Copy, CreditCard, Check } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/theme/ui/button";
import { useCheckout } from "../useCheckout";
import { useCopyToClipboard } from "@/hooks/useCopyToCllipboard";
import useStartPayment from "../hooks/useStartPayment";
import LoadingButton from '@/components/ui/button-loading';

export default function PaymentDetails() {
  const t = useTranslations("Checkout");
  const { shop, product, orderQuantity } = useCheckout();
  const cardToCard = shop?.user.paymentDetail.cardToCard;
  const { copyToClipboard } = useCopyToClipboard();

  const [cardNumberCopied, setCardNumberCopied] = useState(false);
  const [ibanCopied, setIbanCopied] = useState(false);

  const { startPayment, loading: isStartPaymentLoading } = useStartPayment()
  function separateTextBySpace(text: string | undefined): string {
    if (!text) return "";
    const cleanedText = text.replace(/\s/g, "");
    return cleanedText.replace(/(\d{4})/g, "$1 ").trim();
  }
  
  const copyCardNumber = async () => {
    if (await copyToClipboard(cardToCard?.cardNumber!)) {
      setCardNumberCopied(true);
      setTimeout(() => setCardNumberCopied(false), 5000);
    }
  }

  const copyIban = async () => {
    if (await copyToClipboard(cardToCard?.iban!)) {
      setIbanCopied(true);
      setTimeout(() => setIbanCopied(false), 5000);
    }
  }

  const startPaymentHandler = async () => {
    startPayment()
  }

  return (
    <div className="_customer-details md:col-span-4 p-3">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2 text-primary">
        <CreditCard size={28} weight="duotone" className="text-primary" />
        {t("paymentMethod")}
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <RadioGroup dir="rtl" className="gap-4 items-start flex flex-col">
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
          <p className="text-sm text-gray-600 leading-relaxed">
            لطفا مبلغ{" "}
            <span className="bg-yellow-100 font-semibold px-1 text-primary">
              {product?.discountPrice ? product!.discountPrice * orderQuantity : product!.price * orderQuantity} تومان
            </span>{" "}
            به حساب زیر واریز کرده و تصویر رسید پرداخت خود را در مرحله بعد
            بارگزاری نمایید.
          </p>
          <div className="_card-template border-2 border-sky-600 border-b-[6px] border-b-sky-600 bg-sky-100/60 p-4 rounded-lg flex flex-col gap-8 mt-3">
            <p className="font-bold text-sky-900">{cardToCard?.bankName}</p>
            <div className="flex flex-col gap-2 mb-3 text-sm text-gray-700">
              <p className="flex items-center gap-2">
                <span>شماره کارت:</span>{" "}
                <span className="font-medium">{separateTextBySpace(cardToCard?.cardNumber)}</span>
                <button 
                  onClick={copyCardNumber}
                  className="transition-all duration-300 ease-in-out"
                >
                  {cardNumberCopied ? (
                    <Check size={22} weight="duotone" className="text-green-500" />
                  ) : (
                    <Copy size={22} weight="duotone" />
                  )}
                </button>
              </p>
              <p className="flex items-center gap-2">
                <span>شبا:</span>
                <span className="font-medium">IR - {cardToCard?.iban}</span>
                <button 
                  onClick={copyIban}
                  className="transition-all duration-300 ease-in-out"
                >
                  {ibanCopied ? (
                    <Check size={22} weight="duotone" className="text-green-500" />
                  ) : (
                    <Copy size={22} weight="duotone" />
                  )}
                </button>
              </p>
              <p>
                <span>دارنده حساب:</span>{" "}
                <span className="font-medium">{cardToCard?.accountHolder}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2 w-full">
          <LoadingButton isLoading={isStartPaymentLoading} onClick={startPaymentHandler} className="w-full" variant={"success"}>
            {t("nextStep")}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}

