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

vi.mock('@/hooks/useUser', () => ({
  default: () => ({
    user: { firstname: 'نوید', lastname: 'طهرانی', mobile: '09123456789', email: null },
  }),
}));

const logout = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/swr/api-client', () => ({
  useLogout: () => logout,
}));

vi.mock('@/store/subscriptionStore', () => ({
  useSubscriptionStore: Object.assign(vi.fn(), {
    getState: () => ({
      setSubscriptions: vi.fn(),
      setPlans: vi.fn(),
      setPlansData: vi.fn(),
    }),
  }),
}));

vi.mock('@/components/Settings/PageCoverageBadge', () => ({
  PageCoverageBadge: ({ instagramId }: { instagramId: string }) => (
    <div data-testid={`coverage-${instagramId}`} />
  ),
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
      {
        id: 'ws-2',
        name: 'استودیو مد و لباس زنو',
        ownerId: 'u1',
        isPersonal: false,
        category: null,
        instagrams: [
          { id: 'ig-2', username: 'zenofashion.ir', isIgTokenValid: false, profilePicture: null },
        ],
      },
    ];
  });

  it('renders the profile name and mobile', () => {
    renderContent();
    expect(screen.getByText('نوید طهرانی')).toBeInTheDocument();
    expect(screen.getByText('09123456789')).toBeInTheDocument();
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

  it('navigates to /connect and closes when the add-page button is clicked', () => {
    const { onClose } = renderContent();
    fireEvent.click(screen.getByText(messages.Console.WorkspaceDrawer.addPage));
    expect(push).toHaveBeenCalledWith('/connect');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('navigates to /settings and closes when the pencil edit button is clicked', () => {
    const { onClose } = renderContent();
    fireEvent.click(screen.getByLabelText(messages.Console.WorkspaceDrawer.editProfile));
    expect(push).toHaveBeenCalledWith('/settings');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close (X) button is clicked', () => {
    const { onClose } = renderContent();
    fireEvent.click(screen.getByLabelText(messages.Console.WorkspaceDrawer.close));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
