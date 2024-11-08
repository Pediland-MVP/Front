"use client";

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
import ContactForm from "./contactForm";

export interface EditContactProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  contactId: string;
}

export default function EditContact({
  open,
  setOpen,
  contactId,
}: EditContactProps) {
  const [isMobile, setIsMobile] = useState(false);

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

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
            <DrawerTitle>ویرایش مخاطب</DrawerTitle>
            <DrawerDescription>
              از اینجا میتونی مخاطب رو ویرایش کنی
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            {
              <ContactForm
                contactId={contactId}
                open={open}
                setOpen={setOpen}
              />
            }
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                انصراف
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
          <DialogTitle>ویرایش اطلاعات</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        {<ContactForm contactId={contactId} open={open} setOpen={setOpen} />}
      </DialogContent>
    </Dialog>
  );
}
