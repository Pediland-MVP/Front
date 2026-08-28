'use client';

import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import type { ICity } from '@/types/city';
import type { IProvince } from '@/types/province';

/**
 * The full city and province lists, fetched once and cached for the session.
 *
 * `GET /cities` with no query returns every city in the country (~1,100 rows, id + name + slug +
 * provinceId). That whole-list fetch is deliberate: a saved exception stores a bare `cityId`, so
 * the screen needs the full table to turn ids back into names, and having it client-side also
 * makes the search box instant instead of one request per keystroke. `useSWRImmutable` keeps it
 * to a single request — this data does not change while someone edits shipping prices.
 */
export function useShippingDestinations() {
  const { data: provinces, isLoading: isProvincesLoading } =
    useSWRImmutable<IProvince[]>('/cities/provinces');
  const { data: cities, isLoading: isCitiesLoading } = useSWRImmutable<ICity[]>('/cities');

  const provinceById = useMemo(() => new Map((provinces ?? []).map((p) => [p.id, p])), [provinces]);
  const cityById = useMemo(() => new Map((cities ?? []).map((c) => [c.id, c])), [cities]);

  return {
    provinces: provinces ?? [],
    cities: cities ?? [],
    provinceById,
    cityById,
    isLoading: isProvincesLoading || isCitiesLoading,
  };
}
