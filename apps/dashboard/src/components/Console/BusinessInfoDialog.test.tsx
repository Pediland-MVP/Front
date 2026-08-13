import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const postMock = vi.fn();
vi.mock('@/hooks/swr/api-client', () => ({
  default: { post: (...args: unknown[]) => postMock(...args) },
}));

const mutateMock = vi.fn();
vi.mock('swr', () => ({ mutate: (...args: unknown[]) => mutateMock(...args) }));

const toastErrorMock = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastErrorMock(...args) } }));

// Radix's Select never opens under jsdom (it needs pointer capture + layout), and the
// repo's other Select tests sidestep it entirely. Swap in a native <select> so the test
// exercises what actually matters here: the chosen value reaching POST /users.
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select data-testid="howFoundUs" value={value} onChange={(e) => onValueChange(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

import BusinessInfoDialog from './BusinessInfoDialog';
import { useBusinessInfoGateStore } from '@/lib/stores/useBusinessInfoGateStore';

const copy = messages.Automations.BusinessInfo;

const renderDialog = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <BusinessInfoDialog />
    </NextIntlClientProvider>,
  );

describe('BusinessInfoDialog', () => {
  beforeEach(() => {
    push.mockReset();
    postMock.mockReset().mockResolvedValue({ status: 200 });
    mutateMock.mockReset();
    toastErrorMock.mockReset();
    useBusinessInfoGateStore.setState({ isOpen: false, pendingHref: null });
  });

  it('renders nothing while the store is closed', () => {
    renderDialog();
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });

  it('saves the selected value, revalidates and continues to the pending href', async () => {
    useBusinessInfoGateStore.setState({ isOpen: true, pendingHref: '/automations/add' });
    renderDialog();

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('howFoundUs'), { target: { value: 'telegram' } });
    fireEvent.click(screen.getByText(copy.save));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith('/users', { howFoundUs: 'telegram' }),
    );
    // Both SWR keys for GET /users/me — useUser keys it relative, ProfileForm absolute.
    expect(mutateMock).toHaveBeenCalledWith('/users/me');
    expect(mutateMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/automations/add'));
    expect(useBusinessInfoGateStore.getState().isOpen).toBe(false);
  });

  it('keeps the dialog open and does not navigate when saving fails', async () => {
    postMock.mockRejectedValueOnce({ response: { data: { code: 'BOOM' } } });
    useBusinessInfoGateStore.setState({ isOpen: true, pendingHref: '/automations/add' });
    renderDialog();

    fireEvent.change(screen.getByTestId('howFoundUs'), { target: { value: 'google' } });
    fireEvent.click(screen.getByText(copy.save));

    await waitFor(() => expect(postMock).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalled();
    expect(useBusinessInfoGateStore.getState().isOpen).toBe(true);
  });

  it('does not submit while no option is chosen', () => {
    useBusinessInfoGateStore.setState({ isOpen: true, pendingHref: '/automations/add' });
    renderDialog();

    expect(screen.getByText(copy.save).closest('button')).toBeDisabled();
  });
});
