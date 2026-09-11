import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';

const push = vi.fn();
const replace = vi.fn();
let pathname = '/auth/onboarding';
let searchParamsString = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(searchParamsString),
}));

let userState: any = {};
vi.mock('@/hooks/useUser', () => ({
  default: () => userState,
}));

vi.mock('@/hooks/swr/api-client', () => ({
  fetcher: vi.fn(),
  enableSessionBootstrap: vi.fn(),
}));

// The real backend returns a `PaginatedResult` — `{ items, meta }` — for both
// `/invitations/pending` and `/ownership-transfers/incoming` (see
// Back/apps/core/src/common/classes/paginatedResult.ts). These fixtures mirror that
// exact shape so the test fails if AuthProvider goes back to reading a `.data` field
// that the backend never sends.
let swrResponses: Record<string, { data: unknown; isLoading: boolean }> = {};
vi.mock('swr', () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, isLoading: false };
    return swrResponses[key] ?? { data: undefined, isLoading: false };
  },
}));

function renderProvider() {
  return render(
    <AuthProvider>
      <div>console</div>
    </AuthProvider>,
  );
}

describe('AuthProvider — pending invitations / transfers routing', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    sessionStorage.clear();
    swrResponses = {};
  });

  it('redirects an onboarding user with a pending invitation to the invitation picker', async () => {
    pathname = '/auth/onboarding';
    userState = {
      error: undefined,
      isOnboarding: true,
      hasInstagram: false,
      isLoading: false,
      user: { id: 'u1' },
    };
    swrResponses['/invitations/pending'] = {
      data: { items: [{ id: 'inv-1' }], meta: { totalItems: 1 } },
      isLoading: false,
    };

    renderProvider();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/onboarding/invitations');
    });
  });

  it('does not redirect to the picker when there are no pending invitations', async () => {
    pathname = '/auth/onboarding';
    userState = {
      error: undefined,
      isOnboarding: true,
      hasInstagram: false,
      isLoading: false,
      user: { id: 'u1' },
    };
    swrResponses['/invitations/pending'] = {
      data: { items: [], meta: { totalItems: 0 } },
      isLoading: false,
    };

    renderProvider();

    await waitFor(() => {
      expect(replace).not.toHaveBeenCalledWith('/auth/onboarding/invitations');
    });
  });

  it('redirects a connect-flow user with a pending ownership transfer to the transfer picker', async () => {
    pathname = '/connect';
    userState = {
      error: undefined,
      isOnboarding: false,
      hasInstagram: false,
      isLoading: false,
      user: { id: 'u1' },
    };
    swrResponses['/invitations/pending'] = {
      data: { items: [], meta: { totalItems: 0 } },
      isLoading: false,
    };
    swrResponses['/ownership-transfers/incoming'] = {
      data: { items: [{ id: 'tr-1' }], meta: { totalItems: 1 } },
      isLoading: false,
    };

    renderProvider();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/onboarding/transfer?returnTo=/connect');
    });
  });

  // otp/page.tsx does `router.push('/auth/onboarding')` after a successful OTP
  // verification — a client-side transition inside the same (Auth) layout, so
  // AuthProvider never unmounts. This reproduces that exact sequence: the same
  // provider instance re-rendering as `isOnboarding` flips true and the pathname
  // changes, instead of a fresh mount that already starts with the right props.
  it('picks up a pending invitation across a live post-OTP transition, without remounting', async () => {
    pathname = '/auth/otp';
    userState = {
      error: undefined,
      isOnboarding: false,
      hasInstagram: false,
      isLoading: false,
      user: undefined,
    };

    const { rerender } = renderProvider();

    await waitFor(() => {
      expect(replace).not.toHaveBeenCalled();
    });

    // Simulate what otp/page.tsx does: sign-in resolves, `/users/me` is mutated
    // in the SWR cache (isOnboarding flips true), then `router.push('/auth/onboarding')`.
    pathname = '/auth/onboarding';
    userState = {
      error: undefined,
      isOnboarding: true,
      hasInstagram: false,
      isLoading: false,
      user: { id: 'u1' },
    };
    swrResponses['/invitations/pending'] = {
      data: { items: [{ id: 'inv-1' }], meta: { totalItems: 1 } },
      isLoading: false,
    };

    act(() => {
      rerender(
        <AuthProvider>
          <div>console</div>
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/onboarding/invitations');
    });
  });
});

// Users sat on the full-screen spinner forever when `/users/me` hung or a JS chunk never
// loaded (Sentry, 2026-09-11: ~440 users/week with a `/users/me` that never finished).
describe('AuthProvider — stuck-loading safeguards', () => {
  const loadingUser = {
    error: undefined,
    isOnboarding: false,
    hasInstagram: false,
    isLoading: true,
    user: undefined,
  };

  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    sessionStorage.clear();
    swrResponses = {};
    searchParamsString = '';
    pathname = '/';
  });

  it('turns on the session bootstrap before the first fetch', async () => {
    const { enableSessionBootstrap } = await import('@/hooks/swr/api-client');
    userState = loadingUser;

    renderProvider();

    expect(enableSessionBootstrap).toHaveBeenCalled();
  });

  it.each(['ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK'])(
    'sends a %s on /users/me to the network error page, not to /connect',
    async (code) => {
      userState = { ...loadingUser, isLoading: false, error: { code } };

      renderProvider();

      await waitFor(() => {
        expect(push).toHaveBeenCalledWith('/not-found?status=network');
      });
      expect(replace).not.toHaveBeenCalled();
    },
  );

  it('puts a delayed reload link to the same URL under the boot spinner', () => {
    pathname = '/automations';
    searchParamsString = 'tab=active';
    userState = loadingUser;

    const { getByText, queryByText } = render(
      <AuthProvider reloadLabel="reload">
        <div>console</div>
      </AuthProvider>,
    );

    const link = getByText('reload');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/automations?tab=active');
    expect(link.className).toContain('reveal-after-delay');
    expect(queryByText('console')).toBeNull();
  });

  it('renders no reload link when no label is passed', () => {
    userState = loadingUser;

    const { container } = renderProvider();

    expect(container.querySelector('a')).toBeNull();
  });
});
