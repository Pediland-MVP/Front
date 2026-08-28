import type { ICity } from '@/types/city';
import type { IProvince } from '@/types/province';
import type { CommerceShippingRateOverride } from '@/types/shipping';

/** A city or a whole province — the two things a price exception can target. */
export interface ShippingDestination {
  kind: 'city' | 'province';
  id: number;
  name: string;
}

/** How many suggestions the search dropdown will show at most. */
export const DESTINATION_SEARCH_LIMIT = 30;

/** Stable key for "this exact destination", used to dedupe against already-added exceptions. */
export function destinationKey(destination: {
  kind: 'city' | 'province';
  id: number;
}): `${'city' | 'province'}:${number}` {
  return `${destination.kind}:${destination.id}`;
}

/** The same key derived from a saved override row, whose target is a nullable id pair. */
export function overrideKey(
  override: Pick<CommerceShippingRateOverride, 'cityId' | 'provinceId'>,
): string {
  return override.cityId != null ? `city:${override.cityId}` : `province:${override.provinceId}`;
}

/**
 * Suggestions for the "add an exception" box.
 *
 * Provinces come first: a merchant pricing a whole region wants the province row, and putting it
 * under a pile of city matches for the same word would bury it. Anything already added is filtered
 * out rather than shown disabled — the list is a menu of what you can still pick.
 */
export function searchDestinations({
  provinces,
  cities,
  query,
  taken,
  limit = DESTINATION_SEARCH_LIMIT,
}: {
  provinces: IProvince[];
  cities: ICity[];
  query: string;
  taken: Set<string>;
  limit?: number;
}): ShippingDestination[] {
  const needle = query.trim();
  if (!needle) return [];

  const results: ShippingDestination[] = [];

  for (const province of provinces) {
    if (results.length >= limit) return results;
    const destination: ShippingDestination = {
      kind: 'province',
      id: province.id,
      name: province.name,
    };
    if (province.name.includes(needle) && !taken.has(destinationKey(destination))) {
      results.push(destination);
    }
  }

  for (const city of cities) {
    if (results.length >= limit) return results;
    const destination: ShippingDestination = { kind: 'city', id: city.id, name: city.name };
    if (city.name.includes(needle) && !taken.has(destinationKey(destination))) {
      results.push(destination);
    }
  }

  return results;
}
