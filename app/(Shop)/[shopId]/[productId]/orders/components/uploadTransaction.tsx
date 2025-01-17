import ImageUploader from '@/components/theme/ui/image-upload';
import { Label } from '@/components/theme/ui/label';
import LoadingButton from '@/components/ui/button-loading';
import { useTranslations } from 'next-intl';
import { useCheckout } from '../useCheckout';
import { mutate } from 'swr';

type UploadTransactionProps = {
    isLoading: boolean
}

export default function UploadTransaction({ isLoading }: UploadTransactionProps) {
    const t = useTranslations("Checkout");
    const { pendingOrder } = useCheckout()

    const onUploaded =() => {
        mutate(key => typeof key === 'string' && key.includes("pending"))
    }

    return (
        <div className="p-3">
            <div className="_uploader mb-6">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="picture" className="font-normal mb-3">
                        لطفا تصویر رسید وجه پرداختی را بارگذاری نمایید.
                    </Label>
                    <ImageUploader defaultImageUrl={pendingOrder?.orderCardToCard?.url ? pendingOrder?.orderCardToCard?.url : undefined} onUploadComplete={onUploaded} fieldName='image' url={`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${pendingOrder?.id}/cardToCard`} />
                </div>
            </div>
            <LoadingButton isLoading={isLoading} type="submit" className="w-full" variant={"success"}>
                {t("paynow")}
            </LoadingButton>
        </div>

    )
}