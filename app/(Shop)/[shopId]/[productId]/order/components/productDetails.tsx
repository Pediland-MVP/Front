"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { ProductDetailsSkeleton } from "./productDetails.skeleton"
import { Quantity } from "./quantity"
import { useState, useMemo } from "react"
import { useCheckout } from "../useCheckout"
import { useFormContext } from "react-hook-form"
import type { z } from "zod"
import type { orderFormSchema } from "../checkout.page"
import { AttributeSelector } from "./attributesSelector"

export default function ProductDetails() {
  const { product, pendingOrder, orderQuantity } = useCheckout()
  const t = useTranslations("Products")
  const [isExpanded, setIsExpanded] = useState(false)

  const { setValue, watch } = useFormContext<z.infer<typeof orderFormSchema>>()

  function calculateDiscountPercentage(originalPrice: number, priceAfterDiscount: number): string {
    const discountPercentage = ((originalPrice - priceAfterDiscount) / originalPrice) * 100
    return discountPercentage.toFixed(0).toString()
  }

  const price = useMemo(() => {
    if (pendingOrder) {
      // Returns price of product or discountPrice if product have off
      return (typeof pendingOrder.orderProducts[0]?.discountPrice === "number"
        ? (pendingOrder.orderProducts[0]?.discountPrice * orderQuantity)
        : (pendingOrder.orderProducts[0].price * orderQuantity)).toLocaleString()
    }
    if (product) {
      return typeof product?.discountPrice === "number"
        ? (product.discountPrice * orderQuantity).toLocaleString()
        : (product.price * orderQuantity).toLocaleString()
    }
    return 0
  }, [product, orderQuantity, pendingOrder])

  const originalPrice = useMemo(() => {
    if (pendingOrder && typeof pendingOrder.orderProducts[0]?.discountPrice === "number") {
      return (pendingOrder.orderProducts[0].price * orderQuantity).toLocaleString()
    }
    if (product && typeof product?.discountPrice === "number") {
      return (product.price * orderQuantity).toLocaleString()
    }
    return null
  }, [product, orderQuantity, pendingOrder])

  const discountPercentage = useMemo(() => {
    if (pendingOrder && typeof pendingOrder.orderProducts[0]?.discountPrice === "number") {
      return calculateDiscountPercentage(
        pendingOrder.orderProducts[0].price,
        pendingOrder.orderProducts[0].discountPrice,
      )
    }
    if (product && typeof product?.discountPrice === "number") {
      return calculateDiscountPercentage(product.price, product.discountPrice)
    }
    return null
  }, [product, pendingOrder])

  // Extract attributes from product variations
  const attributes = useMemo(() => {
    if (!product?.productVariations?.length) return []

    // Get attributes from the first product variation
    return product.productVariations[0]?.attributes || []
  }, [product])

  if (!product) return <ProductDetailsSkeleton />

  return (
    <div className="_product-details">
      <div className="_product-info flex flex-col">
        <div className="_image relative w-full h-full aspect-square">
          <Image
            src={product.images?.[0].url || "/placeholder.svg"}
            alt={product?.title}
            fill
            className="rounded-tr-xl rounded-tl-xl object-cover"
            sizes="(max-width: 768px) 96px, (max-width: 1024px) 192px, 256px"
          />
        </div>

        <div className="_description flex flex-col gap-1 p-3">
          <h2 className="_title text-lg md:text-2xl font-semibold flex items-center">{product?.title}</h2>
          <div className="_text flex flex-col">
            <p
              className={`text-gray-600 transition-all text-[15px] ${isExpanded ? "line-clamp-none" : "line-clamp-3"} overflow-hidden`}
            >
              {product.description}
            </p>
            <button
              onClick={(e) => {
                e.preventDefault()
                setIsExpanded(!isExpanded)
              }}
              className="text-blue-500 text-[12px] w-full text-left"
            >
              {isExpanded ? "نمایش کمتر" : "(ادامه متن)"}
            </button>
          </div>

          {/* Add the AttributeSelector component */}
          {/* @ts-ignore */}
          {attributes.length > 0 && <AttributeSelector attributes={attributes} />}
        </div>
      </div>

      <div className="_price-info px-3 py-2 flex items-center justify-between">
        <div className="_price-wrapper">
          {discountPercentage && (
            <p className="flex items-center justify-end gap-2 text-gray-700">
              <span className="text-gray-400 line-through">{originalPrice}</span>
              <span className="bg-red-500 text-white flex items-center pt-1 pb-[2px] px-[5px] leading-4 rounded-md text-[13px]">
                {discountPercentage}%
              </span>
            </p>
          )}
          <p className="flex items-center gap-2 text-gray-700 leading-none">
            <span className="text-green-600 font-bold text-[22px]">{price == 0 ? t("free") : price}</span>
            {price != 0 && <span className="font-medium">تومان</span>}
          </p>
        </div>

        <Quantity />
      </div>
    </div>
  )
}

