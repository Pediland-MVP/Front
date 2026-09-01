import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';
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

// Mutable so a test can put the router on another route — the automations parent
// is a Collapsible, and Radix does not mount its children while it is closed.
const routerMock = vi.hoisted(() => ({ pathname: '/settings/workspace' }));
vi.mock('next/navigation', () => ({ usePathname: () => routerMock.pathname }));

vi.mock('@/hooks/useUser', () => ({
  default: () => ({ user: null, error: null, isLoading: false }),
}));

const useInvitationsMock = vi.fn();
vi.mock('@/hooks/useInvitations', () => ({ useInvitations: () => useInvitationsMock() }));

const useIsWebViewMock = vi.fn();
vi.mock('@/hooks/useIsWebView', () => ({ useIsWebView: () => useIsWebViewMock() }));

const usePermissionsMock = vi.fn();
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => usePermissionsMock() }));

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
    // Default: normal browser, allowed to buy — the "buySubscription" sub-item should be
    // visible under this baseline.
    useIsWebViewMock.mockReset().mockReturnValue(false);
    usePermissionsMock.mockReset().mockReturnValue({ can: () => true });
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

  it('hides the buy-subscription sub-item without billing:view permission', () => {
    usePermissionsMock.mockReturnValue({
      can: (permission: string) => permission !== 'billing:view',
    });
    renderSidebar();
    expect(screen.queryByRole('link', { name: new RegExp(sidebar.buySubscription) })).toBeNull();
  });
});

describe('ConsoleSidebar — automations parent (پیام خوش‌آمدگویی)', () => {
  beforeEach(() => {
    useInvitationsMock.mockReset().mockReturnValue({ pendingCount: 0, isLoading: false });
    useIsWebViewMock.mockReset().mockReturnValue(false);
    usePermissionsMock.mockReset().mockReturnValue({ can: () => true });
    useSubscriptionStoreMock.mockReset().mockReturnValue({
      subscriptions: [{ status: 'active', type: 'plan' }],
    });
    // Ice breakers live at /automations/welcome, which opens the automations
    // parent so its sub-items are actually mounted.
    routerMock.pathname = '/automations/welcome';
  });

  afterEach(() => {
    routerMock.pathname = '/settings/workspace';
  });

  it('renders the automations list and the welcome message as sub-items', () => {
    renderSidebar();

    // The old flat entry became a collapsible parent; the children are the links.
    const automationsLink = screen.getByRole('link', {
      name: new RegExp(`^${sidebar.automations}$`),
    });
    expect(automationsLink.getAttribute('href')).toBe('/automations');

    const welcomeLink = screen.getByRole('link', {
      name: new RegExp(sidebar.welcomeMessage),
    });
    expect(welcomeLink.getAttribute('href')).toBe('/automations/welcome');
  });

  it('gives both automations sub-items an icon', () => {
    renderSidebar();

    for (const label of [`^${sidebar.automations}$`, sidebar.welcomeMessage]) {
      const link = screen.getByRole('link', { name: new RegExp(label) });
      expect(link.querySelector('svg')).not.toBeNull();
    }
  });

  it('marks only the welcome sub-item active on /automations/welcome', () => {
    renderSidebar();

    // NavMain matches sub-items with `startsWith` unless `exact` is set, so
    // without `exact: true` on the /automations child BOTH rows would highlight.
    const automationsLink = screen.getByRole('link', {
      name: new RegExp(`^${sidebar.automations}$`),
    });
    const welcomeLink = screen.getByRole('link', {
      name: new RegExp(sidebar.welcomeMessage),
    });

    // Both states carry `text-primary` (the inactive one only as a hover/active
    // variant), so `text-secondary` is the reliable "not selected" marker.
    expect(welcomeLink.className).not.toMatch(/text-secondary/);
    expect(automationsLink.className).toMatch(/text-secondary/);
  });
});
