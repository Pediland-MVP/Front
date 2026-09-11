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
  it('offers every other status from awaiting review', () => {
    expect(ACTIONS_BY_STATUS.awaiting_review).toEqual(['approve', 'ship', 'complete', 'reject']);
  });

  it('offers every other status while processing, backwards included', () => {
    expect(ACTIONS_BY_STATUS.processing).toEqual(['ship', 'complete', 'cancel', 'revert']);
  });

  it('keeps a way back to processing once sending — ship no longer has to come first', () => {
    expect(ACTIONS_BY_STATUS.sending).toEqual(['approve', 'complete', 'cancel', 'revert']);
  });

  /**
   * `completed` and `cancelled` used to be dead ends. They are not any more: a seller who marked
   * an order completed by mistake, or cancelled one that turned out to be fine, has to be able to
   * put it back. Back restocks or re-takes stock accordingly (`holdsStock`).
   */
  it('has no terminal status left — completed and cancelled both move', () => {
    expect(ACTIONS_BY_STATUS.completed).toEqual(['approve', 'ship', 'cancel', 'revert']);
    expect(ACTIONS_BY_STATUS.cancelled).toEqual(['approve', 'ship', 'complete', 'revert']);
  });

  /**
   * The product rule in one assertion: from any status, every other status is offered. This is
   * what the seller asked for, and it is the property most likely to be broken by a well-meant
   * edit to one row of the table above.
   */
  it('reaches every other status from every status', () => {
    const ALL = ['awaiting_review', 'processing', 'sending', 'completed', 'cancelled'] as const;
    for (const from of ALL) {
      expect([...targetStatusesFor(order({ status: from }))].sort()).toEqual(
        ALL.filter((s) => s !== from).sort(),
      );
    }
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
  it('is true for a completed unpaid order — status moves AND markPaid', () => {
    expect(actionsFor(order({ status: 'completed' })).length).toBeGreaterThan(0);
    expect(hasAnyAction(order({ status: 'completed', paidAt: null }))).toBe(true);
  });

  /**
   * Used to be false: a settled completed order had nothing left to do. Now every status can be
   * corrected, so the action bar is always worth rendering. `OrderDetailPage` uses this to decide
   * whether the summary rail gets a status slot at all.
   */
  it('is true for a settled completed order, because the status can still be corrected', () => {
    expect(hasAnyAction(order({ status: 'completed', paidAt: '2026-09-02T11:00:00.000Z' }))).toBe(
      true,
    );
  });

  it('is true for a cancelled order, which can now be reopened', () => {
    expect(hasAnyAction(order({ status: 'cancelled', paidAt: null }))).toBe(true);
  });
});

describe('actionsFor', () => {
  it('returns the status list without markPaid, which is separate', () => {
    expect(actionsFor(order({ status: 'processing', kind: 'physical' }))).toEqual([
      'ship',
      'complete',
      'cancel',
      'revert',
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
      'revert',
    ]);
  });

  it('keeps ship on a physical order in processing', () => {
    expect(actionsFor(order({ status: 'processing', kind: 'physical' }))).toEqual([
      'ship',
      'complete',
      'cancel',
      'revert',
    ]);
  });

  /**
   * The one rule the widening did NOT relax, and the seller named it explicitly: a digital order
   * can reach every status EXCEPT «ارسال شده». Checked from all four sources, because `ship` is now
   * offered from all four and the filter has to survive each.
   */
  it('never offers ship for a digital order, from any status', () => {
    for (const status of ['awaiting_review', 'processing', 'completed', 'cancelled'] as const) {
      expect(actionsFor(order({ status, kind: 'digital' }))).not.toContain('ship');
    }
  });
});

describe('targetStatusesFor', () => {
  const order = (over: Partial<OrderView>): OrderView => ({ ...baseOrder, ...over });

  /**
   * Listed in lifecycle order, NOT in the order the actions happen to sit in `ACTIONS_BY_STATUS`.
   * Sellers scan this select by position, so the same status must appear in the same place
   * whichever order they opened.
   */
  it('lists targets in lifecycle order, whatever order the actions are in', () => {
    expect(targetStatusesFor(order({ status: 'awaiting_review' }))).toEqual([
      'processing',
      'sending',
      'completed',
      'cancelled',
    ]);
    expect(targetStatusesFor(order({ status: 'sending' }))).toEqual([
      'awaiting_review',
      'processing',
      'completed',
      'cancelled',
    ]);
  });

  it('offers every forward and backward target from processing', () => {
    expect(targetStatusesFor(order({ status: 'processing' }))).toEqual([
      'awaiting_review',
      'sending',
      'completed',
      'cancelled',
    ]);
  });

  it('never offers sending for a digital order, which can never be shipped', () => {
    expect(targetStatusesFor(order({ status: 'processing', kind: 'digital' }))).toEqual([
      'awaiting_review',
      'completed',
      'cancelled',
    ]);
  });

  it('still offers targets on a completed or cancelled order', () => {
    expect(targetStatusesFor(order({ status: 'completed' }))).toEqual([
      'awaiting_review',
      'processing',
      'sending',
      'cancelled',
    ]);
    expect(targetStatusesFor(order({ status: 'cancelled' }))).toEqual([
      'awaiting_review',
      'processing',
      'sending',
      'completed',
    ]);
  });

  it('never lists a status twice, even though two actions target cancelled', () => {
    for (const status of ['awaiting_review', 'processing', 'sending', 'completed'] as const) {
      const targets = targetStatusesFor(order({ status }));
      expect(new Set(targets).size).toBe(targets.length);
    }
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

  it('maps the backward transitions the widening introduced', () => {
    expect(actionForTransition('awaiting_review', 'completed')).toBe('complete');
    expect(actionForTransition('completed', 'processing')).toBe('approve');
    expect(actionForTransition('cancelled', 'sending')).toBe('ship');
    expect(actionForTransition('completed', 'awaiting_review')).toBe('revert');
    expect(actionForTransition('cancelled', 'awaiting_review')).toBe('revert');
  });

  /**
   * `from === to` is the ONLY null left, and it is what the «بروزرسانی» button is disabled on.
   * Before the widening this function also returned null for edges the machine lacked; there are
   * none now, so a non-null answer for every distinct pair is itself the coverage assertion.
   */
  it('returns null only when nothing would change', () => {
    const ALL = ['awaiting_review', 'processing', 'sending', 'completed', 'cancelled'] as const;
    for (const from of ALL) {
      expect(actionForTransition(from, from)).toBeNull();
      for (const to of ALL.filter((s) => s !== from)) {
        expect(actionForTransition(from, to)).not.toBeNull();
      }
    }
  });
});
