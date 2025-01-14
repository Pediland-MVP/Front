import CheckoutPage from "./checkout.page"

export default async function OrderPage(props: { params: Promise<{ shopId: string, orderId: string, productId: string }>, searchParams: Promise<{token?: string}> }) {
  const { shopId, productId, orderId } = await props.params
  const { token } = await props.searchParams


  return (
    <CheckoutPage shopId={shopId} productId={productId} token={token} />
  )
}