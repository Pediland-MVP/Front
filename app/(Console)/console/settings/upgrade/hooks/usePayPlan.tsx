import { toast } from "@/components/theme/ui/use-toast";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { SubscriptionNamespace } from "@/types/subscriptions/subscription.namspace";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function usePayPlan() {

    const [isPayLoading, setIsPayLoading] = useState<boolean>(false)
    const router = useRouter()
    const t_ec = useTranslations('ERROR_CODES')

    const pay = async (values: {planId: number, durationId: number}) => {
        setIsPayLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/subscriptions/subscribe`, {
                method: "POST",
                credentials: "include",
                body: JSON.stringify(values),
                headers: {
                    "Content-Type": "application/json"
                }
            })

            
            if (res.ok){
                const json = await res.json() as SubscriptionNamespace.POST.Subscribe
                router.push(json.data.link)
                return
            }

            const json = await res.json() as ExceptionMessage
            const error = t_ec(json.code)
            toast({
                title: error,
                variant: "Success"
            })

        }
        catch(e) {
           toast({
            title: t_ec('CHECK_CONNECTION'),
            variant: "destructive"
           })
        }
        
        finally {
            setIsPayLoading(false)
        }
    }

    return {
        isPayLoading,
        pay
    }

}