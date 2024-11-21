"use client"

import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemId: string
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemId
}: DeleteConfirmationDialogProps) {
  const t = useTranslations('Automations.DeleteConfirmationDialog')

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rtl:text-right ltr:text-left">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="rtl:flex-row-reverse">
          <AlertDialogAction onClick={onConfirm}>{t('delete')}</AlertDialogAction>
          <AlertDialogCancel onClick={onClose}>{t('cancel')}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

