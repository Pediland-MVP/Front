import { Dispatch, useState } from "react";
import { useCheckout } from "../useCheckout";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { toast } from "@/components/ui-custom/use-toast";
import { useTranslations } from "next-intl";
import { mutate } from "swr";


export default function useQuantityUpDown() {

    const t_ec = useTranslations('ERROR_CODES')
    const { pendingOrder, shopId, setOrderQuantity,  setOutOfStock,productId } = useCheckout()
    const [loading, setLoading] = useState(false)
    async function updateQuantity(adjustment: 'increment' | 'decrement') {
        setLoading(true)
        await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${pendingOrder!.id}/${adjustment === 'decrement' ? 'quantityDown' : 'quantityUp'}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            method: 'POST',
            body: JSON.stringify({
                productId
            })
        })
        .then (async res => {
            if (res.ok) {
                if (adjustment === 'decrement') {
                    setOutOfStock(false)
                    setOrderQuantity(old => old - 1)   
                } else {
                    setOrderQuantity(old => old + 1)
                    
                }
                const json = await res.json()
                if (!json.next) {
                    setOutOfStock(true)
                }
                return
            }

            const jsonError = await res.json() as ExceptionMessage
            if (jsonError.code === 'PRODUCT_OUT_OF_STOCK') { 
                setOutOfStock(true)
            }
        })
        .catch((e) => {
            console.error(e)
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