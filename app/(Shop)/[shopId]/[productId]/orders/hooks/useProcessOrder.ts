import { toast } from "@/components/theme/ui/use-toast"
import { useCheckout } from "../useCheckout"
import { useTranslations } from "next-intl"
import { ExceptionMessage } from "@/types/exceptionMessage"
import { useState } from "react"


export default function useProcessOrder() {

    const { pendingOrder } = useCheckout()
    const [loading, setLoading] = useState(false)
    const t = useTranslations('Checkout')
    const t_ec = useTranslations('ERROR_CODES')

    async function processOrder() {
        setLoading(true)
        await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${pendingOrder?.id}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
        })
        .then(async res => {
            if (res.ok) {
                toast({
                    title: t('orderSubmitSuccessFull'),
                })
                return 
            }

            const resJson = await res.json() as ExceptionMessage
            toast({
                title: t_ec(resJson.code),
                variant: 'destructive'
            })
        })
        .catch(e => {
            toast({
                title: t_ec('CHECK_CONNECTION'),
                variant: 'destructive'
            })
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return {
        processOrder,
        loading
    }

}