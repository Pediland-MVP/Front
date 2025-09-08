"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  itemId?: string;
}

export const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  itemId,
}: DeleteConfirmationDialogProps) => {
  const t = useTranslations("DeleteConfirmationDialog");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="ltr:text-left rtl:text-right">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row items-center justify-end gap-x-1">
          <AlertDialogAction onClick={onConfirm}>
            {t("delete")}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onClose}>{t("cancel")}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
