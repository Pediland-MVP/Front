import { useTranslations } from "next-intl"


export default function UnAuthorized() {
    const t = useTranslations('Checkout.UnAuthorized');
    return (
        <div className="_checkout flex flex-col justify-center items-center bg-white border h-svh rounded-xl p-5 md:p-10">
            <p className="text-xl font-medium">{t('accessDenied')}</p>
        </div>
    )

}