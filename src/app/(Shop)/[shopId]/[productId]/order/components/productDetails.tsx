"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ProductDetailsSkeleton } from "./productDetails.skeleton";
import { Quantity } from "./quantity";
import { useState, useMemo } from "react";
import { useCheckout } from "../useCheckout";
import { useFormContext } from "react-hook-form";
import type { z } from "zod";

import { AttributeSelector } from "./attributesSelector";
import type { orderFormSchema } from "@/components/Shop/CheckoutPage";

export default function ProductDetails() {
  const { product, pendingOrder, orderQuantity } = useCheckout();
  const t = useTranslations("Products");
  const [isExpanded, setIsExpanded] = useState(false);

  const { setValue, watch } = useFormContext<z.infer<typeof orderFormSchema>>();

  function calculateDiscountPercentage(
    originalPrice: number,
    priceAfterDiscount: number,
  ): string {
    const discountPercentage =
      ((originalPrice - priceAfterDiscount) / originalPrice) * 100;
    return discountPercentage.toFixed(0).toString();
  }

  const price = useMemo(() => {
    if (pendingOrder) {
      // Returns price of product or discountPrice if product have off
      return (
        typeof pendingOrder.orderProducts[0]?.discountPrice === "number"
          ? pendingOrder.orderProducts[0]?.discountPrice * orderQuantity
          : pendingOrder.orderProducts[0].price * orderQuantity
      ).toLocaleString();
    }
    if (product) {
      return typeof product?.discountPrice === "number"
        ? (product.discountPrice * orderQuantity).toLocaleString()
        : (product.price * orderQuantity).toLocaleString();
    }
    return 0;
  }, [product, orderQuantity, pendingOrder]);

  const originalPrice = useMemo(() => {
    if (
      pendingOrder &&
      typeof pendingOrder.orderProducts[0]?.discountPrice === "number"
    ) {
      return (
        pendingOrder.orderProducts[0].price * orderQuantity
      ).toLocaleString();
    }
    if (product && typeof product?.discountPrice === "number") {
      return (product.price * orderQuantity).toLocaleString();
    }
    return null;
  }, [product, orderQuantity, pendingOrder]);

  const discountPercentage = useMemo(() => {
    if (
      pendingOrder &&
      typeof pendingOrder.orderProducts[0]?.discountPrice === "number"
    ) {
      return calculateDiscountPercentage(
        pendingOrder.orderProducts[0].price,
        pendingOrder.orderProducts[0].discountPrice,
      );
    }
    if (product && typeof product?.discountPrice === "number") {
      return calculateDiscountPercentage(product.price, product.discountPrice);
    }
    return null;
  }, [product, pendingOrder]);

  // Extract attributes from product variations
  const attributes = useMemo(() => {
    if (!product?.productVariations?.length) return [];

    // Get attributes from the first product variation
    return product.productVariations[0]?.attributes || [];
  }, [product]);

  if (!product) return <ProductDetailsSkeleton />;

  return (
    <div className="_product-details flex flex-col items-center md:flex-row md:gap-5">
      <div className="_image relative aspect-square h-full w-full">
        <Image
          src={product.images?.[0].url || "/placeholder.svg"}
          sizes="(max-width: 768px) 96px, (max-width: 1024px) 192px, 256px"
          className="rounded-t-xl object-cover sm:rounded-xl sm:rounded-tr-xl"
          alt={product?.title}
          fill
        />
      </div>

      <div className="_product-info space-y-2 p-4 md:p-5">
        <div className="_description flex flex-col gap-1">
          <h2 className="_title flex items-center text-lg font-semibold md:text-2xl">
            {product?.title}
          </h2>
          <div className="_text flex flex-col gap-2">
            <p
              className={`text-sm text-gray-600 transition-all ${isExpanded ? "line-clamp-none" : "line-clamp-3"} overflow-hidden`}
            >
              {product.description}
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              className="text-muted-foreground w-full text-left text-[12px]"
            >
              {isExpanded ? "نمایش کمتر" : "(ادامه متن)"}
            </button>
          </div>
        </div>

        {attributes.length > 0 && <AttributeSelector attributes={attributes} />}

        <div className="_price-info flex items-end justify-between sm:items-center">
          <div className="_price-wrapper">
            {discountPercentage && (
              <p className="flex items-center justify-end gap-2 text-gray-700">
                <span className="text-gray-400 line-through">
                  {originalPrice}
                </span>
                <span className="flex items-center rounded-md bg-red-500 px-[5px] pt-1 pb-[2px] text-[13px] leading-4 text-white">
                  {discountPercentage}%
                </span>
              </p>
            )}
            <p className="flex items-center gap-2 leading-none text-gray-700">
              <span className="text-[22px] font-bold text-green-600">
                {price == 0 ? t("free") : price}
              </span>
              {price != 0 && <span className="font-medium">تومان</span>}
            </p>
          </div>

          <Quantity />
        </div>
      </div>
    </div>
  );
}
