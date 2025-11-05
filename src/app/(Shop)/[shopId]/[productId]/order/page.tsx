"use client";

import api from "@/hooks/swr/api-client";
import { OrderNamespace } from "@/types/order/order.namespace";
import { useSearchParams } from "next/navigation";
import { Suspense, use, useEffect, useState } from "react";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import { CheckoutPage, LoaderSpin } from "@components";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

function OrderPageContent({
  shopId,
  productId,
}: {
  shopId: string;
  productId: string;
}) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? undefined;
  const [isReady, setIsReady] = useState<boolean>(false);

  const {
    data: authenticated,
    isLoading: isAuthenticationLoading,
    error: authenticationError,
  } = useSWRImmutable(
    token && shopId && productId
      ? `${API_URL}/auth/leadInstagram/${shopId}/${productId}?token=${token}`
      : null,
  );
  const {
    data: pendingOrder,
    isLoading: isPendingOrderLoading,
    error: pendingOrderError,
    mutate,
  } = useSWR<OrderNamespace.GET.Pending>(
    token && shopId && productId ? `${API_URL}/orders/pending` : null,
  );

  //NOTE: Delete pending order if this new order product is not equal to previous
  useEffect(() => {
    if (!productId) return;
    if (isPendingOrderLoading) return;

    if (!pendingOrder) {
      setIsReady(true);
      return;
    }

    const run = async () => {
      if (pendingOrder.orderProducts[0].product.id != productId) {
        await api
          .delete("/orders/pending")
          .then(async () => {
            await mutate(undefined);
          })
          .catch((e) => {
            console.log("Error in deleting previous order", e);
          })
          .finally(() => {
            setIsReady(true);
          });
      } else {
        setIsReady(true);
        return;
      }
    };

    run();
  }, [pendingOrder, isPendingOrderLoading, productId]);

  if (isAuthenticationLoading || !isReady) {
    return <LoaderSpin />;
  }

  return <CheckoutPage shopId={shopId} productId={productId} token={token} />;
}

export default function OrderPage(props: {
  params: Promise<{ shopId: string; productId: string }>;
}) {
  const { shopId, productId } = use(props.params);

  return (
    <Suspense fallback={<LoaderSpin />}>
      <OrderPageContent shopId={shopId} productId={productId} />
    </Suspense>
  );
}
