'use client';

import useSWR from 'swr';

import api from '@/hooks/swr/api-client';
import type { PaginatedResult } from '@/types/commerce';
import type {
  CommerceShippingOption,
  CreateShippingOptionPayload,
  SetRateOverridesPayload,
  UpdateShippingOptionPayload,
} from '@/types/shipping';

export const shippingOptionsKey = '/commerce/shipping-options';

/**
 * The workspace's shipping options plus their price exceptions, and the four writes that change
 * them.
 *
 * `GET /commerce/shipping-options` returns the whole set in one shot — no page/limit — wrapped in
 * the project's `PaginatedResult` envelope for arrays (CLAUDE.md §9) with a single synthetic page.
 * Each option arrives with its `overrides` eager-loaded, which is the only way to read them: there
 * is no `GET :id/overrides` route.
 *
 * The mutations deliberately do NOT revalidate on their own. The settings screen batches a whole
 * screenful of edits behind one save button and revalidates once at the end; a `mutate` per call
 * would refetch several times mid-save and let a stale response overwrite the pending drafts.
 */
export function useShippingOptions() {
  const { data, error, isLoading, mutate } =
    useSWR<PaginatedResult<CommerceShippingOption[]>>(shippingOptionsKey);

  const createOption = (payload: CreateShippingOptionPayload) =>
    api.post(shippingOptionsKey, payload);

  const updateOption = (id: string, payload: UpdateShippingOptionPayload) =>
    api.patch(`${shippingOptionsKey}/${id}`, payload);

  const deleteOption = (id: string) => api.delete(`${shippingOptionsKey}/${id}`);

  /** Full replace of one option's exceptions — send the whole list, never a diff. */
  const setOverrides = (id: string, payload: SetRateOverridesPayload) =>
    api.put(`${shippingOptionsKey}/${id}/overrides`, payload);

  return {
    options: data?.items ?? [],
    isLoading,
    error,
    mutate,
    createOption,
    updateOption,
    deleteOption,
    setOverrides,
  };
}
