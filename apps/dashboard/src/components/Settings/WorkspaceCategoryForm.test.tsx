import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

const patchMock = vi.fn();
vi.mock('@/hooks/swr/api-client', () => ({
  default: { patch: (...args: unknown[]) => patchMock(...args) },
}));

const mutateMock = vi.fn();
const useWorkspacesMock = vi.fn();
vi.mock('@/hooks/useWorkspaces', () => ({ useWorkspaces: () => useWorkspacesMock() }));

const usePermissionsMock = vi.fn();
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => usePermissionsMock() }));

const useWorkspaceCategoriesMock = vi.fn();
vi.mock('@/hooks/useWorkspaceCategories', () => ({
  useWorkspaceCategories: () => useWorkspaceCategoriesMock(),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { WorkspaceCategoryForm } from './WorkspaceCategoryForm';

const renderForm = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <WorkspaceCategoryForm />
    </NextIntlClientProvider>,
  );

describe('WorkspaceCategoryForm', () => {
  beforeEach(() => {
    patchMock.mockReset().mockResolvedValue({ status: 200 });
    mutateMock.mockReset();
    usePermissionsMock.mockReset().mockReturnValue({
      workspaceId: 'ws1',
      can: () => true,
      isLoading: false,
    });
    // The workspace exposes its category as a nested object, not a flat id.
    useWorkspacesMock.mockReset().mockReturnValue({
      workspaces: [
        { id: 'ws1', name: 'Acme', category: { id: 'cat-2', nameEn: 'Food', nameFa: 'غذا' } },
      ],
      isLoading: false,
      mutate: mutateMock,
    });
    useWorkspaceCategoriesMock.mockReset().mockReturnValue({
      categories: [
        { id: 'cat-1', nameEn: 'Retail', nameFa: 'خرده‌فروشی' },
        { id: 'cat-2', nameEn: 'Food', nameFa: 'غذا' },
      ],
      isLoading: false,
    });
  });

  it("preselects the workspace's current category", async () => {
    renderForm();
    // Radix Select renders the chosen item's text inside the trigger.
    await waitFor(() => expect(screen.getByText('غذا')).toBeInTheDocument());
  });

  it('submits the selected category id via PATCH', async () => {
    renderForm();

    fireEvent.click(screen.getByText(messages.Settings.Workspace.save));

    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith('/workspaces/ws1', { categoryId: 'cat-2' }),
    );
    expect(mutateMock).toHaveBeenCalled();
  });

  it('disables the control when the user cannot manage the team', async () => {
    usePermissionsMock.mockReturnValue({
      workspaceId: 'ws1',
      can: () => false,
      isLoading: false,
    });
    renderForm();

    expect(screen.getByText(messages.Settings.Workspace.save).closest('button')).toBeDisabled();
  });
});
