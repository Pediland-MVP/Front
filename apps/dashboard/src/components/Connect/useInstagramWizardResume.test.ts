import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInstagramWizardResume } from './useInstagramWizardResume';

let params = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => params,
}));

describe('useInstagramWizardResume', () => {
  beforeEach(() => {
    params = new URLSearchParams();
    window.history.replaceState(null, '', '/settings/instagram');
  });

  it('does nothing when there is no resume flag', () => {
    const onResolved = vi.fn();
    const onMismatch = vi.fn();
    renderHook(() =>
      useInstagramWizardResume({ currentWorkspaceId: 'ws1', onResolved, onMismatch }),
    );
    expect(onResolved).not.toHaveBeenCalled();
    expect(onMismatch).not.toHaveBeenCalled();
  });

  it('waits for currentWorkspaceId before deciding anything', () => {
    params = new URLSearchParams('igwResume=1&igwTargetWs=ws1&igwPlanId=1&igwDurationId=10');
    const onResolved = vi.fn();
    const onMismatch = vi.fn();
    renderHook(() =>
      useInstagramWizardResume({ currentWorkspaceId: null, onResolved, onMismatch }),
    );
    expect(onResolved).not.toHaveBeenCalled();
    expect(onMismatch).not.toHaveBeenCalled();
  });

  it('resolves and strips the resume params when the workspace switch landed', () => {
    params = new URLSearchParams(
      'igwResume=1&igwTargetWs=ws1&igwPlanId=1&igwDurationId=10&igwUsername=befroosh',
    );
    window.history.replaceState(null, '', '/settings/instagram?' + params.toString());
    const onResolved = vi.fn();
    const onMismatch = vi.fn();

    renderHook(() =>
      useInstagramWizardResume({ currentWorkspaceId: 'ws1', onResolved, onMismatch }),
    );

    expect(onResolved).toHaveBeenCalledWith({
      planId: 1,
      durationId: 10,
      username: 'befroosh',
      targetWorkspaceId: 'ws1',
    });
    expect(onMismatch).not.toHaveBeenCalled();
    expect(window.location.search).toBe('');
  });

  it('reports a mismatch and strips params without resolving when the switch did not land', () => {
    params = new URLSearchParams('igwResume=1&igwTargetWs=ws-other&igwPlanId=1&igwDurationId=10');
    window.history.replaceState(null, '', '/settings/instagram?' + params.toString());
    const onResolved = vi.fn();
    const onMismatch = vi.fn();

    renderHook(() =>
      useInstagramWizardResume({ currentWorkspaceId: 'ws1', onResolved, onMismatch }),
    );

    expect(onMismatch).toHaveBeenCalled();
    expect(onResolved).not.toHaveBeenCalled();
    expect(window.location.search).toBe('');
  });
});
