import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkspaceTargetStep } from './useWorkspaceTargetStep';

describe('useWorkspaceTargetStep', () => {
  it('defaults to "existing" mode and is not finalizable until a workspace is selected', () => {
    const { result } = renderHook(() =>
      useWorkspaceTargetStep({ active: false, currentWorkspaceId: null }),
    );
    expect(result.current.targetMode).toBe('existing');
    expect(result.current.canFinalize).toBe(false);
  });

  it('defaults the existing-workspace selection to the current workspace once active', () => {
    const { result, rerender } = renderHook(
      ({ active, currentWorkspaceId }) => useWorkspaceTargetStep({ active, currentWorkspaceId }),
      { initialProps: { active: false, currentWorkspaceId: null as string | null } },
    );
    expect(result.current.selectedExistingWorkspaceId).toBe('');

    rerender({ active: true, currentWorkspaceId: 'ws-current' });

    expect(result.current.selectedExistingWorkspaceId).toBe('ws-current');
    expect(result.current.resolvedTargetIsCurrent).toBe(true);
    expect(result.current.canFinalize).toBe(true);
  });

  it('is not "resolved as current" once a different existing workspace is picked', () => {
    const { result } = renderHook(() =>
      useWorkspaceTargetStep({ active: true, currentWorkspaceId: 'ws-current' }),
    );

    act(() => result.current.setSelectedExistingWorkspaceId('ws-other'));

    expect(result.current.resolvedTargetIsCurrent).toBe(false);
    expect(result.current.canFinalize).toBe(true);
  });

  it('requires both a name and a category before "new" mode can finalize', () => {
    const { result } = renderHook(() =>
      useWorkspaceTargetStep({ active: true, currentWorkspaceId: 'ws-current' }),
    );

    act(() => result.current.setTargetMode('new'));
    expect(result.current.canFinalize).toBe(false);

    act(() => result.current.setNewWorkspaceName('کسب و کار جدید'));
    expect(result.current.canFinalize).toBe(false);

    act(() => result.current.setNewWorkspaceCategoryId('cat1'));
    expect(result.current.canFinalize).toBe(true);
    expect(result.current.resolvedTargetIsCurrent).toBe(false);
  });

  it('resolveTargetWorkspaceId returns the selected id directly in "existing" mode, without creating anything', async () => {
    const { result } = renderHook(() =>
      useWorkspaceTargetStep({ active: true, currentWorkspaceId: 'ws-current' }),
    );
    const createWorkspace = vi.fn();

    const targetId = await result.current.resolveTargetWorkspaceId(createWorkspace);

    expect(targetId).toBe('ws-current');
    expect(createWorkspace).not.toHaveBeenCalled();
  });

  it('resolveTargetWorkspaceId creates the workspace and returns its id in "new" mode', async () => {
    const { result } = renderHook(() =>
      useWorkspaceTargetStep({ active: true, currentWorkspaceId: 'ws-current' }),
    );
    act(() => result.current.setTargetMode('new'));
    act(() => result.current.setNewWorkspaceName('  کسب و کار جدید  '));
    act(() => result.current.setNewWorkspaceCategoryId('cat1'));

    const createWorkspace = vi.fn().mockResolvedValue('ws-new');
    const targetId = await result.current.resolveTargetWorkspaceId(createWorkspace);

    expect(createWorkspace).toHaveBeenCalledWith('کسب و کار جدید', 'cat1');
    expect(targetId).toBe('ws-new');
  });

  it('reset clears user-input fields (name/category/finalizing) but re-applies the current-workspace default', () => {
    const { result } = renderHook(() =>
      useWorkspaceTargetStep({ active: true, currentWorkspaceId: 'ws-current' }),
    );
    act(() => result.current.setTargetMode('new'));
    act(() => result.current.setNewWorkspaceName('x'));
    act(() => result.current.setNewWorkspaceCategoryId('cat1'));
    act(() => result.current.setIsFinalizing(true));

    act(() => result.current.reset());

    expect(result.current.targetMode).toBe('existing');
    expect(result.current.newWorkspaceName).toBe('');
    expect(result.current.newWorkspaceCategoryId).toBe('');
    // Since the step remains active and currentWorkspaceId is still 'ws-current',
    // the effect re-applies the default after reset clears it
    expect(result.current.selectedExistingWorkspaceId).toBe('ws-current');
    expect(result.current.isFinalizing).toBe(false);
  });

  it('re-applies the current-workspace default after reset as long as the step remains active', () => {
    const { result } = renderHook(() =>
      useWorkspaceTargetStep({ active: true, currentWorkspaceId: 'ws-current' }),
    );
    // Confirm initial default applied
    expect(result.current.selectedExistingWorkspaceId).toBe('ws-current');

    // Manually switch to a different workspace
    act(() => result.current.setSelectedExistingWorkspaceId('ws-other'));
    expect(result.current.selectedExistingWorkspaceId).toBe('ws-other');

    // Reset clears the selection; the effect should re-fire and re-apply the default
    // because selectedExistingWorkspaceId is now empty again and active is still true
    act(() => result.current.reset());

    // The effect should have re-applied the default
    expect(result.current.selectedExistingWorkspaceId).toBe('ws-current');
  });
});
