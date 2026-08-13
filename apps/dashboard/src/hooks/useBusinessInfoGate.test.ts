import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBusinessInfoGate } from './useBusinessInfoGate';
import { useBusinessInfoGateStore } from '@/lib/stores/useBusinessInfoGateStore';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const userState: { user: any; isLoading: boolean; error: any } = {
  user: undefined,
  isLoading: false,
  error: undefined,
};
vi.mock('@/hooks/useUser', () => ({ default: () => userState }));

beforeEach(() => {
  push.mockClear();
  useBusinessInfoGateStore.setState({ isOpen: false, pendingHref: null });
  userState.user = undefined;
  userState.isLoading = false;
  userState.error = undefined;
});

describe('useBusinessInfoGate', () => {
  it('navigates straight through when howFoundUs is already set', () => {
    userState.user = { howFoundUs: 'google' };
    const { result } = renderHook(() => useBusinessInfoGate());
    expect(result.current.needsBusinessInfo).toBe(false);
    act(() => result.current.startAutomationCreate('/automations/add'));
    expect(push).toHaveBeenCalledWith('/automations/add');
    expect(useBusinessInfoGateStore.getState().isOpen).toBe(false);
  });

  it('opens the dialog and remembers the href when howFoundUs is empty', () => {
    userState.user = { howFoundUs: null };
    const { result } = renderHook(() => useBusinessInfoGate());
    expect(result.current.needsBusinessInfo).toBe(true);
    act(() => result.current.startAutomationCreate('/automations/add?templateId=t1'));
    expect(push).not.toHaveBeenCalled();
    expect(useBusinessInfoGateStore.getState()).toMatchObject({
      isOpen: true,
      pendingHref: '/automations/add?templateId=t1',
    });
  });

  it('navigates without gating while the user is still loading', () => {
    userState.isLoading = true;
    const { result } = renderHook(() => useBusinessInfoGate());
    act(() => result.current.startAutomationCreate('/automations/add'));
    expect(push).toHaveBeenCalledWith('/automations/add');
  });

  it('navigates without gating when the user request failed', () => {
    userState.error = new Error('boom');
    const { result } = renderHook(() => useBusinessInfoGate());
    act(() => result.current.startAutomationCreate('/automations/add'));
    expect(push).toHaveBeenCalledWith('/automations/add');
  });
});
