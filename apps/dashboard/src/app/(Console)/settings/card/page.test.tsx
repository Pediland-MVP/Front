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
    codMaxOrderValue: null,
  };
  post.mockResolvedValue({ status: 200 });
});

describe('bank details — the cash-on-delivery ceiling', () => {
  it('reflects the saved ceiling instead of always rendering empty', () => {
    cardToCardData = { ...cardToCardData, codMaxOrderValue: 3_000_000 };
    renderPage();

    expect(screen.getByLabelText(copy.cod.ceilingLabel)).toHaveValue('۳٬۰۰۰٬۰۰۰');
  });

  it('renders the field empty when there is no ceiling', () => {
    renderPage();

    expect(screen.getByLabelText(copy.cod.ceilingLabel)).toHaveValue('');
  });

  // Whether cash on delivery is offered at all is the shipping method's own settlement, set on
  // /products/shipping. This page only caps how much cash the merchant will accept.
  it('offers no on/off control here — only the cap', () => {
    renderPage();

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('sends the ceiling with the bank details, since one endpoint writes them all', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(copy.cod.ceilingLabel), {
      target: { value: '3000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: copy.save }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      '/payments/cardToCard',
      expect.objectContaining({ bankName: 'صادرات', codMaxOrderValue: 3000000 }),
    );
  });

  it('sends null, which the API reads as "no cap", when the field is left empty', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: copy.save }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      '/payments/cardToCard',
      expect.objectContaining({ codMaxOrderValue: null }),
    );
  });
});
