"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
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
import ProductForm from "../../../../components/Products/ProductForm";

export interface EditProductProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  productId: string;
}

export default function EditProduct({
  open,
  setOpen,
  productId,
}: EditProductProps) {
  const t = useTranslations("Products.Edit");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="text-right">
            <DrawerTitle>{t("editContact")}</DrawerTitle>
            <DrawerDescription>{t("editContactDescription")}</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <ProductForm />
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                {t("cancel")}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir="rtl" className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t("editContact")}</DialogTitle>
          <DialogDescription>{t("editContactDescription")}</DialogDescription>
        </DialogHeader>
        <ProductForm />
      </DialogContent>
    </Dialog>
  );
}
