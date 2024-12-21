"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CreditCard
} from "@phosphor-icons/react/dist/ssr";
import { Label } from "@/components/theme/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/theme/ui/radio-group";
import { FileUpload } from "@/components/file-upload";
import axios from "axios";
import { OrderNamespace } from "@/types/order";
import { toast } from "@/components/ui/use-toast";


type PaymentDetailsProps = {
  orderCardToCard: OrderNamespace.Order['orderCardToCard']
}
export default function PaymentDetails({ orderCardToCard }: PaymentDetailsProps) {
  const t = useTranslations("Checkout");

  const shopId = "ba4c3ff2-4b94-47a1-97c7-f041c73dbd49";
  const orderId = "c3d5d99e-cab2-4082-ad1d-16e67c04b926";
  const secret = "d7220ce2-8780-4be8-a95d-8f5dea9ff6cc";

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [images, setImages] = useState<string[]>([orderCardToCard.url]);

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append("image", file);

    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${orderId}/${secret}/cardToCard`,
        formData,
        {
          signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`Upload Progress: ${percentCompleted}%`);
              setUploadProgress(percentCompleted);
            } else {
              console.log(`Loaded ${progressEvent.loaded} bytes`);
            }
          },
          withCredentials: true,
        }
      );
      setImages([response.data.data.url]);
      toast({
        title: t("uploadSuccess"),
      })
    } catch (error) {
      console.error(error);
    } finally {
      setUploadProgress(0);
      setIsUploading(false);
    }
  };


  return (
    <div className="_customer-details md:col-span-4">
      <h2 className="text-lg font-semibold mb-5 border-b pb-2 flex items-center gap-2 text-primary">
        <CreditCard size={28} weight="duotone" className="text-primary" />
        {t("paymentMethod")}
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        <RadioGroup
          defaultValue="2"
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
        <div className="_uploader">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture" className="font-normal mb-2 text-gray-500">
              لطفا تصویر رسید وجه پرداختی را بارگذاری نمایید.
            </Label>
            <FileUpload
              className="max-w-[400px]"
              images={images}
              accept="image/*"
              onChange={handleFileUpload}
              progress={uploadProgress}
              isUploading={isUploading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
