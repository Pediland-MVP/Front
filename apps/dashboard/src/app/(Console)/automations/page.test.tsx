import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true }),
}));
vi.mock('@/components/Automations/AutomationsCardList', () => ({
  AutomationsCardList: () => <div data-testid="automations-card-list" />,
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// Creating an automation now goes through the business-info gate rather than navigating
// directly, so the page must never call router.push itself.
const startAutomationCreate = vi.fn();
vi.mock('@/hooks/useBusinessInfoGate', () => ({
  useBusinessInfoGate: () => ({ needsBusinessInfo: false, startAutomationCreate }),
}));

import messages from '@/messages/fa.json';
import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
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
  useHeaderFeatures.getState().reset();
});

describe('Automations list page', () => {
  it('asks the business-info gate when "add automation" is clicked', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(messages.Automations.add)).toBeInTheDocument());

    fireEvent.click(screen.getByText(messages.Automations.add));

    expect(startAutomationCreate).toHaveBeenCalledWith('/automations/add');
  });

  it('does not navigate directly, so the gate can never be bypassed here', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(messages.Automations.add)).toBeInTheDocument());

    fireEvent.click(screen.getByText(messages.Automations.add));

    expect(push).not.toHaveBeenCalled();
  });
});
