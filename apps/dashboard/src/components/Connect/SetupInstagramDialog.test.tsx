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

const usePermissionsMock = vi.fn();
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => usePermissionsMock(),
}));

const changeWorkspaceMock = vi.fn();
const useWorkspacesMock = vi.fn();
vi.mock('@/hooks/useWorkspaces', () => ({
  useWorkspaces: () => useWorkspacesMock(),
}));

const useWorkspaceCategoriesMock = vi.fn();
vi.mock('@/hooks/useWorkspaceCategories', () => ({
  useWorkspaceCategories: () => useWorkspaceCategoriesMock(),
}));

const apiPostMock = vi.fn();
vi.mock('@/hooks/swr/api-client', () => ({
  default: { post: (...args: any[]) => apiPostMock(...args) },
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
    usePermissionsMock.mockReset().mockReturnValue({ workspaceId: 'ws-current' });
    changeWorkspaceMock.mockReset();
    useWorkspacesMock.mockReset().mockReturnValue({
      workspaces: [
        { id: 'ws-current', name: 'کسب و کار فعلی' },
        { id: 'ws-other', name: 'کسب و کار دیگر' },
      ],
      changeWorkspace: changeWorkspaceMock,
    });
    useWorkspaceCategoriesMock.mockReset().mockReturnValue({
      categories: [{ id: 'cat1', nameEn: 'Retail', nameFa: 'خرده‌فروشی' }],
    });
    apiPostMock.mockReset();
  });

  const checkUsername = async (username: string) => {
    fireEvent.change(
      screen.getByPlaceholderText(messages.SetupInstagramDialog.username_placeholder),
      { target: { value: username } },
    );
    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.check_button));
    await waitFor(() => expect(lookupMock).toHaveBeenCalledWith(username));
  };

  it('shows the matched plan and profile card after a successful follower-count check', async () => {
    lookupMock.mockResolvedValue({
      username: 'befroosh',
      followersCount: 5000,
      profilePicUrl: 'https://apify.example/pic.jpg',
      fullName: 'Befroosh',
    });
    plansByFollowersMock.mockReturnValue({
      plan: {
        id: 1,
        name: '۱K تا ۲۵K فالور',
        durations: [{ id: 10, name: 'یک ماهه', durationDays: 30, price: 100000 }],
      },
      isLoading: false,
    });

    renderDialog();
    await checkUsername('befroosh');

    expect(screen.getByText('۱K تا ۲۵K فالور')).toBeInTheDocument();
    expect(screen.getByText('@befroosh')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
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
    await checkUsername('someone');

    expect(
      screen.getByText(messages.SetupInstagramDialog.apify_error_description),
    ).toBeInTheDocument();
    expect(screen.getByText('۲۵K تا ۱۰۰K فالور')).toBeInTheDocument();
  });

  it('selecting a plan duration enables the next-step button and advances to the workspace step', async () => {
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
    await checkUsername('befroosh');

    expect(screen.getByText(messages.SetupInstagramDialog.next_step)).toBeDisabled();
    fireEvent.click(screen.getByText('یک ماهه'));
    expect(screen.getByText(messages.SetupInstagramDialog.next_step)).not.toBeDisabled();

    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.next_step));

    expect(screen.getByText(messages.SetupInstagramDialog.option_new_title)).toBeInTheDocument();
    expect(payMock).not.toHaveBeenCalled();
  });

  it('selecting a manual-fallback plan also enables the next-step button', async () => {
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
    await checkUsername('someone');

    expect(screen.getByText(messages.SetupInstagramDialog.next_step)).toBeDisabled();
    fireEvent.click(screen.getByText('۲۵K تا ۱۰۰K فالور'));
    expect(screen.getByText(messages.SetupInstagramDialog.next_step)).not.toBeDisabled();
  });

  it('defaults the workspace step to the current workspace and pays directly, without creating or switching', async () => {
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
    await checkUsername('befroosh');
    fireEvent.click(screen.getByText('یک ماهه'));
    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.next_step));

    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.finalize_pay));

    await waitFor(() =>
      expect(payMock).toHaveBeenCalledWith(
        { planId: 1, durationId: 10 },
        expect.any(Function),
        expect.any(Function),
      ),
    );
    expect(apiPostMock).not.toHaveBeenCalled();
    expect(changeWorkspaceMock).not.toHaveBeenCalled();
  });

  it('the prev-step button returns from the workspace step to the plan step', async () => {
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
    await checkUsername('befroosh');
    fireEvent.click(screen.getByText('یک ماهه'));
    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.next_step));
    expect(screen.getByText(messages.SetupInstagramDialog.option_new_title)).toBeInTheDocument();

    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.prev_step));

    expect(screen.getByText('۱K تا ۲۵K فالور')).toBeInTheDocument();
    expect(
      screen.queryByText(messages.SetupInstagramDialog.option_new_title),
    ).not.toBeInTheDocument();
  });

  it('clears the stale plan/duration selection when the user goes back and checks a different username', async () => {
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
    await checkUsername('befroosh');
    fireEvent.click(screen.getByText('یک ماهه'));
    expect(screen.getByText(messages.SetupInstagramDialog.next_step)).not.toBeDisabled();

    fireEvent.click(screen.getByText(messages.SetupInstagramDialog.prev_step));

    lookupMock.mockResolvedValue({ username: 'someone-else', followersCount: 50000 });
    plansByFollowersMock.mockReturnValue({
      plan: {
        id: 2,
        name: '۲۵K تا ۱۰۰K فالور',
        durations: [{ id: 20, name: 'شش ماهه', durationDays: 180, price: 400000 }],
      },
      isLoading: false,
    });
    await checkUsername('someone-else');

    expect(screen.getByText(messages.SetupInstagramDialog.next_step)).toBeDisabled();
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
    // Reassures the user that they do not have to pick which plan binds to the new page.
    expect(
      screen.getByText(messages.SetupInstagramDialog.unbound_auto_match_note),
    ).toBeInTheDocument();
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
