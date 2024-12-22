import { useTranslations } from "next-intl"


export default function OrderNotfound() {
    const t = useTranslations('Checkout')
    return (
        <div className="_checkout flex justify-center items-center bg-white border h-[200px] rounded-xl p-5 md:p-10">
            <p className="text-xl font-medium">{t('orderInvalid')}</p>
        </div>
    )

}