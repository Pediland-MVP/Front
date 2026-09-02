import { describe, it, expect } from 'vitest';

import { ACTIONS_BY_STATUS, actionsFor, canMarkPaid } from './orderTransitions';
import type { OrderView } from '@/types/commerceOrders';

const order = (patch: Partial<OrderView>): OrderView =>
  ({
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

describe('markPaid is gated on paidAt, never on status', () => {
  it('is offered on an unpaid order in any non-terminal status', () => {
    expect(canMarkPaid(order({ status: 'awaiting_review', paidAt: null }))).toBe(true);
    expect(canMarkPaid(order({ status: 'processing', paidAt: null }))).toBe(true);
    expect(canMarkPaid(order({ status: 'sending', paidAt: null }))).toBe(true);
  });

  it('is withdrawn once paidAt is stamped', () => {
    expect(canMarkPaid(order({ status: 'processing', paidAt: '2026-09-02T11:00:00.000Z' }))).toBe(
      false,
    );
  });

  it('is not offered on a terminal order even when unpaid', () => {
    expect(canMarkPaid(order({ status: 'completed', paidAt: null }))).toBe(false);
    expect(canMarkPaid(order({ status: 'cancelled', paidAt: null }))).toBe(false);
  });
});

describe('actionsFor', () => {
  it('returns the status list without markPaid, which is separate', () => {
    expect(actionsFor(order({ status: 'processing' }))).toEqual(['ship', 'complete', 'cancel']);
  });
});
