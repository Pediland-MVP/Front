'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import type { CommerceOrderStatus } from '@/types/commerceOrders';

/** Mirrors packages/ui's badgeVariants base classes. Badge itself is avoided because BadgeProps rejects className
 * at every call site (see src/components/Orders/OrderCard.tsx:113 for the pre-existing error). */
const BASE =
  'inline-flex items-center rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold';

/**
 * Colour carries meaning here: amber = the seller owes an action, red = dead, green = done.
 *
 * Each variant carries its own `dark:` pair. `globals.css` defines a full dark palette, and a
 * fixed `bg-amber-100 text-amber-800` is unreadable against it -- this was the only hardcoded
 * light-only surface left on the orders screen. The dark side uses a translucent tint
 * (`/15`) over whatever the card sits on rather than a second opaque colour, so the badge keeps
 * the same weight in both themes.
 */
const VARIANT: Record<CommerceOrderStatus, string> = {
  awaiting_review: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300',
  sending: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300',
};

interface OrderStatusBadgeProps {
  status: CommerceOrderStatus;
  /** Lets the card position the badge over its thumbnail without wrapping it in another element. */
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const t = useTranslations('Commerce.Orders');
  return <span className={cn(BASE, VARIANT[status], className)}>{t(`status.${status}`)}</span>;
}
