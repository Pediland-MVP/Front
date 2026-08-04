'use client';

import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  instagram?: boolean;
}

export const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  instagram,
}: DeleteConfirmationDialogProps) => {
  const t = useTranslations('DeleteConfirmationDialog');

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-1">
            <WarningCircleIcon size={24} weight="duotone" />
            {instagram ? t('title_instagram') : t('title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {instagram ? t('description_instagram') : t('description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onConfirm}>{t('delete')}</AlertDialogAction>
          <AlertDialogCancel onClick={onClose}>{t('cancel')}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
