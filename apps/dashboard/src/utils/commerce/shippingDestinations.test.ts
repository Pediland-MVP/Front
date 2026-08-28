import { describe, expect, it } from 'vitest';

import type { ICity } from '@/types/city';
import type { IProvince } from '@/types/province';

import {
  destinationKey,
  overrideKey,
  searchDestinations,
} from '@/utils/commerce/shippingDestinations';

const provinces: IProvince[] = [
  { id: 1, name: 'تهران', slug: 'tehran', tel_prefix: '021' },
  { id: 2, name: 'هرمزگان', slug: 'hormozgan', tel_prefix: '076' },
];

const cities: ICity[] = [
  { id: 10, name: 'تهران', slug: 'tehran', provinceId: 1 },
  { id: 11, name: 'اسلامشهر', slug: 'eslamshahr', provinceId: 1 },
  { id: 20, name: 'کیش', slug: 'kish', provinceId: 2 },
];

describe('searchDestinations', () => {
  it('returns nothing for an empty or whitespace-only query', () => {
    expect(searchDestinations({ provinces, cities, query: '', taken: new Set() })).toEqual([]);
    expect(searchDestinations({ provinces, cities, query: '   ', taken: new Set() })).toEqual([]);
  });

  it('puts the province ahead of the city that shares its name', () => {
    const results = searchDestinations({ provinces, cities, query: 'تهران', taken: new Set() });

    expect(results.map((r) => r.kind)).toEqual(['province', 'city']);
    expect(results[0]).toMatchObject({ kind: 'province', id: 1 });
    expect(results[1]).toMatchObject({ kind: 'city', id: 10 });
  });

  it('matches on a partial name', () => {
    const results = searchDestinations({ provinces, cities, query: 'اسلام', taken: new Set() });

    expect(results).toEqual([{ kind: 'city', id: 11, name: 'اسلامشهر' }]);
  });

  it('hides destinations that already have an exception', () => {
    const taken = new Set(['province:1']);
    const results = searchDestinations({ provinces, cities, query: 'تهران', taken });

    expect(results).toEqual([{ kind: 'city', id: 10, name: 'تهران' }]);
  });

  it('does not confuse a city id with a province id that happens to match', () => {
    // city 10 and province 1 are different destinations even though both are named تهران.
    const taken = new Set(['city:10']);
    const results = searchDestinations({ provinces, cities, query: 'تهران', taken });

    expect(results).toEqual([{ kind: 'province', id: 1, name: 'تهران' }]);
  });

  it('caps the result count', () => {
    const many: ICity[] = Array.from({ length: 50 }, (_, i) => ({
      id: 100 + i,
      name: `شهر${i}`,
      slug: `c${i}`,
      provinceId: 1,
    }));

    const results = searchDestinations({
      provinces: [],
      cities: many,
      query: 'شهر',
      taken: new Set(),
      limit: 5,
    });

    expect(results).toHaveLength(5);
  });
});

describe('destinationKey / overrideKey', () => {
  it('agrees on the key for the same destination from either shape', () => {
    expect(overrideKey({ cityId: 20, provinceId: null })).toBe(
      destinationKey({ kind: 'city', id: 20 }),
    );
    expect(overrideKey({ cityId: null, provinceId: 2 })).toBe(
      destinationKey({ kind: 'province', id: 2 }),
    );
  });
});
