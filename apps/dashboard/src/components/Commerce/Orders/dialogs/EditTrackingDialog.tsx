'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/components/ui';
import { isValidTrackingUrl } from './trackingUrl.util';

interface EditTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The link currently on the order, pre-filled so a seller corrects a typo rather than
   *  retyping. `null` when the order shipped with no link at all -- same dialog, empty field. */
  current: string | null;
  /** Resolves `true` only when the write landed. On `false` the dialog stays open and keeps the
   *  typed url, same reasoning as `ShipOrderDialog`'s `onConfirm` -- see its docstring. */
  onConfirm: (trackingUrl: string, notify: boolean) => Promise<boolean>;
}

/**
 * Corrects the carrier tracking link on an order that has already shipped. Back allows this while
 * status is `sending` OR `completed` -- a seller may need to fix a link even after delivery.
 *
 * `notify` defaults to OFF. Most edits are a seller fixing their own typo seconds after `ship`,
 * and a DM for every keystroke-level correction is noise. It is worth ticking in the two cases
 * that matter: the buyer already received a broken link, or the order shipped with none at all.
 * Reseeded to OFF every time the dialog opens (see the effect below) -- it must never remember a
 * previous tick.
 *
 * Validated the same way `ShipOrderDialog` validates its field, via the shared
 * `isValidTrackingUrl` (`trackingUrl.util.ts`) -- the two dialogs must stay identical. Unlike
 * `ship`'s field, this one is required -- there is no "no link yet" fallback once a seller has
 * opened this dialog to add or fix one, so a blank/whitespace-only value is rejected the same way
 * an invalid one is.
 */
export const EditTrackingDialog = ({
  open,
  onOpenChange,
  current,
  onConfirm,
}: EditTrackingDialogProps) => {
  const t = useTranslations('Commerce.Orders.dialogs.tracking');
  const tDialogs = useTranslations('Commerce.Orders.dialogs');
  const [url, setUrl] = useState(current ?? '');
  const [notify, setNotify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The order can change under the page (another seat, the buyer's DM), and this dialog can be
  // reopened after a previous edit. Re-seed the url to whatever is on the order NOW, and always
  // reseed `notify`/`error` -- see the docstring on why `notify` must never remember a prior tick.
  useEffect(() => {
    if (open) {
      setUrl(current ?? '');
      setNotify(false);
      setError(null);
    }
  }, [open, current]);

  const handleConfirm = async () => {
    const trimmed = url.trim();

    // An empty `trimmed` fails `isValidTrackingUrl` too (its `new URL()` throws on ''), and hits
    // the same branch -- there is nothing to save.
    if (!isValidTrackingUrl(trimmed)) {
      setError(t('invalidUrl'));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      // Only close on success -- see `onConfirm`'s docstring.
      if (await onConfirm(trimmed, notify)) onOpenChange(false);
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

        <div className="flex flex-col gap-1.5">
          <Input
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
          {error && (
            <p role="alert" className="text-destructive text-xs">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="tracking-notify"
              data-testid="tracking-notify"
              checked={notify}
              onCheckedChange={(next) => setNotify(next === true)}
            />
            <Label htmlFor="tracking-notify" className="text-xs font-normal">
              {t('notifyLabel')}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            data-testid="tracking-confirm"
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
            {tDialogs('cancelAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
