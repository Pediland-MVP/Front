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
  Input,
} from '@/components/ui';
import { isValidFollowUpCode, normalizeFollowUpCodeInput } from './followUpCode.util';

interface ShipOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Decides whether there is a parcel to track at all -- a pickup has none. Plain `string | null`
   *  because `OrderView.shippingKind` is (see `OrderBuyerCard`'s guarded-lookup comment for why). */
  shippingKind: string | null;
  /** Resolves `true` only when the write landed; on `false` this dialog KEEPS the typed code -- see
   *  `RejectPaymentDialog`'s docstring for why losing what the seller typed is the worse failure. */
  onConfirm: (followUpCode: string | undefined) => Promise<boolean>;
}

/**
 * Confirms `processing → sending`, and collects the post office's/courier's own tracking CODE on
 * the way.
 *
 * The code is optional: a seller often posts before the carrier has issued one, and
 * `EditTrackingDialog` (a later task) is how they add it afterwards. The field is hidden
 * entirely for a تحویل حضوری (`pickup`) order -- that order is "ready to collect", not "posted",
 * and there is no parcel a code could belong to.
 *
 * Validated here as well as on the backend, because the code is rendered straight into its own
 * Instagram DM the buyer copies -- see `isValidFollowUpCode` (`followUpCode.util.ts`, shared with
 * `EditTrackingDialog`) for what "valid" means here. `onChange` runs `normalizeFollowUpCodeInput`
 * first (CLAUDE.md §18): the code is often mostly numeric, so a Persian-digit keyboard must not
 * silently produce something the backend rejects.
 */
export const ShipOrderDialog = ({
  open,
  onOpenChange,
  shippingKind,
  onConfirm,
}: ShipOrderDialogProps) => {
  const t = useTranslations('Commerce.Orders.dialogs.ship');
  const tCancelAction = useTranslations('Commerce.Orders.dialogs');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPickup = shippingKind === 'pickup';

  const reset = () => {
    setCode('');
    setError(null);
  };

  // Wraps the raw prop: a manual cancel (outline button, Escape, backdrop click) is the seller
  // abandoning what they typed on purpose, so it clears -- unlike a failed `onConfirm`, which
  // KEEPS the code (see the prop docstring). `OrderStatusUpdater` only flips `open` back to
  // `false` on success or on this manual path, never on failure, so this is the only place that
  // needs to reset.
  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    const trimmed = code.trim();

    if (trimmed && !isValidFollowUpCode(trimmed)) {
      setError(t('invalidCode'));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      // Only clear on success -- see `onConfirm`'s docstring.
      if (await onConfirm(trimmed || undefined)) reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPickup ? t('titlePickup') : t('titlePosted')}</DialogTitle>
          <DialogDescription>
            {isPickup ? t('descriptionPickup') : t('descriptionPosted')}
          </DialogDescription>
        </DialogHeader>

        {!isPickup && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ship-tracking-code" className="text-secondary text-xs font-medium">
              {t('label')}
            </label>
            <Input
              id="ship-tracking-code"
              data-testid="tracking-code"
              value={code}
              onChange={(event) => {
                setCode(normalizeFollowUpCodeInput(event.target.value));
                if (error) setError(null);
              }}
              placeholder="RA123456785IR"
              dir="ltr"
              maxLength={50}
              aria-invalid={error ? true : undefined}
            />
            {error ? (
              <p role="alert" className="text-destructive text-xs">
                {error}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">{t('codeHint')}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            disabled={isSubmitting}
            data-testid="ship-confirm"
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
            {tCancelAction('cancelAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
