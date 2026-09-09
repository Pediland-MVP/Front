'use client';

import useSWR from 'swr';

import api from '@/hooks/swr/api-client';
import type { IResponseMessage } from '@/types/responseMessage';
import type { IShopAddress } from '@/types/shopAddress';

export const shopAddressKey = '/commerce/shop-address';

/**
 * The workspace's own return address — one row per workspace, no route param (the workspace
 * comes from the JWT, same as `useShippingOptions`). `data` is `null` when the workspace has
 * never opened the settings form.
 */
export function useShopAddress() {
  const { data, error, isLoading, mutate } =
    useSWR<IResponseMessage<IShopAddress | null>>(shopAddressKey);

  const save = (payload: {
    address?: string;
    postalcode?: string;
    phone?: string;
    shippingMethod?: string;
    cityId?: number;
  }) => api.put<IResponseMessage<IShopAddress>>(shopAddressKey, payload);

  return {
    address: data?.data ?? null,
    isLoading,
    error,
    mutate,
    save,
  };
}
