'use client';

import { FileDigitIcon, PackageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { OrderListView } from '@/types/commerceOrders';

import { ReceiptLightbox } from './ReceiptLightbox';
import { orderRowFields } from './orderRowFields';

/**
 * The two images a seller judges an order by: what was bought, and the کارت‌به‌کارت receipt.
 *
 * The receipt is the reason this exists. Reviewing a batch of `awaiting_review` orders used to
 * mean opening every one of them; here the thumbnail opens the SAME `ReceiptLightbox` the detail
 * page uses, in place, so payment can be judged without leaving the list.
 *
 * Plain `<img>`, matching `OrderCard`/`CommerceProductCard` before it: these are remote R2 urls
 * and a page renders up to `limit` (max 200) of them.
 */
export function OrderThumbs({ order }: { order: OrderListView }) {
  const t = useTranslations('Commerce.Orders');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { firstLine } = orderRowFields(order);
  const TypeIcon = order.kind === 'physical' ? PackageIcon : FileDigitIcon;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {firstLine?.imageUrl ? (
        <img
          src={firstLine.imageUrl}
          alt={firstLine.title}
          loading="lazy"
          className="size-11 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-md"
        >
          <TypeIcon className="size-5 text-gray-400" />
        </div>
      )}

      {order.receiptUrl && (
        <div className="relative shrink-0">
          <button
            type="button"
            /**
             * The whole row is a click target that navigates to the detail page. Without
             * `stopPropagation` this button would open the lightbox AND navigate away from it in
             * the same click, so the lightbox would never be seen.
             */
            onClick={(event) => {
              event.stopPropagation();
              setLightboxOpen(true);
            }}
            /**
             * The row's own `onKeyDown` (`OrdersTable`/`OrderRowCard`) calls `preventDefault()`
             * on Enter/Space as it bubbles past, which cancels a `<button>`'s native default
             * action -- the synthetic click Enter/Space would otherwise fire -- before it ever
             * happens. Without handling the key here ourselves and stopping it from bubbling,
             * Enter/Space on a focused receipt thumbnail silently navigates the row away instead
             * of opening the lightbox (F2): the button never gets its click.
             */
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                setLightboxOpen(true);
              }
            }}
            className="block"
          >
            <img
              src={order.receiptUrl}
              alt={t('receipts.thumbAlt')}
              loading="lazy"
              className="size-11 rounded-md border object-cover"
            />
          </button>
          {order.receiptCount > 1 && (
            /* A re-upload happened -- the seller rejected once and the buyer sent another.
               Shown as a count, not N thumbnails: the list has room for one. */
            <span className="bg-secondary text-secondary-foreground absolute -end-1 -top-1 rounded-full px-1.5 text-[10px] font-semibold">
              {order.receiptCount}
            </span>
          )}
        </div>
      )}

      {lightboxOpen && (
        /**
         * Radix portals `ReceiptLightbox`'s DOM node out to `document.body`, but React synthetic
         * events bubble the COMPONENT tree, not the DOM tree -- so without this wrapper, a click
         * (or a bubbled Enter/Space) on the lightbox's close button, backdrop, or image would
         * still reach the row's `onClick`/`onKeyDown` and navigate away (F1). The opening click's
         * own `stopPropagation` above only covers the click that OPENS the lightbox; every event
         * fired from INSIDE it, once open, needs stopping here instead. `ReceiptLightbox` itself
         * stays untouched -- it is shared with the detail page, which has no row to guard against.
         */
        <div
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <ReceiptLightbox
            receipt={{ id: order.orderId, url: order.receiptUrl!, createDate: order.placedAt }}
            label={t('receipts.thumbAlt')}
            onClose={() => setLightboxOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
