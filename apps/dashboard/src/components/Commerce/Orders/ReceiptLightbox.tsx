'use client';

import { useTranslations } from 'next-intl';

import type { OrderReceiptView } from '@/types/commerceOrders';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

/**
 * `label` is the attempt label `ReceiptStrip` already computes ("رسید ۲"), passed down rather than
 * recomputed. It names WHICH receipt is open -- the generic `receipts.title` alone left a screen
 * reader announcing every attempt identically.
 *
 * The title and description are visually hidden, not absent: Radix's `DialogContent` points
 * `aria-labelledby`/`aria-describedby` at them, so without a real `DialogTitle` the dialog is
 * announced unlabeled AND Radix logs an error to the console on every open. All three sibling
 * dialogs in `dialogs/` render both, which is why only this one warned.
 */
export function ReceiptLightbox({
  receipt,
  label,
  onClose,
}: {
  receipt: OrderReceiptView;
  label: string;
  onClose: () => void;
}) {
  const t = useTranslations('Commerce.Orders');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">{t('receipts.title')}</DialogDescription>
        {/*
         * `min-h-0` is load-bearing on the flex child: without it the image's natural height
         * (a portrait receipt screenshot easily runs taller than the viewport) refuses to
         * shrink below its content size, pushes `DialogContent` past `max-h-[90vh]`, and the
         * bottom of the receipt -- and the close button below it -- end up off-screen with no
         * way to scroll to them. This scrolls internally instead, so the dialog itself always
         * fits.
         */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <img src={receipt.url} alt={label} className="w-full" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 rounded-md bg-white p-2 hover:bg-gray-100"
          type="button"
          aria-label={t('receipts.close')}
        >
          {t('receipts.close')}
        </button>
      </DialogContent>
    </Dialog>
  );
}
