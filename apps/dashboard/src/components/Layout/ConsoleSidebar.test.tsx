import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';
import consoleMessages from '@/messages/fa/Console.json';

// SidebarProvider uses `useMediaQuery`, which calls `matchMedia` — jsdom doesn't implement it.
// Same shim as NavMain.test.tsx, needed here too since ConsoleSidebar renders SidebarContent.
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList);
});

vi.mock('next/navigation', () => ({ usePathname: () => '/settings/workspace' }));

vi.mock('@/hooks/useUser', () => ({
  default: () => ({ user: null, error: null, isLoading: false }),
}));

const useInvitationsMock = vi.fn();
vi.mock('@/hooks/useInvitations', () => ({ useInvitations: () => useInvitationsMock() }));

const useIsWebViewMock = vi.fn();
vi.mock('@/hooks/useIsWebView', () => ({ useIsWebView: () => useIsWebViewMock() }));

const usePermissionsMock = vi.fn();
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => usePermissionsMock() }));

const useSubscriptionStoreMock = vi.fn();
vi.mock('@/store/subscriptionStore', () => ({
  useSubscriptionStore: () => useSubscriptionStoreMock(),
}));

vi.mock('./WorkspaceProfileChip', () => ({
  WorkspaceProfileChip: () => <div>workspace-chip</div>,
}));
vi.mock('./UserDetailsCard', () => ({ UserDetailsCard: () => <div>user-card</div> }));

import { SidebarProvider } from '@/components/ui/sidebar';
import { ConsoleSidebar } from './ConsoleSidebar';

const sidebar = consoleMessages.Console.Sidebar;

const renderSidebar = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={{ ...messages, ...consoleMessages }}>
      <SidebarProvider>
        <ConsoleSidebar />
      </SidebarProvider>
    </NextIntlClientProvider>,
  );

describe('ConsoleSidebar — settings sub-items', () => {
  beforeEach(() => {
    useInvitationsMock.mockReset().mockReturnValue({ pendingCount: 0, isLoading: false });
    // Default: normal browser, has a paid (non-credit) subscription, allowed to buy —
    // the "buySubscription" sub-item should be visible under this baseline.
    useIsWebViewMock.mockReset().mockReturnValue(false);
    usePermissionsMock.mockReset().mockReturnValue({ can: () => true });
    useSubscriptionStoreMock.mockReset().mockReturnValue({
      subscriptions: [{ status: 'active', type: 'plan' }],
    });
  });

  it('lists the five settings sub-items in the required order', () => {
    renderSidebar();

    const expected = [
      sidebar.businessInfo,
      sidebar.connectedPages,
      sidebar.buySubscription,
      sidebar.teamMembers,
      sidebar.bankInfo,
    ];
    const links = expected.map((label) => screen.getByRole('link', { name: new RegExp(label) }));

    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/settings/workspace',
      '/settings/instagram',
      '/settings/subscription',
      '/settings/team',
      '/settings/card',
    ]);
  });

  it('gives every settings sub-item an icon', () => {
    renderSidebar();

    for (const label of [
      sidebar.businessInfo,
      sidebar.connectedPages,
      sidebar.buySubscription,
      sidebar.teamMembers,
      sidebar.bankInfo,
    ]) {
      const link = screen.getByRole('link', { name: new RegExp(label) });
      expect(link.querySelector('svg')).not.toBeNull();
    }
  });

  it('no longer renders the old top-level workspace and accounts entries', () => {
    renderSidebar();

    // Anchored exact match: `sidebar.workspace` ("کسب‌وکار") is a substring of the new
    // `sidebar.businessInfo` label ("اطلاعات کسب‌وکار"), so an unanchored regex would also
    // match the new sub-item link and produce a false pass/fail here.
    expect(screen.queryByRole('link', { name: new RegExp(`^${sidebar.workspace}$`) })).toBeNull();
    expect(screen.queryByRole('link', { name: new RegExp(sidebar.accounts) })).toBeNull();
  });

  it('carries the pending-invitations badge on the business info sub-item', () => {
    useInvitationsMock.mockReturnValue({ pendingCount: 2, isLoading: false });
    renderSidebar();

    const link = screen.getByRole('link', { name: new RegExp(sidebar.businessInfo) });
    expect(link.querySelector('[data-testid="nav-sub-badge"]')).not.toBeNull();
  });

  it('shows the buy-subscription sub-item in the normal case', () => {
    renderSidebar();
    expect(
      screen.queryByRole('link', { name: new RegExp(sidebar.buySubscription) }),
    ).not.toBeNull();
  });

  it('hides the buy-subscription sub-item inside the webview', () => {
    useIsWebViewMock.mockReturnValue(true);
    renderSidebar();
    expect(screen.queryByRole('link', { name: new RegExp(sidebar.buySubscription) })).toBeNull();
  });

  it('hides the buy-subscription sub-item when the workspace only has free credit', () => {
    useSubscriptionStoreMock.mockReturnValue({
      subscriptions: [{ status: 'active', type: 'credit' }],
    });
    renderSidebar();
    expect(screen.queryByRole('link', { name: new RegExp(sidebar.buySubscription) })).toBeNull();
  });

  it('hides the buy-subscription sub-item without billing:view permission', () => {
    usePermissionsMock.mockReturnValue({
      can: (permission: string) => permission !== 'billing:view',
    });
    renderSidebar();
    expect(screen.queryByRole('link', { name: new RegExp(sidebar.buySubscription) })).toBeNull();
  });
});
