import { useTranslations } from "next-intl"


export default function OrderSubmitted () {
    const t = useTranslations('Checkout.OrderSubmitted')
    return (
        <div className="w-full flex flex-col justify-center items-center">
            <p>{t('title')}</p>
            <p>{t('description')}</p>
        </div>
    )
}