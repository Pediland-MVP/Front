import { describe, it, expect } from 'vitest';

import {
  ACTIONS_BY_STATUS,
  actionsFor,
  canMarkPaid,
  hasAnyAction,
  targetStatusesFor,
  actionForTransition,
} from './orderTransitions';
import type { OrderView } from '@/types/commerceOrders';

const baseOrder: OrderView = {
  orderId: 'o1',
  status: 'processing',
  cancelReason: null,
  kind: 'physical',
  lines: [],
  itemsTotal: 0,
  shippingTotal: 0,
  grandTotal: 0,
  paymentMethod: 'card_to_card',
  recipientName: null,
  mobile: null,
  cityId: null,
  address: null,
  plate: null,
  unit: null,
  postalcode: null,
  placedAt: '2026-09-02T10:00:00.000Z',
  shippingTitle: null,
  shippingKind: null,
  shippingSettlement: null,
  paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z',
} as OrderView;

const order = (patch: Partial<OrderView>): OrderView =>
  ({
    ...baseOrder,
    ...patch,
  }) as OrderView;

/**
 * Transcribed from Back `apps/core/src/commerce/orders/order.state.ts` ORDER_TRANSITIONS.
 * This guards the table against accidental edits on this side. It cannot detect a change made
 * in Back -- that is what the cross-reference comments in both files are for.
 */
describe('ACTIONS_BY_STATUS mirrors Back ORDER_TRANSITIONS', () => {
  it('offers approve and reject only while awaiting review', () => {
    expect(ACTIONS_BY_STATUS.awaiting_review).toEqual(['approve', 'reject']);
  });

  it('offers ship, complete and cancel while processing', () => {
    expect(ACTIONS_BY_STATUS.processing).toEqual(['ship', 'complete', 'cancel']);
  });

  it('drops ship once sending, because ship only fires from processing', () => {
    expect(ACTIONS_BY_STATUS.sending).toEqual(['complete', 'cancel']);
  });

  it('offers nothing on the two terminal statuses', () => {
    expect(ACTIONS_BY_STATUS.completed).toEqual([]);
    expect(ACTIONS_BY_STATUS.cancelled).toEqual([]);
  });
});

describe('markPaid is gated on paidAt, and on status only for cancelled', () => {
  it('is offered on an unpaid order in any live status', () => {
    expect(canMarkPaid(order({ status: 'awaiting_review', paidAt: null }))).toBe(true);
    expect(canMarkPaid(order({ status: 'processing', paidAt: null }))).toBe(true);
    expect(canMarkPaid(order({ status: 'sending', paidAt: null }))).toBe(true);
  });

  it('is withdrawn once paidAt is stamped', () => {
    expect(canMarkPaid(order({ status: 'processing', paidAt: '2026-09-02T11:00:00.000Z' }))).toBe(
      false,
    );
    expect(canMarkPaid(order({ status: 'completed', paidAt: '2026-09-02T11:00:00.000Z' }))).toBe(
      false,
    );
  });

  /**
   * The PRIMARY use case, not an edge case. Back's `commerceOrder.entity.ts` `paidAt` docstring:
   * with cash-on-delivery the courier remits days later, "so an order is routinely COMPLETED
   * (fully delivered) and paidAt IS NULL (not yet settled) at the same time". Hiding the button
   * here left a delivered COD order with no way to ever be settled.
   */
  it('IS offered on a completed but unsettled order -- the COD settlement case', () => {
    expect(canMarkPaid(order({ status: 'completed', paidAt: null }))).toBe(true);
  });

  /**
   * `cancelled` is the one status that is excluded, because neither route into it involves money:
   * `reject` fires before payment is accepted, and `cancel` is `delivery_refused` -- the courier
   * collected nothing.
   */
  it('is not offered on a cancelled order, where no money ever changed hands', () => {
    expect(canMarkPaid(order({ status: 'cancelled', paidAt: null }))).toBe(false);
  });
});

describe('hasAnyAction', () => {
  it('is true for a completed unpaid order, whose only action is markPaid', () => {
    expect(actionsFor(order({ status: 'completed' }))).toEqual([]);
    expect(hasAnyAction(order({ status: 'completed', paidAt: null }))).toBe(true);
  });

  it('is false once a completed order is also settled -- nothing legal is left', () => {
    expect(hasAnyAction(order({ status: 'completed', paidAt: '2026-09-02T11:00:00.000Z' }))).toBe(
      false,
    );
  });

  it('is false for a cancelled order in every case', () => {
    expect(hasAnyAction(order({ status: 'cancelled', paidAt: null }))).toBe(false);
  });
});

describe('actionsFor', () => {
  it('returns the status list without markPaid, which is separate', () => {
    expect(actionsFor(order({ status: 'processing', kind: 'physical' }))).toEqual([
      'ship',
      'complete',
      'cancel',
    ]);
  });

  /**
   * `FulfilmentService.ship` throws `COMMERCE_ORDER_STATUS_CHANGED` for any digital order,
   * before its conditional UPDATE runs -- so `ship` must never appear here for `kind: 'digital'`,
   * regardless of status. Offering it would send a request the API always refuses.
   */
  it('drops ship on a digital order in processing, which the API always refuses', () => {
    expect(actionsFor(order({ status: 'processing', kind: 'digital' }))).toEqual([
      'complete',
      'cancel',
    ]);
  });

  it('keeps ship on a physical order in processing', () => {
    expect(actionsFor(order({ status: 'processing', kind: 'physical' }))).toEqual([
      'ship',
      'complete',
      'cancel',
    ]);
  });
});

describe('targetStatusesFor', () => {
  const order = (over: Partial<OrderView>): OrderView => ({ ...baseOrder, ...over });

  it('offers approve and reject targets from awaiting_review', () => {
    expect(targetStatusesFor(order({ status: 'awaiting_review' }))).toEqual([
      'processing',
      'cancelled',
    ]);
  });

  it('offers ship, complete and cancel targets from processing', () => {
    expect(targetStatusesFor(order({ status: 'processing' }))).toEqual([
      'sending',
      'completed',
      'cancelled',
    ]);
  });

  it('never offers sending for a digital order, which can never be shipped', () => {
    expect(targetStatusesFor(order({ status: 'processing', kind: 'digital' }))).toEqual([
      'completed',
      'cancelled',
    ]);
  });

  it('offers nothing on a terminal order', () => {
    expect(targetStatusesFor(order({ status: 'completed' }))).toEqual([]);
    expect(targetStatusesFor(order({ status: 'cancelled' }))).toEqual([]);
  });
});

describe('actionForTransition', () => {
  it('maps cancelled to reject from awaiting_review, but cancel from processing', () => {
    expect(actionForTransition('awaiting_review', 'cancelled')).toBe('reject');
    expect(actionForTransition('processing', 'cancelled')).toBe('cancel');
    expect(actionForTransition('sending', 'cancelled')).toBe('cancel');
  });

  it('maps the forward transitions', () => {
    expect(actionForTransition('awaiting_review', 'processing')).toBe('approve');
    expect(actionForTransition('processing', 'sending')).toBe('ship');
    expect(actionForTransition('processing', 'completed')).toBe('complete');
    expect(actionForTransition('sending', 'completed')).toBe('complete');
  });

  it('returns null for a transition the state machine does not have', () => {
    expect(actionForTransition('awaiting_review', 'completed')).toBeNull();
    expect(actionForTransition('completed', 'processing')).toBeNull();
    expect(actionForTransition('processing', 'processing')).toBeNull();
  });
});
