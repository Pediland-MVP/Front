import { useFormContext } from "react-hook-form"
import { set, z } from "zod"
import { orderFormSchema } from '../checkout.page';
import { useCheckout } from "../useCheckout";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { useTranslations } from "next-intl";
import { toast } from "@/components/theme/ui/use-toast";
import { useEffect, useState } from "react";


export default function useShipping() {

    const { getValues } = useFormContext<z.infer<typeof orderFormSchema>>()
    const { setStep, pendingOrder } = useCheckout()

    useEffect(() => {
      console.log(pendingOrder)
    }, [pendingOrder])
    const t_ec = useTranslations('ERROR_CODES')
    const [loading, setLoading] = useState(false)
    const updateShipping = async (values?: z.infer<typeof orderFormSchema>) => {
        setLoading(true)
        const {cityId, address, postalcode} = values || getValues()
        await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${pendingOrder?.id}/updateShipping`, {
          method: "PATCH",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cityId,
            address,
            postalcode
          }),
          credentials: 'include'
        })
        .then(async res => {
          if (res.ok) {
            setStep(3)
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
        updateShipping,
        loading
    }

}