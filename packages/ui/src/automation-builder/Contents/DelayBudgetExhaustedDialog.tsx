'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui';
import { useTranslations } from 'next-intl';

interface DelayBudgetExhaustedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Shown instead of letting the user open/add a delay when the automation's shared 23h
 * delay budget (see `utils/delayBudget.ts`) is already fully used by other DELAY items. */
export function DelayBudgetExhaustedDialog({
  open,
  onOpenChange,
}: DelayBudgetExhaustedDialogProps) {
  const t = useTranslations('Automations.Contents.Delay');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('budget_exhausted_title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('budget_exhausted_description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>{t('close')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
