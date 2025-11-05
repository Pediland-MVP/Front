import ImageUploader from "@/components/ui/image-upload";
import { Label } from "@/components/ui/label";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import { useTranslations } from "next-intl";
import { useCheckout } from "../useCheckout";
import { mutate } from "swr";
import useProcessOrder from "../hooks/useProcessOrder";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

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
        <div className="grid w-full items-center gap-1.5">
          <Label
            htmlFor="picture"
            className="mb-3 font-normal md:justify-center"
          >
            لطفا تصویر رسید وجه پرداختی را بارگذاری نمایید.
          </Label>
          <ImageUploader
            defaultImageUrl={
              pendingOrder?.orderCardToCard?.url
                ? pendingOrder?.orderCardToCard?.url
                : undefined
            }
            onUploadComplete={onUploaded}
            fieldName="image"
            url={`${API_URL}/orders/${pendingOrder?.id}/cardToCard`}
          />
        </div>
      </div>
      <div className="mt-6 flex w-full items-center justify-center gap-x-2">
        <ButtonLoading
          disabled={!uploaded}
          isLoading={isOrderProcessLoading}
          onClick={processOrderHandler}
          className="flex-1"
          type="button"
        >
          {t("paynow")}
        </ButtonLoading>
        <Button onClick={() => setStep(3)} variant="outline">
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
