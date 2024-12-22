import logger from "@/app/utils/logger"
import CheckoutPage from "./checkout.page"

export default async function OrderPage(props: {params: Promise<{shopId: string, orderId: string, secret: string}>, searchParams: Promise<any>}) {

  const { shopId, orderId, secret } = await props.params

  return (
    <CheckoutPage shopId={shopId} orderId={orderId} secret={secret} />
  )

}