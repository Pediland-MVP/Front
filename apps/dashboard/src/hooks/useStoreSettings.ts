'use client';

import useSWR from 'swr';

import api from '@/hooks/swr/api-client';
import type { CommerceStoreSettings } from '@/types/commerce';
import type { IResponseMessage } from '@/types/responseMessage';

export const storeSettingsKey = '/commerce/settings';

/**
 * The workspace's commerce store settings ("تنظیمات فروشگاه"). Today this is one field: the
 * default `finalMessage` a new PHYSICAL product is prefilled with at creation.
 *
 * `enabled` lets `ProductEditorPage` skip the request entirely in edit mode, where the default is
 * never used -- an existing product already has its own `finalMessage`.
 */
export function useStoreSettings(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<IResponseMessage<CommerceStoreSettings>>(
    enabled ? storeSettingsKey : null,
  );

  const save = (defaultFinalMessage: string | null) =>
    api.put<IResponseMessage<CommerceStoreSettings>>(storeSettingsKey, { defaultFinalMessage });

  return {
    settings: data?.data ?? null,
    isLoading,
    error,
    mutate,
    save,
  };
}
