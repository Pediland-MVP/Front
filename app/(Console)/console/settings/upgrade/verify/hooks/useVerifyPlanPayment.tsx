import { mutateIncludeStringKey } from "@/app/utils/mutateIncludeStringKey";
import { toast } from "@/components/theme/ui/use-toast";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { PaymentNamespace } from "@/types/payments/payment.namespace";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { mutate } from "swr";

export default function useVerifyPlanPayment() {

    const [isLoading, setIsLoading] = useState(false)
    const searchParams = useSearchParams()
    const t_ec = useTranslations('ERROR_CODES')

    const verify = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/v1/payments/subscription/zarinpal/verify?Authority=${searchParams.get('Authority')}&Status=${searchParams.get('Status')}`)
            if (!res.ok) {
                const json = await res.json() as ExceptionMessage
                toast({
                    title: t_ec(json.code),
                    variant: 'destructive'
                })
                return
            }
            const json = await res.json() as PaymentNamespace.GET.SubscriptionPaymentVerify
            await mutate(mutateIncludeStringKey('me'))
            return json.data.ref_id
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setIsLoading(false)
        }

    }

    return {
        isLoading,
        verify
    }

}