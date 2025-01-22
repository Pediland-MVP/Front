'use client'
import { toast } from "@/components/theme/ui/use-toast"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { use, useEffect, useState } from "react"


type VerifyPageProps = {
    searchParams: Promise<{
        Authority: string,
        Status: 'OK' | 'NOK'
    }>
}
export default function VerifyPage ({ searchParams  }: VerifyPageProps) {

    const {Authority, Status} = use(searchParams)
    const t_ec = useTranslations('ERROR_CODES')
    const [isLoading, setIsLoading] = useState(false)
    const [isOk, setIsOk] = useState<boolean>()
    const [refId, setRefId] = useState()

    useEffect(() => {
        if (!Authority && !Status) return
        setIsLoading(true)
        fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/payments/zarinpal/verify?Authority=${Authority}&Status=${Status}`, {
            credentials: 'include'
        })
        .then(async res => {
            if (res.ok) {
                const json = await res.json()
                setIsOk(true)
                setRefId(json?.data?.ref_id)
                return 
            }
            setIsOk(false)
        })
        .catch((e) => {
            toast({
                title: t_ec('CHECK_CONNECTION'),
                variant: 'destructive'
            })
        })
        .finally(() => {
            setIsLoading(false)
        })
    }, [Authority, Status])

    if (isLoading) {
        return (
            <div className="h-svh flex justify-center items-center">
                <span className="loading loading-spinner text-primary">درحال بارگزاری</span>
            </div>
        )
    }

    return (
        <div className="h-svh flex justify-center items-center">
            {
                isOk === true ?
                (
                    <div className="flex flex-col justify-center items-center gap-2">
                        <Image src={'/images/emojies/smiling-face-with-hearts.webp'} height={200} width={200} alt={'قلب'} />
                        <span className="text-primary font-semibold text-2xl">پرداخت با موفقیت انجام شد</span>
                        <span className="px-3 text-center">به محض تایید توسط فروشنده، ادامه فرایند از طریق دایرکت اینستاگرام به شما اطلاع داده خواهد شد</span>
                        <span className="text-xs text-black/40">کد رهگیری درگاه پرداخت:‌ {refId}</span>
                    </div>
                ) :
                isOk === false &&
                (
                    <div className="flex flex-col justify-center items-center gap-2">
                        <Image src={'/images/emojies/broken-heart.webp'} height={200} width={200} alt={'قلب شکسته'} />
                        <span className="text-primary font-semibold text-2xl">پرداخت با شکست مواجه شد</span>
                    </div>
                )
            }
        </div>
    )
}