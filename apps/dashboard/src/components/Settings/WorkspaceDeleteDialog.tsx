"use client";

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

interface WorkspaceDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function WorkspaceDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: WorkspaceDeleteDialogProps) {
  const t = useTranslations("Settings.Workspace");

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open && !isDeleting) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete_dialog_title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete_dialog_description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t(isDeleting ? "deleting" : "delete_confirm")}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
            {t("cancel")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
