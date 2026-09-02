'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

/**
 * A confirmation, not a reason picker. The backend's CancelOrderDto accepts exactly one value
 * (`delivery_refused`), so there is no dropdown/radio/select here — a control offering one
 * option would misrepresent the domain. `useCommerceOrder.cancel()` already hardcodes the
 * reason, so `onConfirm` takes no argument.
 */
export const CancelOrderDialog = ({ open, onOpenChange, onConfirm }: CancelOrderDialogProps) => {
  const t = useTranslations('Commerce.Orders.dialogs.cancel');
  const tCancelAction = useTranslations('Commerce.Orders.dialogs');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {t('confirm')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            {tCancelAction('cancelAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
