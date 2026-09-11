'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { toJalaliDateTime } from '@/utils/jalali';
import type { OrderReceiptView } from '@/types/commerceOrders';

import { ReceiptLightbox } from './ReceiptLightbox';

/**
 * Every receipt, newest first, each captioned with its upload time. Receipts are append-only in
 * the backend: a reject followed by a re-upload leaves several on one order, and a seller
 * reviewing attempt #2 needs to see what they rejected the first time. The timestamp is the whole
 * point of showing all of them (spec §8 / decision D3) -- without it two similar-looking receipts
 * are indistinguishable, and the seller cannot tell which one arrived after the rejection.
 *
 * `[...receipts]` because `.sort` mutates in place and this array belongs to SWR's cache.
 */
export function ReceiptStrip({ receipts }: { receipts: OrderReceiptView[] }) {
  const t = useTranslations('Commerce.Orders');
  const [open, setOpen] = useState<{ receipt: OrderReceiptView; label: string } | null>(null);

  if (!receipts.length) {
    return <p className="text-muted-foreground text-sm">{t('receipts.none')}</p>;
  }

  const newestFirst = [...receipts].sort(
    (a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime(),
  );

  return (
    <>
      <div className="flex gap-2 overflow-x-auto">
        {newestFirst.map((receipt, index) => {
          // Computed once and shared: it is the thumbnail's alt text, the lightbox's accessible
          // title, and the fullscreen image's alt -- all naming the same attempt.
          const label = t('receipts.attempt', { n: newestFirst.length - index });
          return (
            <button
              key={receipt.id}
              type="button"
              onClick={() => setOpen({ receipt, label })}
              className="flex shrink-0 flex-col gap-1"
            >
              <img src={receipt.url} alt={label} className="h-24 w-24 rounded object-cover" />
              <span className="text-muted-foreground text-[10px]">
                {toJalaliDateTime(receipt.createDate)}
              </span>
            </button>
          );
        })}
      </div>
      {open && (
        <ReceiptLightbox receipt={open.receipt} label={open.label} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
