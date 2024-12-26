'use client'

import Image from "next/image";
import { useTranslations } from "next-intl";
import { OrderNamespace } from "@/types/order";
import { ProductDetailsSkeleton } from "./productDetails.skeleton";
import { Quantity } from "./quantity";
import { useState } from "react";

export type ProductDetailsProps = {
  product: OrderNamespace.Order['orderProducts'][0]['product'] | undefined,
  orderQuantity: number | undefined
  orderDetails: {
    shopId: string;
    orderId: string;
    secret: string
  }
}

export default function ProductDetails({ product, orderQuantity, orderDetails: { orderId, secret, shopId } }: ProductDetailsProps) {
  const t = useTranslations("Products");
  const [isExpanded, setIsExpanded] = useState(false); // حالت برای نمایش یا مخفی‌کردن متن

  if (!product || typeof orderQuantity !== 'number') return <ProductDetailsSkeleton />

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

        <div className="md:w-2/3 flex items-center h-full p-3">
          <div className="_wrapper flex flex-col gap-1">
            <h2 className="text-lg md:text-2xl font-semibold flex items-center">
              {product.title}
            </h2>
            <div>
              <p className={`text-gray-600 transition-all text-[15px] ${isExpanded ? "line-clamp-none" : "line-clamp-3"} overflow-hidden`}>
                {product.description}
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }}
                className="text-blue-500 hover:underline text-sm float-end mt-1"
              >
                {isExpanded ? "کمتر" : "بیش‌تر"}
              </button>
            </div>

            <div className="flex items-center gap-2 justify-around">
              <div className="_price-wrapper">
                <p className="flex items-center justify-end gap-2 text-gray-700">
                  <span className="text-gray-400 font-medium line-through">{product.price}</span>
                  <span className="bg-red-500 text-white flex items-center pt-1 pb-[2px] px-[5px] leading-4 rounded-md text-[13px]">23%</span>
                </p>
                <p className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-600 font-bold text-[22px]">{product.price}</span>
                  <span>تومان</span>
                </p>
              </div>
              <Quantity orderDetails={{ shopId, orderId, secret }} productQuantity={product.quantity} orderQuantity={orderQuantity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
