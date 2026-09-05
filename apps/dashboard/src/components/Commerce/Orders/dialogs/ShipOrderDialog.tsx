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

interface ShipOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Decides whether there is a parcel to track at all -- a pickup has none. Plain `string | null`
   *  because `OrderView.shippingKind` is (see `OrderBuyerCard`'s guarded-lookup comment for why). */
  shippingKind: string | null;
  /** Resolves `true` only when the write landed; on `false` this dialog KEEPS the typed url -- see
   *  `RejectPaymentDialog`'s docstring for why losing what the seller typed is the worse failure. */
  onConfirm: (trackingUrl: string | undefined) => Promise<boolean>;
}

/**
 * Confirms `processing → sending`, and collects the carrier's tracking link on the way.
 *
 * The link is optional: a seller often posts before the carrier has issued a number, and
 * `EditTrackingDialog` (a later task) is how they add one afterwards. The field is hidden
 * entirely for a تحویل حضوری (`pickup`) order -- that order is "ready to collect", not "posted",
 * and there is no parcel a link could point at.
 *
 * Validated here as well as on the backend, because the url is rendered straight into an
 * Instagram DM the buyer taps: `new URL()` alone happily parses `javascript:alert(1)` as valid,
 * so the parsed `protocol` is checked explicitly rather than inferred from a successful parse.
 */
export const ShipOrderDialog = ({
  open,
  onOpenChange,
  shippingKind,
  onConfirm,
}: ShipOrderDialogProps) => {
  const t = useTranslations('Commerce.Orders.dialogs.ship');
  const tCancelAction = useTranslations('Commerce.Orders.dialogs');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPickup = shippingKind === 'pickup';

  const reset = () => {
    setUrl('');
    setError(null);
  };

  // Wraps the raw prop: a manual cancel (outline button, Escape, backdrop click) is the seller
  // abandoning what they typed on purpose, so it clears -- unlike a failed `onConfirm`, which
  // KEEPS the url (see the prop docstring). `OrderStatusUpdater` only flips `open` back to
  // `false` on success or on this manual path, never on failure, so this is the only place that
  // needs to reset.
  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    const trimmed = url.trim();

    if (trimmed) {
      // `new URL()` alone accepts `javascript:alert(1)` as a perfectly valid URL, so the protocol
      // is checked explicitly rather than inferred from a successful parse.
      let parsed: URL | null = null;
      try {
        parsed = new URL(trimmed);
      } catch {
        parsed = null;
      }
      if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
        setError(t('invalidUrl'));
        return;
      }
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
            <label htmlFor="ship-tracking-url" className="text-secondary text-xs font-medium">
              {t('label')}
            </label>
            <Input
              id="ship-tracking-url"
              data-testid="tracking-url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (error) setError(null);
              }}
              placeholder="https://tracking.post.ir/…"
              dir="ltr"
              maxLength={500}
              aria-invalid={error ? true : undefined}
            />
            {error ? (
              <p role="alert" className="text-destructive text-xs">
                {error}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">{t('urlHint')}</p>
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
