'use client';

import { useTranslations } from 'next-intl';

import type { OrderReceiptView } from '@/types/commerceOrders';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function ReceiptLightbox({
  receipt,
  onClose,
}: {
  receipt: OrderReceiptView;
  onClose: () => void;
}) {
  const t = useTranslations('Commerce.Orders');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <img src={receipt.url} alt={t('receipts.title')} className="w-full" />
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
