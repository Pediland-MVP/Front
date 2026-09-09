import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import faMessages from '@/messages/fa.json';
import faConsole from '@/messages/fa/Console.json';
import { WorkspaceDrawerContent } from './WorkspaceDrawerContent';

const messages = { ...faMessages, ...faConsole };

const push = vi.fn();
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

const changeWorkspace = vi.fn();
let workspacesData: unknown[] = [];
vi.mock('@/hooks/useWorkspaces', () => ({
  useWorkspaces: () => ({
    workspaces: workspacesData,
    isLoading: false,
    changeWorkspace,
    mutate: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ workspaceId: 'ws-1' }),
}));

let isWebView = false;
vi.mock('@/hooks/useIsWebView', () => ({
  useIsWebView: () => isWebView,
}));

function renderContent(onClose = vi.fn()) {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <WorkspaceDrawerContent onClose={onClose} />
    </NextIntlClientProvider>,
  );
  return { onClose };
}

describe('WorkspaceDrawerContent', () => {
  beforeEach(() => {
    push.mockClear();
    changeWorkspace.mockClear();
    isWebView = false;
    workspacesData = [
      {
        id: 'ws-1',
        name: 'کافه رستوران طهرانی',
        ownerId: 'u1',
        isPersonal: false,
        category: null,
        instagrams: [
          {
            id: 'ig-1',
            username: 'tehrani_cafe_bistro',
            isIgTokenValid: true,
            profilePicture: null,
            subscriptionDaysLeft: 54,
            hasReservedSubscription: false,
          },
        ],
      },
      {
        id: 'ws-2',
        name: 'استودیو مد و لباس زنو',
        ownerId: 'u1',
        isPersonal: false,
        category: null,
        instagrams: [
          {
            id: 'ig-2',
            username: 'zenofashion.ir',
            isIgTokenValid: false,
            profilePicture: null,
            subscriptionDaysLeft: 29,
            hasReservedSubscription: false,
          },
        ],
      },
    ];
  });

  it('shows the total connected-pages count across all workspaces', () => {
    renderContent();
    expect(
      screen.getByText(messages.Console.WorkspaceDrawer.connectedPages.replace('{count}', '2')),
    ).toBeInTheDocument();
  });

  it('renders every workspace with its own Instagram accounts', () => {
    renderContent();
    expect(screen.getByText('کافه رستوران طهرانی')).toBeInTheDocument();
    expect(screen.getByText('tehrani_cafe_bistro')).toBeInTheDocument();
    expect(screen.getByText('استودیو مد و لباس زنو')).toBeInTheDocument();
    expect(screen.getByText('zenofashion.ir')).toBeInTheDocument();
  });

  it('marks a disconnected account with the disconnected label', () => {
    renderContent();
    expect(screen.getByText(messages.Console.WorkspaceDrawer.disconnected)).toBeInTheDocument();
  });

  it('shows remaining subscription days for every workspace, not just the active one', () => {
    renderContent();
    // ws-1 (active) and ws-2 (not active) both come from the backend now, so both show their own days.
    expect(
      screen.getByText(messages.Console.WorkspaceDrawer.daysLeft.replace('{count}', '54')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.Console.WorkspaceDrawer.daysLeft.replace('{count}', '29')),
    ).toBeInTheDocument();
  });

  it('shows the pending-activation label when there is only a reserved (not yet active) subscription', () => {
    workspacesData = [
      {
        id: 'ws-1',
        name: 'کافه رستوران طهرانی',
        ownerId: 'u1',
        isPersonal: false,
        category: null,
        instagrams: [
          {
            id: 'ig-1',
            username: 'tehrani_cafe_bistro',
            isIgTokenValid: true,
            profilePicture: null,
            subscriptionDaysLeft: null,
            hasReservedSubscription: true,
          },
        ],
      },
    ];
    renderContent();
    expect(
      screen.getByText(messages.Console.WorkspaceDrawer.pendingActivation),
    ).toBeInTheDocument();
  });

  it('shows no subscription text when there is no active or reserved coverage', () => {
    workspacesData = [
      {
        id: 'ws-1',
        name: 'کافه رستوران طهرانی',
        ownerId: 'u1',
        isPersonal: false,
        category: null,
        instagrams: [
          {
            id: 'ig-1',
            username: 'tehrani_cafe_bistro',
            isIgTokenValid: true,
            profilePicture: null,
            subscriptionDaysLeft: null,
            hasReservedSubscription: false,
          },
        ],
      },
    ];
    renderContent();
    expect(
      screen.queryByText(messages.Console.WorkspaceDrawer.pendingActivation),
    ).not.toBeInTheDocument();
  });

  it('shows no (broken) subscription text when the backend response is missing the new fields entirely', () => {
    // Simulates Front deploying before the paired Back change: the account object has
    // no subscriptionDaysLeft/hasReservedSubscription keys at all.
    workspacesData = [
      {
        id: 'ws-1',
        name: 'کافه رستوران طهرانی',
        ownerId: 'u1',
        isPersonal: false,
        category: null,
        instagrams: [
          {
            id: 'ig-1',
            username: 'tehrani_cafe_bistro',
            isIgTokenValid: true,
            profilePicture: null,
          },
        ],
      },
    ];
    renderContent();
    expect(screen.queryByText(/اعتبار/)).not.toBeInTheDocument();
  });

  it('hides the pending-activation label inside the Android WebView', () => {
    isWebView = true;
    workspacesData = [
      {
        id: 'ws-1',
        name: 'کافه رستوران طهرانی',
        ownerId: 'u1',
        isPersonal: false,
        category: null,
        instagrams: [
          {
            id: 'ig-1',
            username: 'tehrani_cafe_bistro',
            isIgTokenValid: true,
            profilePicture: null,
            subscriptionDaysLeft: null,
            hasReservedSubscription: true,
          },
        ],
      },
    ];
    renderContent();
    expect(
      screen.queryByText(messages.Console.WorkspaceDrawer.pendingActivation),
    ).not.toBeInTheDocument();
  });

  it('still shows days-left inside the Android WebView (only the CTA-adjacent labels are gated)', () => {
    isWebView = true;
    renderContent();
    expect(
      screen.getByText(messages.Console.WorkspaceDrawer.daysLeft.replace('{count}', '54')),
    ).toBeInTheDocument();
  });

  it('switches workspace and closes the drawer when tapping an Instagram account row', () => {
    const { onClose } = renderContent();
    fireEvent.click(screen.getByText('zenofashion.ir'));
    expect(changeWorkspace).toHaveBeenCalledWith('ws-2');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('switches workspace when tapping the workspace header row too', () => {
    const { onClose } = renderContent();
    fireEvent.click(screen.getByText('استودیو مد و لباس زنو'));
    expect(changeWorkspace).toHaveBeenCalledWith('ws-2');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call changeWorkspace when tapping the already-active workspace', () => {
    renderContent();
    fireEvent.click(screen.getByText('tehrani_cafe_bistro'));
    expect(changeWorkspace).not.toHaveBeenCalled();
  });

  it('navigates to /settings/instagram with the auto-open param and closes when the add-page button is clicked', () => {
    const { onClose } = renderContent();
    fireEvent.click(screen.getByText(messages.Console.WorkspaceDrawer.addPage));
    expect(push).toHaveBeenCalledWith('/settings/instagram?openAdd=1');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close (X) button is clicked', () => {
    const { onClose } = renderContent();
    fireEvent.click(screen.getByLabelText(messages.Console.WorkspaceDrawer.close));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('never renders a logout button', () => {
    renderContent();
    expect(screen.queryByText(messages.Console.Sidebar.logout)).not.toBeInTheDocument();
  });
});
