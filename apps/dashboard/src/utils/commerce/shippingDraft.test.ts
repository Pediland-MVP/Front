import { describe, expect, it } from 'vitest';

import type { CommerceShippingOption } from '@/types/shipping';
import {
  areOverridesDirty,
  chargesShipping,
  isOptionDirty,
  newOptionDraft,
  toDraft,
  toOverridesPayload,
  toPayload,
} from '@/utils/commerce/shippingDraft';

const option = (overrides: Partial<CommerceShippingOption> = {}): CommerceShippingOption => ({
  id: 'opt-1',
  workspaceId: 'ws-1',
  kind: 'post_express',
  title: 'پست پیشتاز',
  settlement: 'prepaid',
  amount: 45000,
  freeOverAmount: null,
  sortOrder: 0,
  isSystem: false,
  isActive: true,
  overrides: [],
  createDate: '2026-08-27T00:00:00.000Z',
  updateDate: '2026-08-27T00:00:00.000Z',
  ...overrides,
});

describe('shippingDraft — who owns the method', () => {
  it('carries the server flag through, so the card knows to hide its delete button', () => {
    expect(toDraft(option({ isSystem: true })).isSystem).toBe(true);
  });

  it('marks a method the merchant is adding as theirs, and therefore deletable', () => {
    expect(newOptionDraft('پیک موتوری', 3).isSystem).toBe(false);
  });

  // The server hard-codes `isSystem: false` on create; sending it would be a client claiming a
  // flag it does not own.
  it('never sends it to the API', () => {
    expect(toPayload(toDraft(option({ isSystem: true })))).not.toHaveProperty('isSystem');
  });
});

describe('chargesShipping', () => {
  it('is true only for the prepaid mode', () => {
    expect(chargesShipping({ kind: 'post_express', settlement: 'prepaid' })).toBe(true);
    expect(chargesShipping({ kind: 'post_express', settlement: 'freight_collect' })).toBe(false);
    expect(chargesShipping({ kind: 'post_express', settlement: 'cash_on_delivery' })).toBe(false);
  });

  it('is false for «تحویل حضوری» whatever settlement it carries', () => {
    // In-person collection has no carrier, so nobody charges freight -- the rate field beside it is
    // meaningless, and a merchant who set one before switching the kind must not bill a buyer who
    // is driving over to collect. `ShippingService` enforces the identical rule server-side.
    expect(chargesShipping({ kind: 'pickup', settlement: 'prepaid' })).toBe(false);
    expect(chargesShipping({ kind: 'pickup', settlement: 'freight_collect' })).toBe(false);
    expect(chargesShipping({ kind: 'pickup', settlement: 'cash_on_delivery' })).toBe(false);
  });
});

describe('toDraft', () => {
  it('carries the settlement through as one value', () => {
    expect(toDraft(option({ settlement: 'cash_on_delivery', amount: 0 })).settlement).toBe(
      'cash_on_delivery',
    );
  });

  it('keeps a null threshold null — that is "never waived", not "waived at zero"', () => {
    expect(toDraft(option({ freeOverAmount: null })).freeOverAmount).toBeNull();
    expect(toDraft(option({ freeOverAmount: 0 })).freeOverAmount).toBe(0);
  });

  it('splits a saved override into its kind and target id', () => {
    const draft = toDraft(
      option({
        overrides: [
          { id: 'o1', shippingOptionId: 'opt-1', cityId: 20, provinceId: null, amount: 110000 },
          { id: 'o2', shippingOptionId: 'opt-1', cityId: null, provinceId: 2, amount: 78000 },
        ],
      }),
    );

    expect(draft.overrides).toEqual([
      { key: 'o1', kind: 'city', id: 20, amount: 110000 },
      { key: 'o2', kind: 'province', id: 2, amount: 78000 },
    ]);
  });

  it('survives an option whose overrides were not loaded', () => {
    expect(toDraft({ ...option(), overrides: undefined as never }).overrides).toEqual([]);
  });
});

describe('toPayload', () => {
  it('sends the rate under prepaid', () => {
    const draft = toDraft(option({ amount: 45000, freeOverAmount: 1_500_000 }));

    expect(toPayload(draft)).toMatchObject({
      settlement: 'prepaid',
      amount: 45000,
      freeOverAmount: 1_500_000,
    });
  });

  it('zeroes the rate for a carrier-collected mode even when the field still holds a price', () => {
    const draft = { ...toDraft(option({ amount: 45000 })), settlement: 'freight_collect' as const };

    expect(toPayload(draft)).toMatchObject({
      settlement: 'freight_collect',
      amount: 0,
      freeOverAmount: null,
    });
  });

  it('zeroes it for cash on delivery too — the carrier keeps the freight', () => {
    const draft = {
      ...toDraft(option({ amount: 45000, freeOverAmount: 900_000 })),
      settlement: 'cash_on_delivery' as const,
    };

    expect(toPayload(draft)).toMatchObject({ amount: 0, freeOverAmount: null });
  });

  it('trims the title', () => {
    expect(toPayload({ ...toDraft(option()), title: '  پست  ' }).title).toBe('پست');
  });
});

describe('toPayload — «تحویل حضوری»', () => {
  it('zeroes a prepaid pickup that still holds a rate and a threshold', () => {
    const draft = {
      ...toDraft(option({ amount: 50_000, freeOverAmount: 200_000 })),
      kind: 'pickup' as const,
    };

    expect(toPayload(draft)).toMatchObject({
      kind: 'pickup',
      // The settlement is sent UNCHANGED: the kind is what makes it free, and rewriting the
      // merchant's payment choice behind their back would be a different edit than they made.
      settlement: 'prepaid',
      amount: 0,
      freeOverAmount: null,
    });
  });

  it('drops per-destination exceptions on a pickup', () => {
    const draft = {
      ...toDraft(
        option({
          overrides: [
            {
              id: 'ov-1',
              shippingOptionId: 'opt-1',
              cityId: 5,
              provinceId: null,
              amount: 90_000,
            },
          ],
        }),
      ),
      kind: 'pickup' as const,
    };

    expect(toOverridesPayload(draft)).toEqual({ overrides: [] });
  });
});

describe('toOverridesPayload', () => {
  const withRows = option({
    overrides: [
      { id: 'o1', shippingOptionId: 'opt-1', cityId: 20, provinceId: null, amount: 110000 },
      { id: 'o2', shippingOptionId: 'opt-1', cityId: null, provinceId: 2, amount: 78000 },
    ],
  });

  it('turns each draft row back into a one-sided target', () => {
    expect(toOverridesPayload(toDraft(withRows)).overrides).toEqual([
      { cityId: 20, provinceId: null, amount: 110000 },
      { cityId: null, provinceId: 2, amount: 78000 },
    ]);
  });

  it('clears the list for any carrier-collected mode, which the API would reject', () => {
    for (const settlement of ['freight_collect', 'cash_on_delivery'] as const) {
      const draft = { ...toDraft(withRows), settlement };
      expect(toOverridesPayload(draft).overrides).toEqual([]);
    }
  });
});

describe('isOptionDirty', () => {
  it('is false for an untouched draft', () => {
    const saved = option({ freeOverAmount: 2_000_000 });

    expect(isOptionDirty(toDraft(saved), saved)).toBe(false);
  });

  it('notices a changed price, title, kind, activity and settlement', () => {
    const saved = option();
    const base = toDraft(saved);

    expect(isOptionDirty({ ...base, amount: 50000 }, saved)).toBe(true);
    expect(isOptionDirty({ ...base, title: 'دیگر' }, saved)).toBe(true);
    expect(isOptionDirty({ ...base, kind: 'tipax' }, saved)).toBe(true);
    expect(isOptionDirty({ ...base, isActive: false }, saved)).toBe(true);
    expect(isOptionDirty({ ...base, settlement: 'cash_on_delivery' }, saved)).toBe(true);
  });

  it('does not report a threshold edit a carrier-collected mode is not using', () => {
    const saved = option({ settlement: 'freight_collect', amount: 0, freeOverAmount: null });
    const base = toDraft(saved);

    expect(isOptionDirty({ ...base, freeOverAmount: 999999 }, saved)).toBe(false);
  });

  it('treats switching the threshold off as a change', () => {
    const saved = option({ freeOverAmount: 500_000 });

    expect(isOptionDirty({ ...toDraft(saved), freeOverAmount: null }, saved)).toBe(true);
  });
});

describe('areOverridesDirty', () => {
  const saved = option({
    overrides: [
      { id: 'o1', shippingOptionId: 'opt-1', cityId: 20, provinceId: null, amount: 110000 },
      { id: 'o2', shippingOptionId: 'opt-1', cityId: null, provinceId: 2, amount: 78000 },
    ],
  });

  it('is false for an untouched list', () => {
    expect(areOverridesDirty(toDraft(saved), saved)).toBe(false);
  });

  it('ignores pure reordering', () => {
    const draft = toDraft(saved);

    expect(areOverridesDirty({ ...draft, overrides: [...draft.overrides].reverse() }, saved)).toBe(
      false,
    );
  });

  it('notices an added, removed or repriced row', () => {
    const draft = toDraft(saved);

    expect(
      areOverridesDirty(
        {
          ...draft,
          overrides: [...draft.overrides, { key: 'n', kind: 'city', id: 30, amount: 1 }],
        },
        saved,
      ),
    ).toBe(true);
    expect(areOverridesDirty({ ...draft, overrides: [draft.overrides[0]] }, saved)).toBe(true);
    expect(
      areOverridesDirty(
        { ...draft, overrides: [{ ...draft.overrides[0], amount: 1 }, draft.overrides[1]] },
        saved,
      ),
    ).toBe(true);
  });

  it('distinguishes a city from a province that share an id', () => {
    const cityOnly = option({
      overrides: [
        { id: 'o1', shippingOptionId: 'opt-1', cityId: 5, provinceId: null, amount: 100 },
      ],
    });
    const draft = toDraft(cityOnly);

    expect(
      areOverridesDirty(
        { ...draft, overrides: [{ key: 'o1', kind: 'province', id: 5, amount: 100 }] },
        cityOnly,
      ),
    ).toBe(true);
  });

  it('reports a change when switching to a carrier-collected mode drops saved rows', () => {
    expect(areOverridesDirty({ ...toDraft(saved), settlement: 'cash_on_delivery' }, saved)).toBe(
      true,
    );
  });
});

describe('newOptionDraft', () => {
  it('starts prepaid, active and unsaved, with a unique key each time', () => {
    const a = newOptionDraft('روش تازه', 3);
    const b = newOptionDraft('روش تازه', 4);

    expect(a).toMatchObject({
      serverId: null,
      isActive: true,
      settlement: 'prepaid',
      amount: 0,
      freeOverAmount: null,
      sortOrder: 3,
    });
    expect(a.key).not.toBe(b.key);
  });
});
