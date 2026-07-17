import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true }),
}));
vi.mock('@/components/Automations/AutomationsCardList', () => ({
  AutomationsCardList: () => <div data-testid="automations-card-list" />,
}));
vi.mock('@/components/Automations/CreateAutomationTemplateDialog', () => ({
  CreateAutomationTemplateDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="template-dialog" /> : null,
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/utils/automationDraft', () => ({
  getCurrentWorkspaceId: vi.fn(() => 'ws-1'),
  hasAutomationDraft: vi.fn(() => false),
  clearAutomationDraft: vi.fn(),
}));

import messages from '@/messages/fa.json';
import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import { hasAutomationDraft, clearAutomationDraft } from '@/utils/automationDraft';
import Page from './page';

function HeaderButtonHost() {
  const buttons = useHeaderFeatures((s) => s.buttons);
  return <>{buttons}</>;
}

function renderPage() {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <Page />
      <HeaderButtonHost />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  (hasAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue(false);
  useHeaderFeatures.getState().reset();
});

describe('Automations list page — draft resume prompt', () => {
  it('opens the template picker directly when there is no draft', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(messages.Automations.add)).toBeInTheDocument());

    fireEvent.click(screen.getByText(messages.Automations.add));

    expect(screen.getByTestId('template-dialog')).toBeInTheDocument();
    expect(
      screen.queryByText(messages.Automations.DraftDialog.description),
    ).not.toBeInTheDocument();
  });

  it('shows the draft dialog instead when a draft exists', async () => {
    (hasAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue(true);
    renderPage();
    await waitFor(() => expect(screen.getByText(messages.Automations.add)).toBeInTheDocument());

    fireEvent.click(screen.getByText(messages.Automations.add));

    expect(screen.getByText(messages.Automations.DraftDialog.description)).toBeInTheDocument();
    expect(screen.queryByTestId('template-dialog')).not.toBeInTheDocument();
  });

  it('"ساخت اتومیشن جدید" clears the draft and falls through to the template picker', async () => {
    (hasAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue(true);
    renderPage();
    await waitFor(() => expect(screen.getByText(messages.Automations.add)).toBeInTheDocument());
    fireEvent.click(screen.getByText(messages.Automations.add));

    fireEvent.click(screen.getByText(messages.Automations.DraftDialog.createNew));

    expect(clearAutomationDraft).toHaveBeenCalledWith('ws-1');
    expect(screen.getByTestId('template-dialog')).toBeInTheDocument();
  });

  it('"ادامه قبلی" navigates straight to /automations/add', async () => {
    (hasAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue(true);
    renderPage();
    await waitFor(() => expect(screen.getByText(messages.Automations.add)).toBeInTheDocument());
    fireEvent.click(screen.getByText(messages.Automations.add));

    fireEvent.click(screen.getByText(messages.Automations.DraftDialog.resume));

    expect(push).toHaveBeenCalledWith('/automations/add');
    expect(screen.queryByTestId('template-dialog')).not.toBeInTheDocument();
  });
});
