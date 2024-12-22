import LoadingButton from '@/components/ui/button-loading';
import { useTranslations } from 'next-intl';

type OrderSubmitButtonProps = {
    isLoading: boolean
}

export default function OrderSubmitButton({isLoading}: OrderSubmitButtonProps) {
    const t = useTranslations("Checkout");
    return (
        <LoadingButton isLoading={isLoading} type="submit" className="w-full">
        {t("paynow")}
      </LoadingButton>
    )
}