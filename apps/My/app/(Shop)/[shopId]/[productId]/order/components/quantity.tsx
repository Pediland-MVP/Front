'use client'

import { useState } from "react"
import { Minus, Plus, Spinner } from "@phosphor-icons/react/dist/ssr"
import { useCheckout } from "../useCheckout"
import { useCanQuantityUp } from "../hooks/useCanQuantityUp"
import useQuantityUpDown from "../hooks/useQuantityUpDown"
import { Button } from "@befroosh/ui"
import { Label } from "@befroosh/ui"
import { useTranslations } from "next-intl"
import { ORDER_STATUS } from "@/types/order/order.namespace"

export function Quantity() {
  const t = useTranslations('Checkout')
  const { orderQuantity, setOrderQuantity, pendingOrder, outOfStock, setOutOfStock, product } = useCheckout()
  const [isPending, setIsPending] = useState(false)
  const { canQuantityUp } = useCanQuantityUp()
  const { updateQuantity, loading: updateQuantityLoading } = useQuantityUpDown()

  const handleAdjustment = async (adjustment: "increment" | "decrement") => {
    if (!pendingOrder || pendingOrder?.orderProducts?.length === 0) {
      if (adjustment === 'increment') {
        canQuantityUp(setIsPending)
        return
      }
  
      if (adjustment === 'decrement') {
        if (orderQuantity === 1) {
          return
        }
        setOutOfStock(false)
        setOrderQuantity(old => old - 1)
      }
      return
    }

    updateQuantity(adjustment)
  }

  const isDecrementDisabled = isPending || orderQuantity <= 1 || updateQuantityLoading
  const isIncrementDisabled = isPending || outOfStock || updateQuantityLoading

  if (product?.quantity === 0 && !product.isInfinite && pendingOrder?.status !== ORDER_STATUS.PAYMENT) {
    return (
      <p className="font-bold text-lg text-red-500">موجودی تموم شد :(</p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
        تعداد
      </Label>
      <div className="flex items-center justify-start gap-x-2">
        <Button
          onClick={() => handleAdjustment("decrement")}
          disabled={isDecrementDisabled}
          size="icon"
          variant={isDecrementDisabled ? "ghost" : "outline"}
          className="h-8 w-8"
          type="button"
        >
          {isPending ? (
            <Spinner size={16} className="animate-spin" />
          ) : (
            <Minus size={16} className={isDecrementDisabled ? "text-gray-400" : "text-gray-600"} />
          )}
        </Button>

        <div 
          id="quantity"
          className="flex items-center justify-center h-8 w-12 text-lg font-medium text-gray-900 bg-gray-100 rounded select-none"
          aria-live="polite"
        >
          {orderQuantity}
        </div>

        <Button
          onClick={() => handleAdjustment("increment")}
          disabled={isIncrementDisabled}
          size="icon"
          variant={isIncrementDisabled ? "ghost" : "outline"}
          className="h-8 w-8"
          type="button"
        >
          {isPending ? (
            <Spinner size={16} className="animate-spin" />
          ) : (
            <Plus size={16} className={isIncrementDisabled ? "text-gray-400" : "text-gray-600"} />
          )}
        </Button>
      </div>
      {outOfStock && (
        <p className="text-sm text-red-500 mt-1">{t('outOfStock')}</p>
      )}
    </div>
  )
}

