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
  Textarea,
} from '@/components/ui';

interface RejectPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
}

const REASON_MAX_LENGTH = 500;

/**
 * The four presets FILL the textarea for the seller to edit — they never submit on their own.
 * Rejecting is terminal (it cancels the order, no path back), and the reason is sent to the
 * buyer verbatim as an Instagram DM, not kept as an internal note. Both facts are said plainly
 * in the copy so a seller does not type something they would not want the customer to read.
 */
export const RejectPaymentDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: RejectPaymentDialogProps) => {
  const t = useTranslations('Commerce.Orders.dialogs.reject');
  const tCancel = useTranslations('Commerce.Orders.dialogs');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presets = [
    t('presetUnreadable'),
    t('presetAmount'),
    t('presetNotFound'),
    t('presetWrongCard'),
  ];

  const reset = () => {
    setReason('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    // Trim before validating and sending, deliberately STRICTER than the backend's
    // `RejectPaymentDto` (@MinLength(1)). This text goes to the buyer verbatim as an Instagram
    // DM, and Meta's send API rejects whitespace-only message text (error 100 / subcode
    // 2534052, "Empty text") — a space-only reason would silently fail to deliver while the
    // order is already cancelled and terminal, so the buyer would never learn why. Do not
    // "simplify" this back to `reason.length === 0` to match the DTO.
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      setError(t('empty'));
      return;
    }
    if (trimmed.length > REASON_MAX_LENGTH) {
      setError(t('tooLong'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(trimmed);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('buyerSees')}</DialogDescription>
        </DialogHeader>

        <p className="text-destructive text-xs">{t('terminal')}</p>

        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setReason(preset)}
              className="border-ln hover:bg-tint rounded-full border px-2.5 py-1 text-xs"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reject-reason" className="text-secondary text-xs font-medium">
            {t('label')}
          </label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(null);
            }}
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

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
            onClick={() => handleOpenChange(false)}
          >
            {tCancel('cancelAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
