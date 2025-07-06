'use client'
import useSWRImmutable from "swr/immutable";
import CheckoutPage from "./checkout.page";
import { use, useEffect, useState } from 'react';
import useSWR, { mutate } from "swr";
import { OrderNamespace } from "@/types/order/order.namespace";
import api from "@/hooks/swr/api-client";
import { mutateIncludeStringKey } from "@/app/utils/mutateIncludeStringKey";


export default function OrderPage(props: {
  params: Promise<{ shopId: string; productId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {

  const { shopId, productId } = use(props.params);
  const { token } = use(props.searchParams)
  const [isReady, setIsReady] = useState<boolean>(false)


  const { data: authenticated, isLoading: isAuthenticationLoading, error: authenticationError } = useSWRImmutable((token && shopId && productId) ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/leadInstagram/${shopId}/${productId}?token=${token}` : null)
  const { data: pendingOrder, isLoading: isPendingOrderLoading, error: pendingOrderError, mutate } = useSWR<OrderNamespace.GET.Pending>(token && shopId && productId ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/pending` : null)

  //NOTE: Delete pending order if this new order product is not equal to previous
  useEffect(() => {
    if (!productId) return;
    if (isPendingOrderLoading) return;

    if (!pendingOrder) {
      setIsReady(true)
      return
    }

    const run = async () => {
      if (pendingOrder.orderProducts[0].product.id != productId) {
        await api.delete('/orders/pending')
          .then(async () => {
            await mutate(undefined)
          })
          .catch(e => {
            console.log('Error in deleting previous order', e);
          })
          .finally(() => {
            setIsReady(true)
          })
      } else {
        setIsReady(true)
        return
      }
    }

    run()

  }, [pendingOrder, isPendingOrderLoading, productId])


  if (!isReady && isAuthenticationLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <span className="text-2xl font-semibold">درحال بارگذاری...</span>
      </div>
    )
  }

  if (isReady && !isAuthenticationLoading) {
    return <CheckoutPage shopId={shopId} productId={productId} token={token} />;
  }
}
