'use client';

import useSWR from 'swr';
import api, { fetcher } from '@/hooks/swr/api-client';
import { IceBreaker, IceBreakerNamespace } from '@/types/iceBreaker';

/**
 * Module-level frozen fallbacks.
 *
 * NOT cosmetic: a literal `?? []` allocates a NEW array on every render, and a
 * consumer that lists the result in a `useEffect` dependency array then re-runs
 * that effect forever ("Maximum update depth exceeded"). Sharing one stable
 * identity is what makes these safe to depend on.
 */
const EMPTY_ICE_BREAKERS: readonly IceBreaker[] = Object.freeze([]);

/**
 * Ice Breakers for ONE Instagram page.
 *
 * Keyed on `instagramId` and skipped (`null` key) until a page is chosen, so
 * switching pages refetches instead of showing another page's slots.
 *
 * The automation options are NOT fetched here — the page reuses the shared
 * `AutomationSearchSelect`, which reads `GET /contentCycle/conditions` itself.
 */
export function useIceBreakers(instagramId: string | null) {
  const listKey = instagramId ? `/ice-breakers?instagramId=${instagramId}` : null;
  const {
    data: listData,
    error: listError,
    isLoading: isListLoading,
    mutate,
  } = useSWR<IceBreakerNamespace.GET.List>(listKey, fetcher);

  const iceBreakers = (listData?.data?.items ?? EMPTY_ICE_BREAKERS) as readonly IceBreaker[];

  /**
   * Replaces the page's whole list. Returns the saved rows.
   *
   * Callers must send every slot, including unchanged ones — the backend mirrors
   * Meta's full-replace semantics.
   */
  const save = async (body: IceBreakerNamespace.POST.SaveBody) => {
    const { data } = await api.post<IceBreakerNamespace.POST.Save>('/ice-breakers', body);
    await mutate();
    return data?.data?.items ?? [];
  };

  return {
    iceBreakers,
    /**
     * Whether the list request has actually come back (as opposed to "not
     * loading because no page is selected yet"). Consumers seed their draft off
     * this rather than off `iceBreakers`, so an empty list from a real response
     * is distinguishable from no response at all.
     */
    isListLoaded: listData !== undefined,
    // Meta push state, NOT save state — see the type doc.
    syncedAt: listData?.data?.syncedAt ?? null,
    syncError: listData?.data?.syncError ?? null,
    isLoading: isListLoading,
    error: listError,
    save,
    mutate,
  };
}
