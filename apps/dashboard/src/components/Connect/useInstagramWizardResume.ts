import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface ResumeState {
  planId: number;
  durationId: number;
  username: string | null;
  targetWorkspaceId: string;
}

/** Same shape as ResumeState minus the target workspace id — a mismatch means the switch
 * itself never landed, so there is no verified target workspace to hand back. */
interface MismatchState {
  planId: number;
  durationId: number;
  username: string | null;
}

interface UseInstagramWizardResumeArgs {
  currentWorkspaceId: string | null;
  onResolved: (state: ResumeState) => void;
  onMismatch: (state: MismatchState) => void;
}

// Single source of truth for the igw* query-param keys SetupInstagramDialog stamps onto the
// URL before a workspace-switch reload. Import these instead of hardcoding the literal keys
// so a rename here can't silently desync the write side from this read side.
export const IGW_RESUME_PARAM = 'igwResume';
export const IGW_PLAN_ID_PARAM = 'igwPlanId';
export const IGW_DURATION_ID_PARAM = 'igwDurationId';
export const IGW_USERNAME_PARAM = 'igwUsername';
export const IGW_TARGET_WS_PARAM = 'igwTargetWs';

const RESUME_PARAM_KEYS = [
  IGW_RESUME_PARAM,
  IGW_PLAN_ID_PARAM,
  IGW_DURATION_ID_PARAM,
  IGW_USERNAME_PARAM,
  IGW_TARGET_WS_PARAM,
];

/**
 * Reads the resume state SetupInstagramDialog stamps onto the URL right before a
 * workspace-switch reload, verifies the switch actually landed (the safety check that keeps a
 * failed/racy switch from ever triggering payment into the wrong workspace), and always strips
 * the params afterward so a later manual refresh can't re-trigger anything.
 */
export function useInstagramWizardResume({
  currentWorkspaceId,
  onResolved,
  onMismatch,
}: UseInstagramWizardResumeArgs) {
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (searchParams.get(IGW_RESUME_PARAM) !== '1') return;
    if (!currentWorkspaceId) return; // wait until the workspace context resolves

    handled.current = true;

    const targetWorkspaceId = searchParams.get(IGW_TARGET_WS_PARAM);
    const planId = Number(searchParams.get(IGW_PLAN_ID_PARAM));
    const durationId = Number(searchParams.get(IGW_DURATION_ID_PARAM));
    const username = searchParams.get(IGW_USERNAME_PARAM);

    const url = new URL(window.location.href);
    RESUME_PARAM_KEYS.forEach((key) => url.searchParams.delete(key));
    window.history.replaceState(null, '', url.toString());

    if (!targetWorkspaceId || targetWorkspaceId !== currentWorkspaceId || !planId || !durationId) {
      onMismatch({ planId, durationId, username });
      return;
    }

    onResolved({ planId, durationId, username, targetWorkspaceId });
  }, [searchParams, currentWorkspaceId, onResolved, onMismatch]);
}
