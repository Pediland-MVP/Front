import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';

const usePermissionsMock = vi.fn();
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => usePermissionsMock() }));

let cardToCardData: Record<string, unknown> | undefined;
vi.mock('swr/immutable', () => ({
  default: () => ({ data: cardToCardData, isLoading: false, error: undefined }),
}));
vi.mock('swr', () => ({ mutate: vi.fn() }));

const post = vi.fn();
vi.mock('@/hooks/swr/api-client', () => ({
  default: { post: (...args: unknown[]) => post(...args) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Page from './page';

const copy = messages.Settings.BankDetails;

const renderPage = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <Page />
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  usePermissionsMock.mockReturnValue({ can: () => true, isLoading: false });
  cardToCardData = {
    bankName: 'صادرات',
    accountHolder: 'علی علیزاده',
    cardNumber: '1'.repeat(16),
    iban: '2'.repeat(24),
    codEnabled: false,
    codMaxOrderValue: null,
  };
  post.mockResolvedValue({ status: 200 });
});

describe('bank details — cash-on-delivery', () => {
  it('reflects the saved state instead of always rendering off', () => {
    cardToCardData = { ...cardToCardData, codEnabled: true, codMaxOrderValue: 3_000_000 };
    renderPage();

    expect(screen.getByRole('switch', { name: copy.cod.label })).toBeChecked();
    expect(screen.getByLabelText(copy.cod.ceilingLabel)).toHaveValue('۳٬۰۰۰٬۰۰۰');
  });

  it('hides the ceiling field while cash-on-delivery is off', () => {
    renderPage();

    expect(screen.queryByLabelText(copy.cod.ceilingLabel)).not.toBeInTheDocument();
  });

  it('reveals the ceiling once the toggle is switched on', () => {
    renderPage();

    fireEvent.click(screen.getByRole('switch', { name: copy.cod.label }));

    expect(screen.getByLabelText(copy.cod.ceilingLabel)).toBeInTheDocument();
  });

  it('sends both fields with the bank details, since one endpoint writes them all', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('switch', { name: copy.cod.label }));
    fireEvent.change(screen.getByLabelText(copy.cod.ceilingLabel), {
      target: { value: '3000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: copy.save }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      '/payments/cardToCard',
      expect.objectContaining({
        bankName: 'صادرات',
        codEnabled: true,
        codMaxOrderValue: 3000000,
      }),
    );
  });

  it('sends a null ceiling, which the API reads as "no cap", when the field is left empty', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('switch', { name: copy.cod.label }));
    fireEvent.click(screen.getByRole('button', { name: copy.save }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      '/payments/cardToCard',
      expect.objectContaining({ codEnabled: true, codMaxOrderValue: null }),
    );
  });
});
