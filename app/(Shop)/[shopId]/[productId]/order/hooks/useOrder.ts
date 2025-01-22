import { useFormContext } from "react-hook-form"
import { useCheckout } from "../useCheckout"
import { ExceptionMessage } from "@/types/exceptionMessage"
import { useTranslations } from "next-intl"
import { toast } from "@/components/theme/ui/use-toast"
import { useState } from "react"
import { z } from "zod"
import { orderFormSchema } from "../checkout.page"
import { mutate } from "swr"


export default function useOrder() {

    const { getValues } = useFormContext<z.infer<typeof orderFormSchema>>()
    const { shopId, productId, orderQuantity, setStep } = useCheckout()
    const t_ec = useTranslations('ERROR_CODES')
    const [loading, setIsLoading] = useState(false)

    async function createOrder(values?: z.infer<typeof orderFormSchema>) {
        setIsLoading(true)
        const {firstname, lastname, mobile} = values || getValues()
        await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${productId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            firstname,
            lastname,
            mobile,
            quantity: orderQuantity
          })
        })
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json()
            // setOrderId(json.id)
            await mutate(key => typeof key === 'string' && (key.includes("pending")))
            return setStep(2)
          }
          const resJson = await res.json() as ExceptionMessage
          toast({
            title: t_ec(resJson.code),
            description: 'لطفا تعداد را کم کنید یا یک محصول دیگر انتخاب کنید',
            variant: "destructive"
          })
          await mutate(key => typeof key === 'string' && (key.includes("/products")))
        })
        .catch((err) => {
          toast({
            title: 'خطایی پیش آمد',
            description: 'لطفا دوباره تلاش کنید',
            variant: "destructive"
          })
          return
        })
        .finally(() => {
          setIsLoading(false)
        })
    }

    return {
        createOrder,
        loading   
    }

}