import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

const usePermissionsMock = vi.fn();
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => usePermissionsMock() }));

const useWorkspacesMock = vi.fn();
vi.mock('@/hooks/useWorkspaces', () => ({ useWorkspaces: () => useWorkspacesMock() }));

const useInvitationsMock = vi.fn();
vi.mock('@/hooks/useInvitations', () => ({ useInvitations: () => useInvitationsMock() }));

vi.mock('@/hooks/useWorkspaceCategories', () => ({
  useWorkspaceCategories: () => ({ categories: [], isLoading: false }),
}));

// The page's job is composition — stub the leaf widgets and assert they are mounted
// (and gated) rather than re-testing their internals, which have their own suites.
vi.mock('@/components/Settings/WorkspaceForm', () => ({
  WorkspaceForm: () => <div>workspace-form</div>,
}));
vi.mock('@/components/Settings/WorkspaceCategoryForm', () => ({
  WorkspaceCategoryForm: () => <div>workspace-category-form</div>,
}));
vi.mock('@/components/Settings/IncomingTransferBanner', () => ({
  IncomingTransferBanner: () => <div>incoming-transfer-banner</div>,
}));
vi.mock('@/components/Settings/PendingTransferNotice', () => ({
  PendingTransferNotice: () => <div>pending-transfer-notice</div>,
}));
vi.mock('@/components/Settings/TransferOwnershipDialog', () => ({
  TransferOwnershipDialog: ({ isOpen }: any) => (isOpen ? <div>transfer-dialog</div> : null),
}));
vi.mock('@/components/Settings/WorkspaceDeleteDialog', () => ({
  WorkspaceDeleteDialog: ({ isOpen }: any) => (isOpen ? <div>delete-dialog</div> : null),
}));

import Page from './page';

const renderPage = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <Page />
    </NextIntlClientProvider>,
  );

/** Owner of a non-personal workspace — the fullest set of controls. */
const asOwner = () => {
  usePermissionsMock.mockReturnValue({
    workspaceId: 'ws1',
    userId: 'u1',
    can: () => true,
    isLoading: false,
  });
  useWorkspacesMock.mockReturnValue({
    workspaces: [{ id: 'ws1', name: 'Acme', ownerId: 'u1', isPersonal: false, category: null }],
    isLoading: false,
    mutate: vi.fn(),
    changeWorkspace: vi.fn(),
  });
};

describe('Settings › Workspace page', () => {
  beforeEach(() => {
    usePermissionsMock.mockReset();
    useWorkspacesMock.mockReset();
    useInvitationsMock.mockReset().mockReturnValue({ pendingCount: 0, isLoading: false });
    asOwner();
  });

  it('renders the rename and category forms', () => {
    renderPage();
    expect(screen.getByText('workspace-form')).toBeInTheDocument();
    expect(screen.getByText('workspace-category-form')).toBeInTheDocument();
  });

  it('shows the danger zone with the full transfer-ownership label for the owner', () => {
    renderPage();
    expect(screen.getByText(messages.Settings.Workspace.danger_zone)).toBeInTheDocument();
    expect(
      screen.getByText(messages.Settings.Workspace.transfer_ownership_button),
    ).toBeInTheDocument();
  });

  it('hides ownership transfer and delete from a non-owner', () => {
    usePermissionsMock.mockReturnValue({
      workspaceId: 'ws1',
      userId: 'someone-else',
      can: () => true,
      isLoading: false,
    });
    renderPage();

    expect(
      screen.queryByText(messages.Settings.Workspace.transfer_ownership_button),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(messages.Settings.Workspace.delete_button)).not.toBeInTheDocument();
  });

  it('hides the invitations banner when nothing is pending', () => {
    renderPage();
    expect(screen.queryByText(messages.Settings.Workspace.view)).not.toBeInTheDocument();
  });

  it('shows the invitations banner when invitations are pending', () => {
    useInvitationsMock.mockReturnValue({ pendingCount: 2, isLoading: false });
    renderPage();
    // Assert on the banner's own "view" link rather than the interpolated count —
    // next-intl renders `{count}` with Persian digits under the fa locale.
    expect(screen.getByText(messages.Settings.Workspace.view)).toBeInTheDocument();
  });

  it('renders a spinner while workspaces are loading', () => {
    useWorkspacesMock.mockReturnValue({
      workspaces: [],
      isLoading: true,
      mutate: vi.fn(),
      changeWorkspace: vi.fn(),
    });
    renderPage();
    expect(screen.queryByText('workspace-form')).not.toBeInTheDocument();
  });
});
