import { useFormContext } from "react-hook-form";
import { useCheckout } from "../useCheckout";
import { mutate } from "swr";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import useCheckoutStep from "./useCheckoutStep";
import { IResponseMessage } from "@/types/responseMessage";
import { OrderNamespace } from "@/types/order/order.namespace";
import { useRouter } from "next/navigation";


export default function useUpdateContact() {

    const { getValues } = useFormContext()
    const { pendingOrder, setStep } = useCheckout()
    const t_ec = useTranslations('ERROR_CODES')
    const [loading, setLoading] = useState(false)

    const router = useRouter()

    const {nextStep} = useCheckoutStep()

    async function updateContact() {
        setLoading(true)
        await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${pendingOrder?.id}/updateContact`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                ...getValues()
            }),
            credentials: 'include'
        })
        .then (async res => {
            if (res.ok) {
                const json = await res.json() as OrderNamespace.POST.UpdateContact
                if (json.code === 'PAID_FREE') {
                    router.push('/payments/verify?ItsFree=true')
                    return
                }
                mutate(key => typeof key === 'string' && key.includes("pending"))
                setStep(nextStep())
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
        .finally(() => setLoading(false))
    }

    return {
        updateContact,
        loading
    }

}