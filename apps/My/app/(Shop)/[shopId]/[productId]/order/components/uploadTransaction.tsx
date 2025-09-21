import { ImageUploader } from "@befroosh/ui";
import { Label } from "@befroosh/ui";
import { LoadingButton } from "@befroosh/ui-custom";
import { useTranslations } from "next-intl";
import { useCheckout } from "../useCheckout";
import { mutate } from "swr";
import useProcessOrder from "../hooks/useProcessOrder";
import { Button } from "@befroosh/ui";
import { useState } from "react";

export default function UploadTransaction() {
  const t = useTranslations("Checkout");
  const { pendingOrder, setStep } = useCheckout();
  const [uploaded, setUploaded] = useState(
    !!pendingOrder?.orderCardToCard?.url,
  );

  const onUploaded = async () => {
    await mutate((key) => typeof key === "string" && key.includes("pending"));
    setUploaded(true);
  };

  const { processOrder, loading: isOrderProcessLoading } = useProcessOrder();
  const processOrderHandler = () => {
    processOrder();
  };

  return (
    <div className="p-3">
      <div className="_uploader mb-6">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="picture" className="mb-3 font-normal">
            لطفا تصویر رسید وجه پرداختی را بارگذاری نمایید.
          </Label>
          <ImageUploader
            defaultImageUrl={
              pendingOrder?.orderCardToCard?.url
                ? pendingOrder?.orderCardToCard?.url
                : ""
            }
            onUploadComplete={onUploaded}
            fieldName="image"
            url={`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${pendingOrder?.id}/cardToCard`}
          />
        </div>
      </div>
      <div className="mt-6 flex w-full items-center justify-center gap-x-2">
        <Button onClick={() => setStep(3)} className="3/12 bg-gray-500">
          {t("back")}
        </Button>

        <LoadingButton
          disabled={!uploaded}
          isLoading={isOrderProcessLoading}
          onClick={processOrderHandler}
          className="w-full"
          type="button"
        >
          {t("paynow")}
        </LoadingButton>
      </div>
    </div>
  );
}
