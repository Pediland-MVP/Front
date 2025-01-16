import { Dispatch, useState } from "react";
import { useCheckout } from "../useCheckout";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { toast } from "@/components/theme/ui/use-toast";
import { useTranslations } from "next-intl";


export default function useQuantityUpDown() {

    const t_ec = useTranslations('ERROR_CODES')
    const { pendingOrder, shopId, setOrderQuantity } = useCheckout()
    const [loading, setLoading] = useState(false)
    async function updateQuantity(adjustment: 'increment' | 'decrement') {
        setLoading(true)
        await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${pendingOrder!.id}/${adjustment === 'decrement' ? 'quantityDown' : 'quantityUp'}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            method: 'POST'
        })
        .then (async res => {
            if (res.ok) {
                if (adjustment === 'decrement') {
                    setOrderQuantity(old => old - 1)   
                } else {
                    setOrderQuantity(old => old + 1)
                }
                return await res.json()
            }

            const jsonError = await res.json() as ExceptionMessage
            toast({
                title: t_ec(jsonError.code),
                variant: 'destructive'
            })
        })
        .catch(() => {
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
        updateQuantity,
        loading
    }

}