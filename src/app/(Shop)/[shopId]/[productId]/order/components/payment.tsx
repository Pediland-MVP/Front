"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Copy,
  CreditCard,
  Check,
  CreditCardIcon,
  CheckIcon,
  CopyIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useCheckout } from "../useCheckout";
import { useCopyToClipboard } from "@/hooks/useCopyToCllipboard";
import useStartPayment from "../hooks/useStartPayment";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import { Button } from "@/components/ui/button";
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

  const { prevStep, nextStep } = useCheckoutStep();

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
    <div className="_customer-details p-4">
      <h2 className="text-primary mb-4 flex items-center gap-2 border-b pb-2 text-lg font-semibold">
        <CreditCardIcon size={28} weight="duotone" className="text-primary" />
        {t("paymentMethod")}
      </h2>

      <div className="mb-6 grid gap-2">
        <RadioGroup
          defaultValue={paymentMethod}
          onValueChange={paymentMehodChangeHandler}
          dir="rtl"
          className="flex flex-col items-start gap-4"
        >
          {!!shop?.user?.paymentDetail.zarinpal && (
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value={ORDER_PAYMENT_METHODS.ZARINPAL}
                id="r1"
                disabled={!shop?.user?.paymentDetail?.zarinpal}
              />
              <Label htmlFor="r1" className={`text-black`}>
                پرداخت اینترنتی
              </Label>
            </div>
          )}

          {!!shop?.user.paymentDetail.cardToCard && (
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
          )}
        </RadioGroup>

        <div className="_card-transfer-text flex flex-col md:items-start">
          {paymentMethod === ORDER_PAYMENT_METHODS.ZARINPAL && (
            <div className="flex h-[245.5px] items-center justify-center gap-x-5">
              <Image
                width={80}
                height={190}
                src={"/images/zarinpal.svg"}
                alt="لوگوی زرین پال"
                quality={100}
              />
              <p className="text-sm leading-relaxed text-gray-600">
                در مرحله بعد به درگاه پرداخت زرین پال منتقل خواهید شد و پرداخت
                شما با پرداخت ایمن زرین پال انجام میشود
              </p>
            </div>
          )}

          {paymentMethod === ORDER_PAYMENT_METHODS.CARD_TO_CARD && (
            <>
              <p className="text-sm leading-relaxed text-gray-600">
                لطفا مبلغ{" "}
                <span className="text-secondary bg-yellow-100 px-1 font-semibold">
                  {(
                    (pendingOrder?.orderProducts?.[0]?.discountPrice
                      ? pendingOrder?.orderProducts?.[0]?.discountPrice *
                        orderQuantity
                      : (pendingOrder?.orderProducts?.[0]?.price || 0) *
                        orderQuantity) + (product?.shippingCost || 0)
                  ).toLocaleString()}{" "}
                  تومان
                </span>
                {product?.shippingCost
                  ? `(شامل ${product.shippingCost.toLocaleString()} تومان هزینه ارسال) `
                  : " "}
                به حساب زیر واریز کرده و تصویر رسید پرداخت خود را در مرحله بعد
                بارگزاری نمایید.
              </p>

              <div className="_card-template mt-3 flex flex-col gap-3 rounded-lg border border-b-[3px] border-sky-600 border-b-sky-600 bg-gradient-to-bl from-blue-50 to-blue-100 p-3">
                <p className="text-secondary font-bold">
                  {cardToCard?.bankName}
                </p>
                <div className="text-secondary flex flex-col text-sm">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">شماره کارت:</span>
                    <div className="flex w-full items-center justify-end gap-2">
                      <span className="font-medium" dir="ltr">
                        {separateTextBySpace(cardToCard?.cardNumber)}
                      </span>
                      <button
                        onClick={copyCardNumber}
                        className="transition-all duration-300 ease-in-out"
                      >
                        {cardNumberCopied ? (
                          <CheckIcon
                            size={22}
                            weight="duotone"
                            className="text-green-500"
                          />
                        ) : (
                          <CopyIcon size={22} weight="duotone" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">شبا:</span>
                    <div className="flex w-full items-center justify-end gap-2">
                      <span className="font-medium">
                        IR - {cardToCard?.iban}
                      </span>
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
                    </div>
                  </div>
                </div>
                <p className="text-secondary text-sm font-medium">
                  <span>دارنده حساب:</span>{" "}
                  <span>{cardToCard?.accountHolder}</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 flex w-full items-center justify-center gap-x-2">
        <ButtonLoading
          isLoading={isStartPaymentLoading}
          onClick={startPaymentHandler}
          className="w-8/12"
        >
          {paymentMethod === ORDER_PAYMENT_METHODS.CARD_TO_CARD
            ? t("nextStep")
            : t("payWithZarinpal")}
        </ButtonLoading>

        <Button
          onClick={() => setStep(prevStep())}
          className="w-4/12"
          variant="outline"
        >
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
