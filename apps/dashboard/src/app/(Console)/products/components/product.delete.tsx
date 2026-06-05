'use client'
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
import { useTranslations } from "next-intl";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemId: string;
}

export function ProductDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  itemId,
}: DeleteConfirmationDialogProps) {

  const t = useTranslations('Products.Delete')

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteConfirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onConfirm}
          >
            {t("delete")}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onClose}>{t("cancel")}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
