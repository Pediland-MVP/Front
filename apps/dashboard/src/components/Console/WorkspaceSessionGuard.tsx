'use client';
import { useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaces } from '@/hooks/useWorkspaces';

// The session's active workspace is a claim baked into the access token at
// login/switch time, not a live pointer. If that workspace becomes inaccessible
// in the meantime (e.g. the user left it via a `leave`-mode ownership transfer,
// or was removed by an admin), every page reading it renders as if the user has
// no workspace at all, even though they still own/belong to others. Detect that
// and self-heal by switching to a workspace that is still theirs.
export default function WorkspaceSessionGuard() {
  const { workspaceId } = usePermissions();
  const { workspaces, isLoading, changeWorkspace } = useWorkspaces();

  useEffect(() => {
    if (isLoading || !workspaceId || workspaces.length === 0) return;
    const stillValid = workspaces.some((w) => w.id === workspaceId);
    if (stillValid) return;
    const fallback = workspaces.find((w) => w.isPersonal) ?? workspaces[0];
    changeWorkspace(fallback.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, workspaces, isLoading]);

  return null;
}
