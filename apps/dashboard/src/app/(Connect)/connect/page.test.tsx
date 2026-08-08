import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/hooks/swr/api-client', () => ({ useLogout: () => vi.fn(), default: {} }));
vi.mock('@/hooks/useConnectInstagram', () => ({
  default: () => ({ callbackIG: vi.fn(), isCallbackIGLoading: false }),
}));
vi.mock('@/hooks/useWorkspaces', () => ({ useWorkspaces: () => ({ workspaces: [] }) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ workspaceId: 'ws1', can: () => true, isLoading: false }),
}));
vi.mock('@components/Connect/HowToConnectDialog', () => ({ HowToConnectDialog: () => null }));
vi.mock('@/components/Console/WorkspaceSwitcherDialog', () => ({
  WorkspaceSwitcherDialog: () => null,
}));
vi.mock('@/components/Global/HelpMeDialog', () => ({
  HelpMeDialog: ({ children }: any) => children,
}));
vi.mock('@/components/Connect/SetupInstagramDialog', () => ({
  SetupInstagramDialog: ({ open }: any) => (open ? <div>setup-dialog-open</div> : null),
}));

const useUserMock = vi.fn();
vi.mock('@/hooks/useUser', () => ({ default: () => useUserMock() }));

import ConnectPage from './page';

const renderPage = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ConnectPage />
    </NextIntlClientProvider>,
  );

describe('ConnectPage — second Instagram subscription gate', () => {
  beforeEach(() => {
    push.mockReset();
  });

  it('shows the subscription setup CTA instead of the raw connect link for a 2nd account with no available slot', () => {
    useUserMock.mockReturnValue({
      user: { instagrams: [{ id: 'ig1' }], mobile: '0912' },
      hasInstagram: true,
      canConnectInstagram: true,
      hasAvailableSubscriptionSlot: false,
    });

    renderPage();

    expect(screen.getByText(messages.Connect.setup_second_instagram_cta)).toBeInTheDocument();
    expect(screen.queryByText(messages.Connect.connect_account)).not.toBeInTheDocument();
  });

  it('shows the normal connect link when the workspace already has an available subscription slot', () => {
    useUserMock.mockReturnValue({
      user: { instagrams: [{ id: 'ig1' }], mobile: '0912' },
      hasInstagram: true,
      canConnectInstagram: true,
      hasAvailableSubscriptionSlot: true,
    });

    renderPage();

    expect(screen.getByText(messages.Connect.connect_account)).toBeInTheDocument();
    expect(screen.queryByText(messages.Connect.setup_second_instagram_cta)).not.toBeInTheDocument();
  });

  it("shows the normal connect link for a workspace's first account regardless of subscription slot", () => {
    useUserMock.mockReturnValue({
      user: { instagrams: [], mobile: '0912' },
      hasInstagram: false,
      canConnectInstagram: true,
      hasAvailableSubscriptionSlot: false,
    });

    renderPage();

    expect(screen.getByText(messages.Connect.connect_account)).toBeInTheDocument();
  });

  it('shows a reminder for the pending username and clears the cookie after reading it', () => {
    document.cookie = 'pending_ig_username=befroosh; path=/';
    useUserMock.mockReturnValue({
      user: { instagrams: [{ id: 'ig1' }], mobile: '0912' },
      hasInstagram: true,
      canConnectInstagram: true,
      hasAvailableSubscriptionSlot: true,
    });

    renderPage();

    const expectedText = messages.Connect.pending_username_reminder.replace(
      '{username}',
      'befroosh',
    );
    expect(screen.getByText(expectedText)).toBeInTheDocument();
    expect(document.cookie).not.toContain('pending_ig_username=befroosh');
  });
});
