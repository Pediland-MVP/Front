import ImageUploader from '@/components/theme/ui/image-upload';
import { Label } from '@/components/theme/ui/label';
import LoadingButton from '@/components/ui/button-loading';
import { useTranslations } from 'next-intl';

type OrderSubmitButtonProps = {
    isLoading: boolean
}

export default function OrderSubmitButton({ isLoading }: OrderSubmitButtonProps) {
    const t = useTranslations("Checkout");
    return (
        <div className="p-3">
            <div className="_uploader mb-6">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="picture" className="font-normal mb-3">
                        لطفا تصویر رسید وجه پرداختی را بارگذاری نمایید.
                    </Label>
                    <ImageUploader
                        // url={`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${orderId}/${secret}/cardToCard`}
                        url=''
                        fieldName="image"
                    // {...orderCardToCard?.url && { defaultImageUrl: orderCardToCard.url }}
                    // className="max-w-[400px]"
                    // uploadProgress={uploadProgress}
                    // onUpload={handleFileUpload}
                    // multiple={false}
                    />
                </div>
            </div>
            <LoadingButton isLoading={isLoading} type="submit" className="w-full" variant={"success"}>
                {t("paynow")}
            </LoadingButton>
        </div>

    )
}