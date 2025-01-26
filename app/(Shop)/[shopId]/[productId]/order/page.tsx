'use client'
import useSWRImmutable from "swr/immutable";
import CheckoutPage from "./checkout.page";
import { use, useEffect } from 'react';


export default function OrderPage(props: {
  params: Promise<{ shopId: string; productId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {

  const { shopId, productId } = use(props.params);
  const { token } = use(props.searchParams)


  const { data: authenticated, isLoading: isAuthenticationLoading, error: authenticationError } = useSWRImmutable((token && shopId && productId) ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/leadInstagram/${shopId}/${productId}?token=${token}` : null)

  if (isAuthenticationLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <span className="text-2xl font-semibold">درحال بارگذاری...</span>
      </div>
    )
  }

  return <CheckoutPage shopId={shopId} productId={productId} token={token} />;
}
