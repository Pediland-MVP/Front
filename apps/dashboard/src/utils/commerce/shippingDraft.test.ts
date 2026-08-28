import { describe, expect, it } from 'vitest';

import type { CommerceShippingOption } from '@/types/shipping';
import {
  areOverridesDirty,
  isOptionDirty,
  newOptionDraft,
  pricingOf,
  toDraft,
  toOverridesPayload,
  toPayload,
} from '@/utils/commerce/shippingDraft';

const option = (overrides: Partial<CommerceShippingOption> = {}): CommerceShippingOption => ({
  id: 'opt-1',
  workspaceId: 'ws-1',
  kind: 'post_pishtaz',
  title: 'پست پیشتاز',
  pricing: 'flat',
  amount: 45000,
  freeOverAmount: null,
  sortOrder: 0,
  isActive: true,
  overrides: [],
  createDate: '2026-08-27T00:00:00.000Z',
  updateDate: '2026-08-27T00:00:00.000Z',
  ...overrides,
});

describe('pricingOf', () => {
  it('maps the two switches onto the three-way enum', () => {
    const base = toDraft(option());

    expect(pricingOf({ ...base, postKerayeh: false, freeOverEnabled: false })).toBe('flat');
    expect(pricingOf({ ...base, postKerayeh: false, freeOverEnabled: true })).toBe('free_over');
    expect(pricingOf({ ...base, postKerayeh: true, freeOverEnabled: false })).toBe('post_kerayeh');
  });

  it('lets پس‌کرایه win when both switches are on', () => {
    const base = toDraft(option());

    expect(pricingOf({ ...base, postKerayeh: true, freeOverEnabled: true })).toBe('post_kerayeh');
  });
});

describe('toDraft', () => {
  it('keeps a usable threshold number when free_over is off', () => {
    expect(toDraft(option({ pricing: 'flat', freeOverAmount: null }))).toMatchObject({
      freeOverEnabled: false,
      freeOverAmount: 0,
    });
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
    expect(toDraft({ ...option(), overrides: undefined as any }).overrides).toEqual([]);
  });
});

describe('toPayload', () => {
  it('sends a threshold only in free_over mode', () => {
    const base = toDraft(option({ pricing: 'free_over', freeOverAmount: 1_500_000 }));

    expect(toPayload(base)).toMatchObject({ pricing: 'free_over', freeOverAmount: 1_500_000 });
    expect(toPayload({ ...base, freeOverEnabled: false })).toMatchObject({
      pricing: 'flat',
      freeOverAmount: null,
    });
  });

  it('zeroes the amount for پس‌کرایه even when the field still holds a price', () => {
    const draft = { ...toDraft(option({ amount: 45000 })), postKerayeh: true };

    expect(toPayload(draft)).toMatchObject({
      pricing: 'post_kerayeh',
      amount: 0,
      freeOverAmount: null,
    });
  });

  it('trims the title', () => {
    expect(toPayload({ ...toDraft(option()), title: '  پست  ' }).title).toBe('پست');
  });
});

describe('toOverridesPayload', () => {
  it('turns each draft row back into a one-sided target', () => {
    const draft = toDraft(
      option({
        overrides: [
          { id: 'o1', shippingOptionId: 'opt-1', cityId: 20, provinceId: null, amount: 110000 },
          { id: 'o2', shippingOptionId: 'opt-1', cityId: null, provinceId: 2, amount: 78000 },
        ],
      }),
    );

    expect(toOverridesPayload(draft).overrides).toEqual([
      { cityId: 20, provinceId: null, amount: 110000 },
      { cityId: null, provinceId: 2, amount: 78000 },
    ]);
  });

  it('clears the list for پس‌کرایه instead of sending rows the API would reject', () => {
    const draft = {
      ...toDraft(
        option({
          overrides: [
            { id: 'o1', shippingOptionId: 'opt-1', cityId: 20, provinceId: null, amount: 110000 },
          ],
        }),
      ),
      postKerayeh: true,
    };

    expect(toOverridesPayload(draft).overrides).toEqual([]);
  });
});

describe('isOptionDirty', () => {
  it('is false for an untouched draft', () => {
    const saved = option({ pricing: 'free_over', freeOverAmount: 2_000_000 });

    expect(isOptionDirty(toDraft(saved), saved)).toBe(false);
  });

  it('notices a changed price, title, kind, activity and pricing mode', () => {
    const saved = option();
    const base = toDraft(saved);

    expect(isOptionDirty({ ...base, amount: 50000 }, saved)).toBe(true);
    expect(isOptionDirty({ ...base, title: 'دیگر' }, saved)).toBe(true);
    expect(isOptionDirty({ ...base, kind: 'tipax' }, saved)).toBe(true);
    expect(isOptionDirty({ ...base, isActive: false }, saved)).toBe(true);
    expect(isOptionDirty({ ...base, postKerayeh: true }, saved)).toBe(true);
  });

  it('does not report a threshold edit that free_over mode is not using', () => {
    const saved = option({ pricing: 'flat', freeOverAmount: null });
    const base = toDraft(saved);

    expect(isOptionDirty({ ...base, freeOverAmount: 999999 }, saved)).toBe(false);
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

  it('treats dropping every row as a change', () => {
    expect(areOverridesDirty({ ...toDraft(saved), overrides: [] }, saved)).toBe(true);
  });
});

describe('newOptionDraft', () => {
  it('starts inactive-free and unsaved, with a unique key each time', () => {
    const a = newOptionDraft('روش تازه', 3);
    const b = newOptionDraft('روش تازه', 4);

    expect(a).toMatchObject({ serverId: null, isActive: true, amount: 0, sortOrder: 3 });
    expect(a.key).not.toBe(b.key);
  });
});
