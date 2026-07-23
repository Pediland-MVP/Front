'use client';

import useSWR from 'swr';

import { fetcher } from '@/hooks/swr/api-client';
import type { IResponseMessage } from '@/types/responseMessage';

/**
 * Raw BullMQ job state string (`GET /commerce/import/:jobId`'s `state` field) — NOT a closed
 * enum on the backend (`job.getState()` just returns whatever BullMQ reports), so this stays a
 * plain `string` rather than a union we'd have to keep in sync.
 */
export type CommerceImportJobState = string;

export interface CommerceImportJobStatus {
  state: CommerceImportJobState;
  processed: number;
  failed: number;
  // Already a resolved, downloadable URL (Back commit a0bad83c) — never a bare file id.
  errorReportUrl?: string;
}

/** BullMQ states that mean "the job will never change again" — polling must stop here. */
const TERMINAL_STATES = new Set(['completed', 'failed']);

export function isTerminalImportState(state: CommerceImportJobState | undefined): boolean {
  return !!state && TERMINAL_STATES.has(state);
}

/** Poll interval while the job is still in flight (~1.5s per the task-10 brief). */
const POLL_INTERVAL_MS = 1500;

const importJobKey = (jobId: string) => `/commerce/import/${jobId}`;

/**
 * Polls `GET /commerce/import/:jobId` on an interval until the job reaches a terminal state
 * (`completed`/`failed`), then stops. `jobId` is `null` before the upload step has produced one
 * yet — SWR treats a `null` key as "don't fetch", so the hook is a no-op until a real id exists.
 *
 * The stopping condition is expressed through SWR's `refreshInterval` FUNCTION form: SWR calls
 * it with the latest fetched data on every tick and uses whatever number it returns as the NEXT
 * interval, so returning `0` once `state` is terminal genuinely halts polling instead of just
 * skipping one tick (no other feature in this codebase already polls a job/async status this
 * way, so this is a new-but-idiomatic use of the documented SWR API — see swr.vercel.app/docs/api).
 */
export function useImportJobPolling(jobId: string | null) {
  const { data, error, isLoading } = useSWR<IResponseMessage<CommerceImportJobStatus>>(
    jobId ? importJobKey(jobId) : null,
    fetcher,
    {
      refreshInterval: (latestData) =>
        isTerminalImportState(latestData?.data?.state) ? 0 : POLL_INTERVAL_MS,
    },
  );

  return {
    status: data?.data,
    isLoading,
    isError: !!error,
  };
}
