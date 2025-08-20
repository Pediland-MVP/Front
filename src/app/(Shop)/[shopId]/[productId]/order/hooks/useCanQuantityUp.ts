import { Dispatch, useState } from "react";
import { useCheckout } from "../useCheckout";
import { useTranslations } from "next-intl";
import { toast } from "@/components/theme/ui/use-toast";
import logger from "@/utils/logger";
import { OrderNamespace } from "@/types/order/order.namespace";

export function useCanQuantityUp() {

    const t_err = useTranslations('ERROR_CODES')
    const [isLoading, setIsLoading] = useState(false)
    const { productId, outOfStock, setOutOfStock, setOrderQuantity, orderQuantity } = useCheckout()

    const canQuantityUp = async (setLoading: Dispatch<React.SetStateAction<boolean>>): Promise<boolean> => {
        setLoading(true)
        return await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${productId}/canQuantityUp`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                quantity: orderQuantity + 1
            })
        })
        .then(async res => {
            const json = (await res.json() as OrderNamespace.POST.CanQuantityUp)[0]
            if (!res.ok) {
                setOutOfStock(true)
                return false
            }
            if (!json.next) {
                setOutOfStock(true)
            } else {
                setOutOfStock(false)
            }
            setOrderQuantity(old => old + 1)
            return true
        })
        .catch(e => {
            toast({
                title: t_err('CHECK_CONNECTION'),
                variant: "destructive"
            })
            throw e
        })
        .finally(() => setLoading(false))
    }

    return {
        isLoading,
        setIsLoading,
        canQuantityUp
    }

}