'use client';

import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@/components/ui';

interface AutomationDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onResume: () => void;
}

export const AutomationDraftDialog = ({
  isOpen,
  onClose,
  onCreateNew,
  onResume,
}: AutomationDraftDialogProps) => {
  const t = useTranslations('Automations.DraftDialog');

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="default" onClick={onCreateNew}>
            {t('createNew')}
          </Button>
          <Button type="button" variant="ghost" onClick={onResume}>
            {t('resume')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
