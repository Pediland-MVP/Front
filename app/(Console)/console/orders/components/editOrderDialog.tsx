"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslations } from "next-intl";
import OrderDetails from "./orderDetails";
import { OrderNamespace } from "@/types/order/order.namespace";

export interface EditOrderProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  order: OrderNamespace.GET.Orders['items'][0]
}

export default function EditOrderDialog({
  open,
  setOpen,
  order
}: EditOrderProps) {
  const [isMobile, setIsMobile] = useState(false);

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const t = useTranslations('Orders.EditDialog')

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="text-right">
            <DrawerTitle>{t('editOrder')}</DrawerTitle>
            <DrawerDescription>
              {t('editOrderDescription')}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <OrderDetails setOpen={setOpen} order={order}  />
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                {t('cancel')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t('editInformation')}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <OrderDetails setOpen={setOpen} order={order}  />

      </DialogContent>
    </Dialog>
  );
}
