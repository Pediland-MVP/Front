import { Card } from "@befroosh/ui"
import { useTranslations } from "next-intl"
import Image from "next/image"


export default function OrderNotfound() {
    const t = useTranslations('Checkout')

    return (
        <Card className="_checkout-notfound border rounded-lg min-h-80 flex justify-center items-center">
            <div className="flex flex-col gap-3 items-center">
                <Image src="/images/emojies/emj-02.webp" alt="404" width={90} height={90} className="mx-auto" />
                <p className="font-medium text-center w-2/3">{t('orderInvalid')}</p>
            </div>
        </Card>
    )

}