import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import faMessages from '@/messages/fa.json';
import faAuth from '@/messages/fa/Auth.json';
import OnboardingInvitationsPage from './page';

const messages = { ...faMessages, ...faAuth };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

let userState: any = {};
vi.mock('@/hooks/useUser', () => ({
  default: () => userState,
}));

vi.mock('@/hooks/swr/api-client', () => ({
  default: { post: vi.fn() },
  fetcher: vi.fn(),
  setAccessToken: vi.fn(),
}));

// Real backend shape: PaginatedResult -> { items, meta }, not { data } (see
// Back/apps/core/src/common/classes/paginatedResult.ts). This is the exact response
// the user hit in production: the picker showed "no pending invitations" even though
// the API genuinely returned one, because the page parsed `.data` instead of `.items`.
let swrResponses: Record<string, { data: unknown; isLoading: boolean }> = {};
vi.mock('swr', () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, isLoading: false };
    return swrResponses[key] ?? { data: undefined, isLoading: false };
  },
  useSWRConfig: () => ({ mutate: vi.fn() }),
}));

function renderPage() {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OnboardingInvitationsPage />
    </NextIntlClientProvider>,
  );
}

describe('OnboardingInvitationsPage', () => {
  beforeEach(() => {
    swrResponses = {};
    userState = {
      mutate: vi.fn(),
      isOnboarding: true,
      user: { mobile: '09123456789', email: null },
    };
  });

  it('renders the real pending invitation instead of the empty state', () => {
    swrResponses['/invitations/pending'] = {
      data: {
        items: [
          {
            id: 'inv-1',
            workspace: { id: 'ws-1', name: 'تستی' },
            inviter: { firstname: 'سینا', lastname: 'پیران' },
            status: 'pending',
            message: null,
            permissions: ['product:view', 'team:invite'],
          },
        ],
        meta: { totalItems: 1 },
      },
      isLoading: false,
    };

    renderPage();

    expect(screen.getByText('تستی')).toBeInTheDocument();
    expect(screen.queryByText(messages.Auth.Invitations.no_invitations)).not.toBeInTheDocument();
  });

  it('shows the empty state only when there really are no pending invitations', () => {
    swrResponses['/invitations/pending'] = {
      data: { items: [], meta: { totalItems: 0 } },
      isLoading: false,
    };

    renderPage();

    expect(screen.getByText(messages.Auth.Invitations.no_invitations)).toBeInTheDocument();
  });

  it('renders a single invitation as a non-clickable confirmation, not a pick-one radio list', () => {
    swrResponses['/invitations/pending'] = {
      data: {
        items: [
          {
            id: 'inv-1',
            workspace: { id: 'ws-1', name: 'تستی' },
            inviter: { firstname: 'سینا', lastname: 'پیران' },
            status: 'pending',
            message: null,
            permissions: ['product:view'],
          },
        ],
        meta: { totalItems: 1 },
      },
      isLoading: false,
    };

    const { container } = renderPage();

    // Singular copy, not the plural "you have invitations" title.
    expect(screen.getByText(messages.Auth.Invitations.title_single)).toBeInTheDocument();
    expect(
      screen.getByText(messages.Auth.Invitations.description_single.replace('{workspace}', 'تستی')),
    ).toBeInTheDocument();
    // No radio input — there's nothing to choose between.
    expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(0);
  });

  it('renders multiple invitations as a selectable radio list', () => {
    swrResponses['/invitations/pending'] = {
      data: {
        items: [
          {
            id: 'inv-1',
            workspace: { id: 'ws-1', name: 'تستی' },
            inviter: { firstname: 'سینا', lastname: 'پیران' },
            status: 'pending',
            message: null,
            permissions: ['product:view'],
          },
          {
            id: 'inv-2',
            workspace: { id: 'ws-2', name: 'دومی' },
            inviter: { firstname: 'رضا', lastname: 'محمدی' },
            status: 'pending',
            message: null,
            permissions: ['team:invite'],
          },
        ],
        meta: { totalItems: 2 },
      },
      isLoading: false,
    };

    const { container } = renderPage();

    expect(screen.getByText(messages.Auth.Invitations.title)).toBeInTheDocument();
    expect(screen.getByText('تستی')).toBeInTheDocument();
    expect(screen.getByText('دومی')).toBeInTheDocument();
    expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(2);
  });

  it("shows the signed-in user's mobile so they can confirm it's the right account", () => {
    userState.user = { mobile: '09123456789', email: null };
    swrResponses['/invitations/pending'] = {
      data: {
        items: [
          {
            id: 'inv-1',
            workspace: { id: 'ws-1', name: 'تستی' },
            inviter: { firstname: 'سینا', lastname: 'پیران' },
            status: 'pending',
            message: null,
            permissions: ['product:view'],
          },
        ],
        meta: { totalItems: 1 },
      },
      isLoading: false,
    };

    renderPage();

    expect(screen.getByText('09123456789')).toBeInTheDocument();
  });

  it('falls back to email when the user has no mobile on file', () => {
    userState.user = { mobile: null, email: 'sina@example.com' };
    swrResponses['/invitations/pending'] = {
      data: {
        items: [
          {
            id: 'inv-1',
            workspace: { id: 'ws-1', name: 'تستی' },
            inviter: { firstname: 'سینا', lastname: 'پیران' },
            status: 'pending',
            message: null,
            permissions: ['product:view'],
          },
        ],
        meta: { totalItems: 1 },
      },
      isLoading: false,
    };

    renderPage();

    expect(screen.getByText('sina@example.com')).toBeInTheDocument();
    expect(screen.queryByText('09123456789')).not.toBeInTheDocument();
  });
});
