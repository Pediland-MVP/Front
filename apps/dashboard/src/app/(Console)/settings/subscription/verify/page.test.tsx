import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('Authority=A1&Status=OK'),
}));

const getMock = vi.fn();
vi.mock('@/hooks/swr/api-client', () => ({
  default: { get: (...args: any[]) => getMock(...args) },
}));
vi.mock('swr', () => ({ mutate: vi.fn() }));

import VerifyPage from './page';

const renderPage = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <VerifyPage />
    </NextIntlClientProvider>,
  );

describe('Subscription verify page — pooled redirect', () => {
  beforeEach(() => {
    push.mockReset();
  });

  it('redirects to /connect when the completed subscription is pooled (unbound)', async () => {
    getMock.mockResolvedValue({ data: { data: { pooled: true, ref_id: 1 } } });

    renderPage();

    await waitFor(() => screen.getByText(messages.Subscription.Verify.redirectNow));
    fireEvent.click(screen.getByText(messages.Subscription.Verify.redirectNow));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/connect'));
  });

  it('redirects to /settings/instagram when the completed subscription is bound to a page', async () => {
    getMock.mockResolvedValue({ data: { data: { pooled: false, ref_id: 1 } } });

    renderPage();

    await waitFor(() => screen.getByText(messages.Subscription.Verify.redirectNow));
    fireEvent.click(screen.getByText(messages.Subscription.Verify.redirectNow));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/settings/instagram?isAfterPurchasingPlan'),
    );
  });
});
