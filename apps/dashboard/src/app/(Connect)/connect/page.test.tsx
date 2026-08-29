import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

const push = vi.fn();
const searchParamsMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => searchParamsMock(),
}));
vi.mock('@/hooks/swr/api-client', () => ({ useLogout: () => vi.fn(), default: {} }));
vi.mock('@/hooks/useConnectInstagram', () => ({
  default: () => ({ callbackIG: vi.fn(), isCallbackIGLoading: false }),
}));
const useWorkspacesMock = vi.fn();
vi.mock('@/hooks/useWorkspaces', () => ({ useWorkspaces: () => useWorkspacesMock() }));
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

const useSubscriptionStoreMock = vi.fn();
vi.mock('@/store/subscriptionStore', () => ({
  useSubscriptionStore: () => useSubscriptionStoreMock(),
}));

import ConnectPage from './page';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';

/** Minimal Subscription shape the page actually reads. */
const sub = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    id: 'sub1',
    status: SubscriptionStatusEnum.ACTIVE,
    type: 'time',
    instagramId: null,
    planDuration: { name: 'شش ماهه', plan: { name: '۱K تا ۲۵K فالوور' } },
    ...over,
  }) as never;

const renderPage = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ConnectPage />
    </NextIntlClientProvider>,
  );

describe('ConnectPage — second Instagram subscription gate', () => {
  beforeEach(() => {
    push.mockReset();
    searchParamsMock.mockReset().mockReturnValue(new URLSearchParams());
    useWorkspacesMock.mockReturnValue({ workspaces: [] });
    useSubscriptionStoreMock.mockReturnValue({ subscriptions: [] });
  });

  it('shows the subscription setup CTA instead of the raw connect link for a 2nd account with no available slot', () => {
    useUserMock.mockReturnValue({
      user: { instagrams: [{ id: 'ig1' }], mobile: '0912' },
      hasInstagram: true,
      canConnectInstagram: true,
    });
    useWorkspacesMock.mockReturnValue({
      workspaces: [{ id: 'ws1', name: 'Acme', hasAvailableSubscriptionSlot: false }],
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
    });
    useWorkspacesMock.mockReturnValue({
      workspaces: [{ id: 'ws1', name: 'Acme', hasAvailableSubscriptionSlot: true }],
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
    });
    useWorkspacesMock.mockReturnValue({
      workspaces: [{ id: 'ws1', name: 'Acme', hasAvailableSubscriptionSlot: false }],
    });

    renderPage();

    expect(screen.getByText(messages.Connect.connect_account)).toBeInTheDocument();
  });

  it('treats a missing/not-yet-loaded current workspace as no available slot (shows the setup CTA, not a crash)', () => {
    useUserMock.mockReturnValue({
      user: { instagrams: [{ id: 'ig1' }], mobile: '0912' },
      hasInstagram: true,
      canConnectInstagram: true,
    });
    useWorkspacesMock.mockReturnValue({ workspaces: [] });

    renderPage();

    expect(screen.getByText(messages.Connect.setup_second_instagram_cta)).toBeInTheDocument();
  });
});

describe('ConnectPage — unbound plan opens the dialog', () => {
  beforeEach(() => {
    push.mockReset();
    searchParamsMock.mockReset().mockReturnValue(new URLSearchParams());
    useWorkspacesMock.mockReturnValue({ workspaces: [] });
    useSubscriptionStoreMock.mockReturnValue({ subscriptions: [] });
  });

  const withSlot = () => {
    useUserMock.mockReturnValue({
      user: { instagrams: [{ id: 'ig1' }], mobile: '0912' },
      hasInstagram: true,
      canConnectInstagram: true,
    });
    useWorkspacesMock.mockReturnValue({
      workspaces: [{ id: 'ws1', name: 'Acme', hasAvailableSubscriptionSlot: true }],
    });
  };

  it('routes an unbound paid plan into the setup dialog instead of straight to OAuth', () => {
    withSlot();
    useSubscriptionStoreMock.mockReturnValue({ subscriptions: [sub()] });

    renderPage();

    expect(screen.getByText(messages.Connect.setup_second_instagram_cta)).toBeInTheDocument();
    // The lone connect button is what trapped the user in the retry loop.
    expect(screen.queryByText(messages.Connect.connect_account)).not.toBeInTheDocument();
  });

  it('keeps the plain connect link when the only coverage is credit, which can never mismatch', () => {
    withSlot();
    useSubscriptionStoreMock.mockReturnValue({ subscriptions: [sub({ type: 'credit' })] });

    renderPage();

    expect(screen.getByText(messages.Connect.connect_account)).toBeInTheDocument();
  });

  it('ignores a plan already bound to a page', () => {
    withSlot();
    useSubscriptionStoreMock.mockReturnValue({ subscriptions: [sub({ instagramId: 'ig1' })] });

    renderPage();

    expect(screen.getByText(messages.Connect.connect_account)).toBeInTheDocument();
  });
});

describe('ConnectPage — reconnect mode (relogin redirect)', () => {
  beforeEach(() => {
    push.mockReset();
    useWorkspacesMock.mockReturnValue({ workspaces: [] });
    useSubscriptionStoreMock.mockReturnValue({ subscriptions: [] });
  });

  it('shows a reconnecting message instead of the instagram-limit wall for a relogin at the account cap', () => {
    searchParamsMock.mockReturnValue(new URLSearchParams({ code: 'abc', reconnect: '1' }));
    useUserMock.mockReturnValue({
      user: { instagrams: Array.from({ length: 5 }, (_, i) => ({ id: `ig${i}` })), mobile: '0912' },
      hasInstagram: true,
      canConnectInstagram: true,
    });

    renderPage();

    expect(screen.getByText(messages.Connect.reconnecting_account)).toBeInTheDocument();
    expect(screen.queryByText(messages.Connect.instagram_limit)).not.toBeInTheDocument();
  });

  it('shows a reconnecting message instead of the setup-second-instagram CTA for a relogin with no free slot', () => {
    searchParamsMock.mockReturnValue(new URLSearchParams({ code: 'abc', reconnect: '1' }));
    useUserMock.mockReturnValue({
      user: { instagrams: [{ id: 'ig1' }], mobile: '0912' },
      hasInstagram: true,
      canConnectInstagram: true,
    });
    useWorkspacesMock.mockReturnValue({
      workspaces: [{ id: 'ws1', name: 'Acme', hasAvailableSubscriptionSlot: false }],
    });

    renderPage();

    expect(screen.getByText(messages.Connect.reconnecting_account)).toBeInTheDocument();
    expect(screen.queryByText(messages.Connect.setup_second_instagram_cta)).not.toBeInTheDocument();
  });

  it('falls back to the normal gates when reconnect=1 arrives without a code', () => {
    searchParamsMock.mockReturnValue(new URLSearchParams({ reconnect: '1' }));
    useUserMock.mockReturnValue({
      user: { instagrams: [{ id: 'ig1' }], mobile: '0912' },
      hasInstagram: true,
      canConnectInstagram: true,
    });
    useWorkspacesMock.mockReturnValue({
      workspaces: [{ id: 'ws1', name: 'Acme', hasAvailableSubscriptionSlot: true }],
    });

    renderPage();

    expect(screen.queryByText(messages.Connect.reconnecting_account)).not.toBeInTheDocument();
    expect(screen.getByText(messages.Connect.connect_account)).toBeInTheDocument();
  });

  it('does not show the reconnecting message for a plain first-time connect (code without reconnect flag)', () => {
    searchParamsMock.mockReturnValue(new URLSearchParams({ code: 'abc' }));
    useUserMock.mockReturnValue({
      user: { instagrams: [], mobile: '0912' },
      hasInstagram: false,
      canConnectInstagram: true,
    });

    renderPage();

    expect(screen.queryByText(messages.Connect.reconnecting_account)).not.toBeInTheDocument();
  });
});
