import useSWRImmutable from 'swr/immutable';
import { fetcher } from '@/hooks/swr/api-client';
import { IResponseMessage } from '@/types/responseMessage';

export type AutomationDefaults = {
  followMessage: string | null;
  followCheckMessage: string | null;
  commentStartText: string | null;
  commentStartTitle: string | null;
  commentTexts: string[] | null;
};

/**
 * Fetches this workspace's remembered automation default texts. `enabled=false`
 * skips the fetch entirely (e.g. the edit form, where these defaults are never
 * used since the automation's own saved values already populate the form).
 */
export function useAutomationDefaults(enabled: boolean = true) {
  const { data, error, isLoading } = useSWRImmutable<IResponseMessage<AutomationDefaults>>(
    enabled ? '/contentCycle/automation-defaults' : null,
    fetcher,
  );

  return {
    defaults: data?.data ?? null,
    isLoading,
    error,
  };
}
