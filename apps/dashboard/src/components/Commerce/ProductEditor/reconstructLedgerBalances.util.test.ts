import { describe, expect, it } from 'vitest';

import type { CommerceStockMovement } from '@/types/commerce';

import { reconstructLedgerBalances } from './reconstructLedgerBalances.util';

const buildMovement = (overrides: Partial<CommerceStockMovement>): CommerceStockMovement => ({
  id: 'mv-1',
  variantId: 'var-1',
  locationId: 'loc-1',
  delta: 0,
  reason: 'manual',
  referenceId: null,
  actorId: null,
  createDate: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

describe('reconstructLedgerBalances', () => {
  it('returns an empty array for an empty movement list', () => {
    expect(reconstructLedgerBalances([], 100)).toEqual([]);
  });

  it('walks a DESC-ordered list newest→oldest, giving the newest row the current onHand as its balanceAfter and each older row a progressively-reconstructed balance', () => {
    // Newest first (the API's own order). Hand-worked expectation:
    //   running = 100 (currentOnHand)
    //   row0 (delta +10): balanceAfter = 100; running -= 10  -> 90
    //   row1 (delta -5):  balanceAfter = 90;  running -= -5  -> 95
    //   row2 (delta +20): balanceAfter = 95;  running -= 20  -> 75
    const movements = [
      buildMovement({ id: 'mv-3', delta: 10, createDate: '2026-07-03T00:00:00.000Z' }),
      buildMovement({ id: 'mv-2', delta: -5, createDate: '2026-07-02T00:00:00.000Z' }),
      buildMovement({ id: 'mv-1', delta: 20, createDate: '2026-07-01T00:00:00.000Z' }),
    ];

    const result = reconstructLedgerBalances(movements, 100);

    expect(result.map((m) => m.balanceAfter)).toEqual([100, 90, 95]);
    // The original movement fields must survive untouched, just with `balanceAfter` added.
    expect(result[0]).toMatchObject({ id: 'mv-3', delta: 10, balanceAfter: 100 });
    expect(result[1]).toMatchObject({ id: 'mv-2', delta: -5, balanceAfter: 90 });
    expect(result[2]).toMatchObject({ id: 'mv-1', delta: 20, balanceAfter: 95 });
  });
});
