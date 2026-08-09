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
const usePayPlanMock = vi.fn();
vi.mock('@/app/(Console)/settings/subscription/hooks/usePayPlan', () => ({
  default: () => usePayPlanMock(),
}));

const subscriptionStoreMock = vi.fn();
vi.mock('@/store/subscriptionStore', () => ({
  useSubscriptionStore: () => subscriptionStoreMock(),
}));

import { SetupInstagramDialog } from './SetupInstagramDialog';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';

/** Minimal Subscription shape the dialog actually reads. */
const sub = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    id: 'sub1',
    status: SubscriptionStatusEnum.ACTIVE,
    type: 'time',
    instagramId: null,
    planDuration: { name: 'شش ماهه', plan: { name: '۱K تا ۲۵K فالور' } },
    ...over,
  }) as never;

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
    usePayPlanMock.mockReset().mockReturnValue({ pay: payMock, isPayLoading: false });
    subscriptionStoreMock.mockReset().mockReturnValue({ setActive: vi.fn(), subscriptions: [] });
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

  it('disables every matched-plan duration button while a purchase is in flight', async () => {
    lookupMock.mockResolvedValue({ username: 'befroosh', followersCount: 5000 });
    plansByFollowersMock.mockReturnValue({
      plan: {
        id: 1,
        name: '۱K تا ۲۵K فالور',
        durations: [
          { id: 10, name: 'یک ماهه', durationDays: 30, price: 100000 },
          { id: 11, name: 'سه ماهه', durationDays: 90, price: 250000 },
        ],
      },
      isLoading: false,
    });
    usePayPlanMock.mockReturnValue({ pay: payMock, isPayLoading: true });

    renderDialog();
    fireEvent.change(
      screen.getByPlaceholderText(messages.SetupInstagramDialog.username_placeholder),
      {
        target: { value: 'befroosh' },
      },
    );
    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.check_button));

    await waitFor(() => expect(lookupMock).toHaveBeenCalledWith('befroosh'));
    expect(screen.getByText('یک ماهه')).toBeInTheDocument();
    expect(screen.getByText('سه ماهه')).toBeInTheDocument();
    const buyButtons = screen.getAllByText(messages.Subscription.buy);
    expect(buyButtons).toHaveLength(2);
    buyButtons.forEach((label) => expect(label.closest('button')).toBeDisabled());
  });

  it('disables every manual-fallback plan tile while a purchase is in flight', async () => {
    lookupMock.mockRejectedValue(new Error('APIFY_ERROR'));
    allVisiblePlansMock.mockReturnValue({
      plans: [
        {
          id: 2,
          name: '۲۵K تا ۱۰۰K فالور',
          durations: [{ id: 20, name: 'یک ماهه', durationDays: 30, price: 200000 }],
        },
        {
          id: 3,
          name: '۱۰۰K تا ۵۰۰K فالور',
          durations: [{ id: 30, name: 'یک ماهه', durationDays: 30, price: 300000 }],
        },
      ],
      isLoading: false,
    });
    usePayPlanMock.mockReturnValue({ pay: payMock, isPayLoading: true });

    renderDialog();
    fireEvent.change(
      screen.getByPlaceholderText(messages.SetupInstagramDialog.username_placeholder),
      {
        target: { value: 'someone' },
      },
    );
    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.check_button));

    await waitFor(() => expect(lookupMock).toHaveBeenCalledWith('someone'));
    expect(screen.getByText('۲۵K تا ۱۰۰K فالور').closest('button')).toBeDisabled();
    expect(screen.getByText('۱۰۰K تا ۵۰۰K فالور').closest('button')).toBeDisabled();
  });
});

describe('SetupInstagramDialog — unbound plan step', () => {
  beforeEach(() => {
    lookupMock.mockReset();
    plansByFollowersMock.mockReset().mockReturnValue({ plan: undefined, isLoading: false });
    allVisiblePlansMock.mockReset().mockReturnValue({ plans: undefined, isLoading: false });
    payMock.mockReset();
    usePayPlanMock.mockReset().mockReturnValue({ pay: payMock, isPayLoading: false });
    subscriptionStoreMock.mockReset().mockReturnValue({ setActive: vi.fn(), subscriptions: [] });
  });

  const withUnbound = () =>
    subscriptionStoreMock.mockReturnValue({ setActive: vi.fn(), subscriptions: [sub()] });

  /**
   * Both warning lines are ICU plurals now, so the raw message string no longer matches
   * what renders. Match on the wording common to every branch instead.
   */
  const warningTitle = () => screen.queryByText(/اشتراک تخصیص‌داده‌نشده دارید/);

  it('warns about the unassigned plan before asking for a username', () => {
    withUnbound();

    renderDialog();

    expect(warningTitle()).toBeInTheDocument();
    expect(screen.getByText(/فقط روی پیجی فعال می‌شود/)).toBeInTheDocument();
    // The username flow must not be reachable until the user answers this step.
    expect(
      screen.queryByPlaceholderText(messages.SetupInstagramDialog.username_placeholder),
    ).not.toBeInTheDocument();
  });

  it('says "one" for a single unassigned plan', () => {
    withUnbound();

    renderDialog();

    expect(screen.getByText('شما یک اشتراک تخصیص‌داده‌نشده دارید')).toBeInTheDocument();
  });

  it('counts them, in Persian digits, when more than one is unassigned', () => {
    subscriptionStoreMock.mockReturnValue({
      setActive: vi.fn(),
      subscriptions: [sub(), sub({ id: 'sub2' }), sub({ id: 'sub3' })],
    });

    renderDialog();

    expect(screen.getByText('شما ۳ اشتراک تخصیص‌داده‌نشده دارید')).toBeInTheDocument();
    // The description drops "این اشتراک" (this subscription) for the many-plans wording,
    // since each one carries its own follower range.
    expect(screen.getByText(/هرکدام از این اشتراک‌ها/)).toBeInTheDocument();
  });

  it('names the unassigned plan and its follower tier', () => {
    withUnbound();

    renderDialog();

    expect(screen.getByText('شش ماهه')).toBeInTheDocument();
    expect(screen.getByText('۱K تا ۲۵K فالور')).toBeInTheDocument();
  });

  it('sends the user to /connect to continue with the plan already owned', () => {
    withUnbound();

    renderDialog();

    const link = screen.getByText(messages.SetupInstagramDialog.continue_with_unbound).closest('a');
    // Not straight into OAuth: /connect carries the instructions and help video, and the
    // flag tells it this question is answered so it does not reopen this dialog.
    expect(link).toHaveAttribute('href', '/connect?continueWithPlan=1');
  });

  it('closes itself on the way to /connect, so it cannot cover that page', () => {
    withUnbound();
    const onOpenChange = vi.fn();

    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <SetupInstagramDialog open onOpenChange={onOpenChange} />
      </NextIntlClientProvider>,
    );
    const link = screen
      .getByText(messages.SetupInstagramDialog.continue_with_unbound)
      .closest('a')!;
    // jsdom cannot navigate and logs an error if the click is left to its default.
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);

    // Navigating /connect → /connect keeps the route mounted, so the parent's `open`
    // state survives the click and would leave the dialog sitting over the page.
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('falls through to the username flow after choosing to buy a different plan', () => {
    withUnbound();

    renderDialog();
    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.buy_another_plan));

    expect(
      screen.getByPlaceholderText(messages.SetupInstagramDialog.username_placeholder),
    ).toBeInTheDocument();
    expect(warningTitle()).not.toBeInTheDocument();
  });

  it('skips the step entirely for credit coverage, which can never mismatch', () => {
    subscriptionStoreMock.mockReturnValue({
      setActive: vi.fn(),
      subscriptions: [sub({ type: 'credit' })],
    });

    renderDialog();

    expect(
      screen.getByPlaceholderText(messages.SetupInstagramDialog.username_placeholder),
    ).toBeInTheDocument();
    expect(warningTitle()).not.toBeInTheDocument();
  });

  it('skips the step for a plan already bound to a page', () => {
    subscriptionStoreMock.mockReturnValue({
      setActive: vi.fn(),
      subscriptions: [sub({ instagramId: 'ig1' })],
    });

    renderDialog();

    expect(
      screen.getByPlaceholderText(messages.SetupInstagramDialog.username_placeholder),
    ).toBeInTheDocument();
  });
});
