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
      <AlertDialogContent className="rtl:text-right ltr:text-left">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('alert')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="rtl:flex-row-reverse">
          <AlertDialogAction onClick={onConfirm}>حذف</AlertDialogAction>
          <AlertDialogCancel onClick={onClose}>لغو</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
