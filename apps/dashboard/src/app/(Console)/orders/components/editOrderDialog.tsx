"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useTranslations } from "next-intl"
import OrderDetails from "./orderDetails"
import type { OrderNamespace } from "@/types/order/order.namespace"
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin"

export interface EditOrderProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  order?: OrderNamespace.GET.OneItemOfOrders
}

export default function EditOrderDialog({ open, setOpen, order }: EditOrderProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const t = useTranslations("Orders.EditDialog")

  if (!open) {
    return null
  }

  if (open && !order) {
    return <LoaderSpin/>
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="fixed inset-0 h-full max-h-[100dvh] flex flex-col">
          <DrawerHeader className="text-right flex-shrink-0">
            <DrawerTitle>{t("editOrder")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-grow overflow-y-auto p-4 pb-0">
            <OrderDetails setOpen={setOpen} order={order!} />
          </div>
          <DrawerFooter className="pt-2 flex-shrink-0">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                {t("cancel")}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-svh lg:min-w-[80vw]">
        <DialogHeader>
          <DialogTitle>{t("editOrder")}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <OrderDetails  setOpen={setOpen} order={order!} />
      </DialogContent>
    </Dialog>
  )
}

