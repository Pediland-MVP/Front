import { createElement } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { SWRConfig } from 'swr';

const { fetcherMock } = vi.hoisted(() => ({ fetcherMock: vi.fn() }));
vi.mock('@/hooks/swr/api-client', () => ({ fetcher: fetcherMock }));

import { useImportJobPolling } from './useImportJobPolling';

// Fresh SWR cache per test (a plain Map, per SWR's own testing docs) so one test's polling
// state can never leak into the next — the module-level default cache would otherwise be
// shared across every `renderHook` call in this file.
const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(SWRConfig, { value: { provider: () => new Map(), dedupingInterval: 0 } }, children);

describe('useImportJobPolling', () => {
  beforeEach(() => {
    fetcherMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null status and never fetches while jobId is null', async () => {
    const { result } = renderHook(() => useImportJobPolling(null), { wrapper });

    expect(result.current.status).toBeUndefined();
    expect(fetcherMock).not.toHaveBeenCalled();
  });

  it('polls on the ~1.5s interval while the job is in flight, then stops once terminal', async () => {
    const states = ['waiting', 'active', 'completed'];
    let call = 0;
    fetcherMock.mockImplementation(async () => ({
      data: { state: states[Math.min(call++, states.length - 1)], processed: call, failed: 0 },
    }));

    const { result } = renderHook(() => useImportJobPolling('job-1'), { wrapper });

    // Initial fetch (mount) resolves to the first state. It's a microtask (not scheduled via
    // a timer), so flushing microtasks with a 0ms fake-timer advance is enough to observe it —
    // `act` re-renders the hook with whatever state landed during the flush.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.status?.state).toBe('waiting');
    expect(fetcherMock).toHaveBeenCalledTimes(1);

    // First poll tick -> second state ('active', still non-terminal).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(result.current.status?.state).toBe('active');
    expect(fetcherMock).toHaveBeenCalledTimes(2);

    // Second poll tick -> terminal state ('completed'). Per SWR's `refreshInterval` function
    // form, this is the response that makes the NEXT scheduled interval resolve to 0.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(result.current.status?.state).toBe('completed');
    const callsAtTerminal = fetcherMock.mock.calls.length;
    expect(callsAtTerminal).toBe(3);

    // Advance well past several more would-be poll intervals: refreshInterval is now 0, so no
    // further fetch should ever fire. This is the actual "polling genuinely stops" assertion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(fetcherMock).toHaveBeenCalledTimes(callsAtTerminal);
  });

  it('stops immediately when the job is already in a terminal ("failed") state on first fetch', async () => {
    fetcherMock.mockResolvedValue({ data: { state: 'failed', processed: 2, failed: 5 } });

    const { result } = renderHook(() => useImportJobPolling('job-2'), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.status?.state).toBe('failed');
    expect(fetcherMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(fetcherMock).toHaveBeenCalledTimes(1);
  });
});
