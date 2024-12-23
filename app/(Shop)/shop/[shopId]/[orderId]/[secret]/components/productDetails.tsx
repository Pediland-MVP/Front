'use client'

import Image from "next/image";
import { useTranslations } from "next-intl";
import { OrderNamespace } from "@/types/order";
import { ProductDetailsSkeleton } from "./productDetails.skeleton";
import { Quantity } from "./quantity";


export type ProductDetailsProps = {
  product: OrderNamespace.Order['orderProducts'][0]['product'] | undefined,
  orderQuantity: number | undefined
  orderDetails: {
    shopId: string;
    orderId: string;
    secret: string
  }
}

export default function ProductDetails({ product, orderQuantity, orderDetails: {orderId, secret, shopId} }: ProductDetailsProps) {
  const t = useTranslations("Products");

  if (!product || typeof orderQuantity !== 'number') return <ProductDetailsSkeleton/>

  return (
    <div className="_product-details md:col-span-4">
      <div className="flex flex-col gap-4 md:flex-row items-start md:gap-6">
        <div className="relative w-full md:w-1/3 h-full aspect-square">
          <Image
            src={product.images?.[0].url}
            alt={product.title}
            fill
            className="rounded-xl object-cover"
            sizes="(max-width: 768px) 96px, (max-width: 1024px) 192px, 256px"
          />
        </div>

        <div className="md:w-2/3 flex items-center h-full">
          <div className="_wrapper flex flex-col gap-5">
            <h2 className="text-xl md:text-2xl font-semibold flex items-center">
              {product.title}
            </h2>
            <div className="text-gray-600">{product.description}</div>
            <Quantity orderDetails={{shopId, orderId, secret}} productQuantity={product.quantity}  orderQuantity={orderQuantity} />
          </div>
        </div>
      </div>
    </div>
  );
}
