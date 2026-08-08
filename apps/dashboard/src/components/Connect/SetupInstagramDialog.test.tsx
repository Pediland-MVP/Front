import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

const lookupMock = vi.fn();
vi.mock('../../app/(Connect)/connect/hooks/useInstagramFollowersLookup', () => ({
  useInstagramFollowersLookup: () => ({ lookup: lookupMock, isLookupLoading: false }),
}));

const plansByFollowersMock = vi.fn();
vi.mock('../../app/(Connect)/connect/hooks/usePlansByFollowers', () => ({
  usePlansByFollowers: (count?: number) => plansByFollowersMock(count),
}));

const allVisiblePlansMock = vi.fn();
vi.mock('../../app/(Connect)/connect/hooks/useAllVisiblePlans', () => ({
  useAllVisiblePlans: (enabled: boolean) => allVisiblePlansMock(enabled),
}));

const payMock = vi.fn();
vi.mock('@/app/(Console)/settings/subscription/hooks/usePayPlan', () => ({
  default: () => ({ pay: payMock, isPayLoading: false }),
}));

vi.mock('@/store/subscriptionStore', () => ({
  useSubscriptionStore: () => ({ setActive: vi.fn() }),
}));

import { SetupInstagramDialog } from './SetupInstagramDialog';

const renderDialog = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <SetupInstagramDialog open onOpenChange={vi.fn()} />
    </NextIntlClientProvider>,
  );

describe('SetupInstagramDialog', () => {
  beforeEach(() => {
    lookupMock.mockReset();
    plansByFollowersMock.mockReset().mockReturnValue({ plan: undefined, isLoading: false });
    allVisiblePlansMock.mockReset().mockReturnValue({ plans: undefined, isLoading: false });
    payMock.mockReset();
  });

  it('shows the matched plan after a successful follower-count check', async () => {
    lookupMock.mockResolvedValue({ username: 'befroosh', followersCount: 5000 });
    plansByFollowersMock.mockReturnValue({
      plan: {
        id: 1,
        name: '۱K تا ۲۵K فالور',
        durations: [{ id: 10, name: 'یک ماهه', durationDays: 30, price: 100000 }],
      },
      isLoading: false,
    });

    renderDialog();
    fireEvent.change(
      screen.getByPlaceholderText(messages.SetupInstagramDialog.username_placeholder),
      {
        target: { value: 'befroosh' },
      },
    );
    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.check_button));

    await waitFor(() => expect(lookupMock).toHaveBeenCalledWith('befroosh'));
    expect(screen.getByText('۱K تا ۲۵K فالور')).toBeInTheDocument();
  });

  it('falls back to the manual plan list when the follower-count check fails', async () => {
    lookupMock.mockRejectedValue(new Error('APIFY_ERROR'));
    allVisiblePlansMock.mockReturnValue({
      plans: [
        {
          id: 2,
          name: '۲۵K تا ۱۰۰K فالور',
          durations: [{ id: 20, name: 'یک ماهه', durationDays: 30, price: 200000 }],
        },
      ],
      isLoading: false,
    });

    renderDialog();
    fireEvent.change(
      screen.getByPlaceholderText(messages.SetupInstagramDialog.username_placeholder),
      {
        target: { value: 'someone' },
      },
    );
    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.check_button));

    await waitFor(() => expect(lookupMock).toHaveBeenCalledWith('someone'));
    expect(
      screen.getByText(messages.SetupInstagramDialog.apify_error_description),
    ).toBeInTheDocument();
    expect(screen.getByText('۲۵K تا ۱۰۰K فالور')).toBeInTheDocument();
  });
});
