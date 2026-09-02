import type { CommerceOrderStatus, OrderView } from '@/types/commerceOrders';

export type OrderActionName = 'approve' | 'reject' | 'ship' | 'complete' | 'cancel';

/**
 * MIRRORS Back `apps/core/src/commerce/orders/order.state.ts` -> ORDER_TRANSITIONS.
 * Any change there MUST change here. `orderTransitions.test.ts` guards this side.
 *
 *   approve   awaiting_review          -> processing
 *   reject    awaiting_review          -> cancelled
 *   ship      processing               -> sending
 *   complete  processing | sending     -> completed
 *   cancel    processing | sending     -> cancelled
 *
 * Offering an action the API will refuse is the failure this table exists to prevent.
 */
export const ACTIONS_BY_STATUS: Record<CommerceOrderStatus, readonly OrderActionName[]> = {
  awaiting_review: ['approve', 'reject'],
  processing: ['ship', 'complete', 'cancel'],
  sending: ['complete', 'cancel'],
  completed: [],
  cancelled: [],
};

/**
 * `ACTIONS_BY_STATUS` stays a faithful, status-only mirror of Back's `ORDER_TRANSITIONS` -- the
 * `kind` rule below is layered on top here rather than folded into the table.
 *
 * Back's `FulfilmentService.ship` throws `COMMERCE_ORDER_STATUS_CHANGED` for `kind === 'digital'`
 * BEFORE its conditional UPDATE -- a digital order can never be shipped, full stop. A digital
 * order reaches `processing` normally (via `approve` or `submitFree`), so without this guard the
 * button would render, the click would report "the status changed" (false), and this page's own
 * status-changed handler would revalidate, find nothing changed, and redraw the same button --
 * an unbreakable retry loop.
 */
export function actionsFor(order: OrderView): readonly OrderActionName[] {
  const actions = ACTIONS_BY_STATUS[order.status] ?? [];
  if (order.kind === 'digital') return actions.filter((action) => action !== 'ship');
  return actions;
}

/**
 * `markPaid` sits OUTSIDE the table on purpose. Back's `FulfilmentService.markPaid` has no status
 * guard at all -- its only condition is `paidAt IS NULL`, and it is deliberately idempotent (a
 * second call is a seller double-tapping, not a conflict). Gating it on status would hide it
 * where it is legal.
 *
 * `completed` MUST stay eligible -- it is the PRIMARY state this button exists for. Quoting the
 * `paidAt` column docstring on Back's `packages/entities/src/commerce/commerceOrder.entity.ts`:
 * with cash-on-delivery the courier collects payment on handoff and remits it to the seller "days
 * later, often batched with other orders -- so an order is routinely COMPLETED (fully delivered)
 * and paidAt IS NULL (not yet settled) at the same time", and `FulfilmentService.markPaid` is
 * "the only writer of this column for COD orders". Excluding `completed` left the seller with no
 * path to settle a delivered COD order, ever. Do not "simplify" it back in.
 *
 * `cancelled` stays excluded because neither route into it involves money: `reject` fires before
 * any payment is accepted, and `cancel` is `delivery_refused` -- the courier handed nothing over
 * and collected nothing. There is no settlement to record.
 */
export function canMarkPaid(order: OrderView): boolean {
  return order.paidAt === null && order.status !== 'cancelled';
}

/**
 * True when `OrderActions` would render at least one button for this order, permission aside.
 * `OrderDetailPage` needs this to decide whether the detail body gets an action bar at all -- an
 * `<OrderActions/>` element is truthy even when it renders `null`, so a caller cannot tell by
 * looking at the node.
 */
export function hasAnyAction(order: OrderView): boolean {
  return actionsFor(order).length > 0 || canMarkPaid(order);
}
