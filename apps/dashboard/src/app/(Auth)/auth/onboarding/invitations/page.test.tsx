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
});
