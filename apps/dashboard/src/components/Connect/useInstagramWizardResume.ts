import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface ResumeState {
  planId: number;
  durationId: number;
  username: string | null;
  targetWorkspaceId: string;
}

interface UseInstagramWizardResumeArgs {
  currentWorkspaceId: string | null;
  onResolved: (state: ResumeState) => void;
  onMismatch: () => void;
}

const RESUME_PARAM_KEYS = ['igwResume', 'igwPlanId', 'igwDurationId', 'igwUsername', 'igwTargetWs'];

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
    if (searchParams.get('igwResume') !== '1') return;
    if (!currentWorkspaceId) return; // wait until the workspace context resolves

    handled.current = true;

    const targetWorkspaceId = searchParams.get('igwTargetWs');
    const planId = Number(searchParams.get('igwPlanId'));
    const durationId = Number(searchParams.get('igwDurationId'));
    const username = searchParams.get('igwUsername');

    const url = new URL(window.location.href);
    RESUME_PARAM_KEYS.forEach((key) => url.searchParams.delete(key));
    window.history.replaceState(null, '', url.toString());

    if (!targetWorkspaceId || targetWorkspaceId !== currentWorkspaceId || !planId || !durationId) {
      onMismatch();
      return;
    }

    onResolved({ planId, durationId, username, targetWorkspaceId });
  }, [searchParams, currentWorkspaceId, onResolved, onMismatch]);
}
