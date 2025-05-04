"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Label } from "@/components/theme/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/theme/ui/radio-group";
import { Copy, CreditCard, Check } from "@phosphor-icons/react/dist/ssr";
import { useCheckout } from "../useCheckout";
import { useCopyToClipboard } from "@/hooks/useCopyToCllipboard";
import useStartPayment from "../hooks/useStartPayment";
import LoadingButton from "@/components/ui/button-loading";
import { Button } from "@/components/theme/ui/button";
import { ORDER_PAYMENT_METHODS } from "@/types/order/order.enum";
import Image from "next/image";
import useCheckoutStep from "../hooks/useCheckoutStep";

export default function PaymentDetails() {
  const t = useTranslations("Checkout");
  const {
    shop,
    product,
    orderQuantity,
    pendingOrder,
    setStep,
    setPaymentMethod,
    paymentMethod,
  } = useCheckout();
  const cardToCard = shop?.user.paymentDetail.cardToCard;
  const { copyToClipboard } = useCopyToClipboard();

  const { prevStep, nextStep } = useCheckoutStep()

  const [cardNumberCopied, setCardNumberCopied] = useState(false);
  const [ibanCopied, setIbanCopied] = useState(false);

  const { startPayment, loading: isStartPaymentLoading } = useStartPayment();

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
  };

  const copyIban = async () => {
    if (await copyToClipboard(cardToCard?.iban!)) {
      setIbanCopied(true);
      setTimeout(() => setIbanCopied(false), 5000);
    }
  };

  const startPaymentHandler = async () => {
    // if (pendingOrder!.step >= 4 && paymentMethod === ORDER_PAYMENT_METHODS.CARD_TO_CARD) {
    //   return setStep(4);
    // }
    startPayment();
  };

  const paymentMehodChangeHandler = (value: ORDER_PAYMENT_METHODS) => {
    setPaymentMethod!(value);
  };

  return (
    <div className="_customer-details md:col-span-4 p-3">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2 text-primary">
        <CreditCard size={28} weight="duotone" className="text-primary" />
        {t("paymentMethod")}
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <RadioGroup
          defaultValue={paymentMethod}
          onValueChange={paymentMehodChangeHandler}
          dir="rtl"
          className="gap-4 items-start flex flex-col"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value={ORDER_PAYMENT_METHODS.ZARINPAL}
              id="r1"
              disabled={!shop?.user?.paymentDetail?.zarinpal}
            />
            <Label
              htmlFor="r1"
              className={`text-base ${!shop?.user?.paymentDetail?.zarinpal && "text-black/30"}`}
            >
              پرداخت اینترنتی
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value={ORDER_PAYMENT_METHODS.CARD_TO_CARD}
              id="r2"
              disabled={!shop?.user?.paymentDetail?.cardToCard}
            />
            <Label
              htmlFor="r2"
              className={`text-base ${!shop?.user?.paymentDetail?.cardToCard && "text-black/30"}`}
            >
              کارت به کارت
            </Label>
          </div>
        </RadioGroup>

        <div className="_card-transfer-text">
          {paymentMethod === ORDER_PAYMENT_METHODS.ZARINPAL && (
            <div className="flex justify-center items-center gap-x-5 h-[245.5px]">
              <Image
                width={80}
                height={190}
                src={"/images/zarinpal.svg"}
                alt="لوگوی زرین پال"
                quality={100}
              />
              <p className="text-sm text-gray-600 leading-relaxed">
                در مرحله بعد به درگاه پرداخت زرین پال منتقل خواهید شد و پرداخت
                شما با پرداخت ایمن زرین پال انجام میشود
              </p>
            </div>
          )}

          {paymentMethod === ORDER_PAYMENT_METHODS.CARD_TO_CARD && (
            <>
              <p className="text-sm text-gray-600 leading-relaxed">
                لطفا مبلغ{" "}
                <span className="bg-yellow-100 font-semibold px-1 text-primary">
                  {product?.discountPrice
                    ? (product!.discountPrice * orderQuantity).toLocaleString()
                    : (product!.price * orderQuantity).toLocaleString()}{" "}
                  تومان
                </span>{" "}
                به حساب زیر واریز کرده و تصویر رسید پرداخت خود را در مرحله بعد
                بارگزاری نمایید.
              </p>
              <div className="_card-template border-2 border-sky-600 border-b-[6px] border-b-sky-600 bg-sky-100/60 p-4 rounded-lg flex flex-col gap-8 mt-3">
                <p className="font-bold text-sky-900">{cardToCard?.bankName}</p>
                <div className="flex flex-col gap-2 mb-3 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <span>شماره کارت:</span>{" "}
                    <span className="font-medium" dir="ltr">
                      {separateTextBySpace(cardToCard?.cardNumber)}
                    </span>
                    <button
                      onClick={copyCardNumber}
                      className="transition-all duration-300 ease-in-out"
                    >
                      {cardNumberCopied ? (
                        <Check
                          size={22}
                          weight="duotone"
                          className="text-green-500"
                        />
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
                        <Check
                          size={22}
                          weight="duotone"
                          className="text-green-500"
                        />
                      ) : (
                        <Copy size={22} weight="duotone" />
                      )}
                    </button>
                  </p>
                  <p>
                    <span>دارنده حساب:</span>{" "}
                    <span className="font-medium">
                      {cardToCard?.accountHolder}
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
        <div className="mt-2 w-full flex justify-center items-center gap-x-2">
          <Button onClick={() => setStep(prevStep())} className="w-4/12 bg-gray-500 hover:bg-gray-400">
            {t("back")}
          </Button>

          <LoadingButton
            isLoading={isStartPaymentLoading}
            onClick={startPaymentHandler}
            className="w-8/12"
          >
            {paymentMethod === ORDER_PAYMENT_METHODS.CARD_TO_CARD
              ? t("nextStep")
              : t("payWithZarinpal")}
          </LoadingButton>
        </div>
    </div>
  );
}
