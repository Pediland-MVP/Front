"use client";

import { useTranslations } from "next-intl";
import { Button } from "@befroosh/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@befroosh/ui";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

interface ContentPromotionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}
export const ContentPromotionDialog = ({
  isOpen,
  setIsOpen,
}: ContentPromotionDialogProps) => {
  const t = useTranslations("Automations.ContentPromotionDialog");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger id={ContentPromotionDialog.name} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => setIsOpen(false)}
            variant="outline"
          >
            {t("buttons.close")}
          </Button>

          <Link
            href="/settings/upgrade?active=planSelection"
            className="w-full"
          >
            <Button className="w-full" variant="default">
              {t("buttons.upgrade")}
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
