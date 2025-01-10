import { useTranslations } from "next-intl"


export default function OrderProcessing() {
    const t = useTranslations('Checkout');
    return (
        <div className="_checkout flex flex-col justify-center items-center bg-white border h-[200px] rounded-xl p-5 md:p-10">
            <p className="text-xl font-medium">{t('orderProcessing')}</p>
            <p className="text-lg w-[60ch] text-center">{t('orderProcessingDescription')}</p>
        </div>
    )

}