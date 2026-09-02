'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { OrderReceiptView } from '@/types/commerceOrders';

import { ReceiptLightbox } from './ReceiptLightbox';

/**
 * Every receipt, newest first. Receipts are append-only in the backend: a reject followed by a
 * re-upload leaves several on one order, and a seller reviewing attempt #2 needs to see what they
 * rejected the first time. `[...receipts]` because `.sort` mutates in place and this array belongs
 * to SWR's cache.
 */
export function ReceiptStrip({ receipts }: { receipts: OrderReceiptView[] }) {
  const t = useTranslations('Commerce.Orders');
  const [open, setOpen] = useState<OrderReceiptView | null>(null);

  if (!receipts.length) {
    return <p className="text-muted-foreground text-sm">{t('receipts.none')}</p>;
  }

  const newestFirst = [...receipts].sort(
    (a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime(),
  );

  return (
    <>
      <div className="flex gap-2 overflow-x-auto">
        {newestFirst.map((receipt, index) => (
          <button
            key={receipt.id}
            type="button"
            onClick={() => setOpen(receipt)}
            className="shrink-0"
          >
            <img
              src={receipt.url}
              alt={t('receipts.attempt', { n: newestFirst.length - index })}
              className="h-24 w-24 rounded object-cover"
            />
          </button>
        ))}
      </div>
      {open && <ReceiptLightbox receipt={open} onClose={() => setOpen(null)} />}
    </>
  );
}
