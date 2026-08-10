import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

const usePermissionsMock = vi.fn();
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => usePermissionsMock() }));

const useWorkspacesMock = vi.fn();
vi.mock('@/hooks/useWorkspaces', () => ({ useWorkspaces: () => useWorkspacesMock() }));

const useSubscriptionStoreMock = vi.fn();
vi.mock('@/store/subscriptionStore', () => ({
  useSubscriptionStore: () => useSubscriptionStoreMock(),
}));

vi.mock('@/components/Connect/SetupInstagramDialog', () => ({
  SetupInstagramDialog: ({ open }: any) => (open ? <div>setup-dialog-open</div> : null),
}));

// Stands in for the real accounts list, which owns the count the page gates on.
// `accountCount` is the value it reports; `null` means "still loading".
vi.mock('@/components/Settings/InstagramAccounts', async () => {
  const { useEffect } = await import('react');
  return {
    InstagramAccounts: ({ onCountChange }: any) => {
      useEffect(() => {
        onCountChange?.(accountCount);
      }, []);
      return <div>instagram-accounts</div>;
    },
  };
});

import Page from './page';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';

/** Reported by the mocked accounts list. Set per test before rendering. */
let accountCount: number | null = 0;

/** Minimal Subscription shape the gate actually reads. */
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
      <Page />
    </NextIntlClientProvider>,
  );

const addButton = () => screen.getByText(messages.Settings.Accounts.addAccount).closest('button');
const addLink = () => screen.getByText(messages.Settings.Accounts.addAccount).closest('a');

/** Workspace with unused coverage — the state an unbound paid plan also produces. */
const withSlot = (hasAvailableSubscriptionSlot: boolean) =>
  useWorkspacesMock.mockReturnValue({
    workspaces: [{ id: 'ws1', name: 'Acme', hasAvailableSubscriptionSlot }],
    isLoading: false,
  });

describe('Settings › Instagram — add-account gate', () => {
  beforeEach(() => {
    accountCount = 0;
    usePermissionsMock.mockReset().mockReturnValue({
      workspaceId: 'ws1',
      can: () => true,
      isLoading: false,
    });
    withSlot(false);
    useSubscriptionStoreMock.mockReset().mockReturnValue({ subscriptions: [], isLoading: false });
  });

  it('sends a workspace connecting its first account straight to /connect', () => {
    accountCount = 0;

    renderPage();

    expect(addLink()).toHaveAttribute('href', '/connect');
    expect(screen.queryByText('setup-dialog-open')).not.toBeInTheDocument();
  });

  it('opens the subscription guard for a second account with no available slot', () => {
    accountCount = 1;
    withSlot(false);

    renderPage();

    // Not a link any more — the button has to run the guard first.
    expect(addLink()).toBeNull();
    expect(addButton()).not.toBeDisabled();

    fireEvent.click(addButton()!);
    expect(screen.getByText('setup-dialog-open')).toBeInTheDocument();
  });

  it('opens the guard for a second account when an unbound paid plan exists, instead of linking to /connect', () => {
    accountCount = 1;
    // An unbound plan is exactly what makes this flag true, and the flag is tier-blind —
    // it cannot know the plan fits the page being added, so the dialog must decide.
    withSlot(true);
    useSubscriptionStoreMock.mockReturnValue({ subscriptions: [sub()], isLoading: false });

    renderPage();

    expect(addLink()).toBeNull();

    fireEvent.click(addButton()!);
    expect(screen.getByText('setup-dialog-open')).toBeInTheDocument();
  });

  it('links straight to /connect when the only coverage is credit, which can never mismatch', () => {
    accountCount = 1;
    withSlot(true);
    useSubscriptionStoreMock.mockReturnValue({
      subscriptions: [sub({ type: 'credit' })],
      isLoading: false,
    });

    renderPage();

    expect(addLink()).toHaveAttribute('href', '/connect');
  });

  it('ignores a paid plan already bound to a page', () => {
    accountCount = 1;
    withSlot(true);
    useSubscriptionStoreMock.mockReturnValue({
      subscriptions: [sub({ instagramId: 'ig1' })],
      isLoading: false,
    });

    renderPage();

    expect(addLink()).toHaveAttribute('href', '/connect');
  });

  it('never gates the first account, even while an unbound plan is sitting unused', () => {
    accountCount = 0;
    withSlot(true);
    useSubscriptionStoreMock.mockReturnValue({ subscriptions: [sub()], isLoading: false });

    renderPage();

    expect(addLink()).toHaveAttribute('href', '/connect');
  });
});

describe('Settings › Instagram — the button waits for what it gates on', () => {
  beforeEach(() => {
    accountCount = 0;
    usePermissionsMock.mockReset().mockReturnValue({
      workspaceId: 'ws1',
      can: () => true,
      isLoading: false,
    });
    withSlot(false);
    useSubscriptionStoreMock.mockReset().mockReturnValue({ subscriptions: [], isLoading: false });
  });

  it('stays disabled while the account count is still unknown', () => {
    // A loading list reporting 0 would read as "first account" — the one answer that
    // skips every check — and hand the user a live /connect link past the guard.
    accountCount = null;

    renderPage();

    expect(addButton()).toBeDisabled();
    expect(addLink()).toBeNull();
  });

  it('stays disabled while the workspace list is still loading', () => {
    accountCount = 1;
    useWorkspacesMock.mockReturnValue({ workspaces: [], isLoading: true });

    renderPage();

    expect(addButton()).toBeDisabled();
    expect(addLink()).toBeNull();
  });

  it('stays disabled while subscriptions are still loading', () => {
    accountCount = 1;
    withSlot(true);
    useSubscriptionStoreMock.mockReturnValue({ subscriptions: [], isLoading: true });

    renderPage();

    expect(addButton()).toBeDisabled();
    expect(addLink()).toBeNull();
  });
});

describe('Settings › Instagram — limits and permissions still win', () => {
  beforeEach(() => {
    accountCount = 0;
    usePermissionsMock.mockReset().mockReturnValue({
      workspaceId: 'ws1',
      can: () => true,
      isLoading: false,
    });
    withSlot(false);
    useSubscriptionStoreMock.mockReset().mockReturnValue({ subscriptions: [], isLoading: false });
  });

  it('disables the button at the 5-account limit', () => {
    accountCount = 5;

    renderPage();

    expect(addButton()).toBeDisabled();
    expect(screen.getByText(messages.Settings.Accounts.limitReached)).toBeInTheDocument();
  });

  it('disables the button for a member without instagram:manage', () => {
    accountCount = 1;
    usePermissionsMock.mockReturnValue({
      workspaceId: 'ws1',
      can: (slug: string) => slug === 'instagram:view',
      isLoading: false,
    });

    renderPage();

    expect(addButton()).toBeDisabled();
    expect(addLink()).toBeNull();
  });

  it('hides the button entirely for a member without instagram:view', () => {
    usePermissionsMock.mockReturnValue({
      workspaceId: 'ws1',
      can: () => false,
      isLoading: false,
    });

    renderPage();

    expect(screen.queryByText(messages.Settings.Accounts.addAccount)).not.toBeInTheDocument();
    expect(
      screen.getByText(messages.Settings.Accounts.permission_denied_title),
    ).toBeInTheDocument();
  });
});
