"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { IPendingOrder } from "@/types/order/pendingOrder"
import { ProductItem } from "@/types/product"

interface OrderConfirmationDrawerProps {
  pendingOrder: IPendingOrder
  product: ProductItem
  onCancelOrder: () => void
  onCreateNewOrder: () => void
}

export function OrderConfirmationDrawer({
  pendingOrder,
  product,
  onCancelOrder,
  onCreateNewOrder,
}: OrderConfirmationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const checkOrderMismatch = () => {
    if (pendingOrder.orderProducts[0].id !== product.id) {
      setIsOpen(true)
    }
  }

  const handleCancelOrder = () => {
    onCancelOrder()
    setIsOpen(false)
  }

  const handleCreateNewOrder = () => {
    onCreateNewOrder()
    setIsOpen(false)
  }

  const renderOrderProductInfo = () => {
    const orderProduct = pendingOrder.orderProducts[0]
    return (
      <div className="flex items-center justify-center gap-x-7 space-x-4 w-full">
        <img
          src={product.images[0]?.url || "/placeholder.svg"}
          alt={product.title}
          className="w-24 h-24 object-cover rounded"
        />
        <div>
          <p className="font-medium text-xl">{orderProduct.product.title}</p>
          <p className="text-sm text-gray-500">تعداد: {orderProduct.quantity}</p>
        </div>
      </div>
    )
  }

  React.useEffect(() => {
    checkOrderMismatch()
  }, [pendingOrder, product])

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent className="h-1/2">
        <DrawerHeader className="mt-4">
          <DrawerTitle>یه سفارش ناتموم داری!</DrawerTitle>
          <DrawerDescription>
           میخوای سفارش قبلیت رو ادامه بدی یا کنسلش کنی و بری سراغ سفارش جدید؟
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 flex justify-center items-center">{renderOrderProductInfo()}</div>
        <DrawerFooter className="p-4 flex flex-row justify-center items-center mb-16">
          <Button variant={'ghost'} onClick={handleCancelOrder}>
            ادامه سفارش قبلی
          </Button>
          <Button onClick={handleCreateNewOrder}>بیخیال</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

