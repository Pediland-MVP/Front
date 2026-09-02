'use client';

import { useTranslations } from 'next-intl';

import type { CommerceOrderStatus } from '@/types/commerceOrders';

/** Mirrors packages/ui's badgeVariants base classes. Badge itself is avoided because BadgeProps rejects className
 * at every call site (see src/components/Orders/OrderCard.tsx:113 for the pre-existing error). */
const BASE =
  'inline-flex items-center rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold';

/** Colour carries meaning here: amber = the seller owes an action, red = dead, green = done. */
const VARIANT: Record<CommerceOrderStatus, string> = {
  awaiting_review: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  sending: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function OrderStatusBadge({ status }: { status: CommerceOrderStatus }) {
  const t = useTranslations('Commerce.Orders');
  return <span className={`${BASE} ${VARIANT[status]}`}>{t(`status.${status}`)}</span>;
}
