import { useEffect, useState } from 'react';

export type WorkspaceTargetMode = 'new' | 'existing';

interface UseWorkspaceTargetStepArgs {
  /** True while step 3 is the active wizard step — gates the current-workspace default. */
  active: boolean;
  currentWorkspaceId: string | null;
}

export function useWorkspaceTargetStep({ active, currentWorkspaceId }: UseWorkspaceTargetStepArgs) {
  const [targetMode, setTargetMode] = useState<WorkspaceTargetMode>('existing');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceCategoryId, setNewWorkspaceCategoryId] = useState('');
  const [selectedExistingWorkspaceId, setSelectedExistingWorkspaceId] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    if (active && !selectedExistingWorkspaceId && currentWorkspaceId) {
      setSelectedExistingWorkspaceId(currentWorkspaceId);
    }
  }, [active, currentWorkspaceId, selectedExistingWorkspaceId]);

  const canFinalize =
    targetMode === 'new'
      ? newWorkspaceName.trim().length > 0 && !!newWorkspaceCategoryId
      : !!selectedExistingWorkspaceId;

  const resolvedTargetIsCurrent =
    targetMode === 'existing' && selectedExistingWorkspaceId === currentWorkspaceId;

  const reset = () => {
    setTargetMode('existing');
    setNewWorkspaceName('');
    setNewWorkspaceCategoryId('');
    setSelectedExistingWorkspaceId('');
    setIsFinalizing(false);
  };

  /**
   * Resolves which workspace id the purchase should end up in. In "new" mode this creates the
   * workspace first (via the caller-supplied `createWorkspace`, so this hook never imports the
   * API client directly) and returns its id; in "existing" mode it just returns the current
   * selection.
   */
  const resolveTargetWorkspaceId = async (
    createWorkspace: (name: string, categoryId: string) => Promise<string>,
  ): Promise<string> => {
    if (targetMode === 'new') {
      return createWorkspace(newWorkspaceName.trim(), newWorkspaceCategoryId);
    }
    return selectedExistingWorkspaceId;
  };

  return {
    targetMode,
    setTargetMode,
    newWorkspaceName,
    setNewWorkspaceName,
    newWorkspaceCategoryId,
    setNewWorkspaceCategoryId,
    selectedExistingWorkspaceId,
    setSelectedExistingWorkspaceId,
    isFinalizing,
    setIsFinalizing,
    canFinalize,
    resolvedTargetIsCurrent,
    resolveTargetWorkspaceId,
    reset,
  };
}
