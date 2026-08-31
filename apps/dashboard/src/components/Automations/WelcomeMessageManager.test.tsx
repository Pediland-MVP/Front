import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';
import errorCodes from '@/messages/fa/ErrorCodes.json';

const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...a: any[]) => toastErrorMock(...a),
    success: (...a: any[]) => toastSuccessMock(...a),
  },
}));

const apiPostMock = vi.fn().mockResolvedValue({ data: { data: { items: [] } } });
vi.mock('@/hooks/swr/api-client', () => ({
  default: { post: (...a: any[]) => apiPostMock(...a) },
  fetcher: vi.fn(),
  setAccessToken: vi.fn(),
}));

const usePermissionsMock = vi.fn();
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => usePermissionsMock() }));

// Keyed by SWR key so each request can be driven independently. An entry that is
// absent behaves like a request that has not resolved yet — which is exactly the
// state that used to blow up.
let swrResponses: Record<string, any> = {};

vi.mock('swr', () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, isLoading: false, mutate: vi.fn() };
    return swrResponses[key] ?? { data: undefined, isLoading: false, mutate: vi.fn() };
  },
  useSWRConfig: () => ({ mutate: vi.fn() }),
}));

vi.mock('swr/immutable', () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, isLoading: false, mutate: vi.fn() };
    return swrResponses[key] ?? { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

import { WelcomeMessageManager } from './WelcomeMessageManager';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const ACCOUNTS_KEY = `${API_URL}/instagram/accounts`;
const LIST_KEY = '/ice-breakers?instagramId=ig-1';
const PAGE = { id: 'ig-1', username: 'shop', name: 'Shop', profilePictureUrl: null };

const renderManager = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={{ ...messages, ...errorCodes }}>
      <WelcomeMessageManager />
    </NextIntlClientProvider>,
  );

describe('WelcomeMessageManager', () => {
  beforeEach(() => {
    usePermissionsMock.mockReset().mockReturnValue({ can: () => true });
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    apiPostMock.mockReset().mockResolvedValue({ data: { data: { items: [] } } });
    swrResponses = {};
  });

  /**
   * Regression: the draft-seeding effect depended on the ice breaker array, and
   * the hook returned a fresh `?? []` on every render. The effect therefore fired
   * on every render, called setSlots with a new array, and looped —
   * "Maximum update depth exceeded". React Testing Library surfaces that as a
   * thrown render error, so simply rendering is the assertion.
   */
  it('renders without an infinite update loop while the ice breaker list is still pending', () => {
    swrResponses[ACCOUNTS_KEY] = { data: { data: [PAGE] }, isLoading: false };
    // LIST_KEY deliberately unresolved.

    expect(() => renderManager()).not.toThrow();
  });

  it('renders without looping once every request has resolved', () => {
    swrResponses[ACCOUNTS_KEY] = { data: { data: [PAGE] }, isLoading: false };
    swrResponses[LIST_KEY] = {
      data: { data: { items: [], syncedAt: null, syncError: null } },
      isLoading: false,
      mutate: vi.fn(),
    };

    expect(() => renderManager()).not.toThrow();
    expect(screen.getByText(messages.WelcomeMessage.addQuestion)).toBeDefined();
  });

  it('shows the empty state instead of a bare editor when no questions exist', () => {
    swrResponses[ACCOUNTS_KEY] = { data: { data: [PAGE] }, isLoading: false };
    swrResponses[LIST_KEY] = {
      data: { data: { items: [], syncedAt: null, syncError: null } },
      isLoading: false,
      mutate: vi.fn(),
    };

    renderManager();

    expect(screen.getByText(messages.WelcomeMessage.emptyTitle)).toBeDefined();
  });

  it('seeds a saved question with its text and the automation keyword label', () => {
    swrResponses[ACCOUNTS_KEY] = { data: { data: [PAGE] }, isLoading: false };
    swrResponses[LIST_KEY] = {
      data: {
        data: {
          items: [
            {
              id: 'ib-1',
              instagramId: 'ig-1',
              contentCycleId: 'cc-1',
              sortOrder: 0,
              questions: { default: 'قیمت‌ها چنده؟' },
              // An automation is labelled by its trigger keywords here, matching
              // the START_AUTOMATION button picker — never by a raw id.
              contentCycle: { id: 'cc-1', title: null, conditions: [{ id: 'c1', value: 'قیمت' }] },
            },
          ],
          syncedAt: '2026-08-29T00:00:00.000Z',
          syncError: null,
        },
      },
      isLoading: false,
      mutate: vi.fn(),
    };

    renderManager();

    expect(screen.getByDisplayValue('قیمت‌ها چنده؟')).toBeDefined();
    expect(screen.getByText('قیمت')).toBeDefined();
  });

  /**
   * A failed push to Instagram is a toast, never an in-page banner — it is
   * status about Meta, not about the form the user is looking at.
   */
  it('reports a failed push to Instagram as a toast, not in the page', () => {
    swrResponses[ACCOUNTS_KEY] = { data: { data: [PAGE] }, isLoading: false };
    swrResponses[LIST_KEY] = {
      data: { data: { items: [], syncedAt: null, syncError: 'Invalid OAuth access token' } },
      isLoading: false,
      mutate: vi.fn(),
    };

    renderManager();

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock.mock.calls[0][0]).toMatch(/Invalid OAuth access token/);
    expect(screen.queryByText(/Invalid OAuth access token/)).toBeNull();
  });

  it('does not re-announce the same sync failure on a revalidation', () => {
    swrResponses[ACCOUNTS_KEY] = { data: { data: [PAGE] }, isLoading: false };
    swrResponses[LIST_KEY] = {
      data: { data: { items: [], syncedAt: null, syncError: 'Invalid OAuth access token' } },
      isLoading: false,
      mutate: vi.fn(),
    };

    const { rerender } = renderManager();
    rerender(
      <NextIntlClientProvider locale="fa" messages={{ ...messages, ...errorCodes }}>
        <WelcomeMessageManager />
      </NextIntlClientProvider>,
    );

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });

  it('says nothing in the page about publishing state', () => {
    swrResponses[ACCOUNTS_KEY] = { data: { data: [PAGE] }, isLoading: false };
    swrResponses[LIST_KEY] = {
      data: { data: { items: [], syncedAt: null, syncError: null } },
      isLoading: false,
      mutate: vi.fn(),
    };

    renderManager();

    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/منتشر/)).toBeNull();
  });

  it('tells the user to connect a page when there are none', () => {
    swrResponses[ACCOUNTS_KEY] = { data: { data: [] }, isLoading: false };

    renderManager();

    // Reuses the automation builder's own alert rather than a bespoke message.
    expect(screen.getByText(messages.ConnectInstagramAlert.title)).toBeDefined();
  });

  /**
   * Regression: switching page while the new page's GET fails used to leave the
   * PREVIOUS page's questions in the draft, bound to the new page's id, with Save
   * re-enabled. Saving is a full replace, so that silently destroyed the new
   * page's real list.
   */
  it('does not keep the previous page draft when the new page fails to load', async () => {
    const PAGE_B = { id: 'ig-2', username: 'other', name: 'Other', profilePictureUrl: null };
    swrResponses[ACCOUNTS_KEY] = { data: { data: [PAGE, PAGE_B] }, isLoading: false };
    swrResponses[LIST_KEY] = {
      data: {
        data: {
          items: [
            {
              id: 'ib-1',
              instagramId: 'ig-1',
              contentCycleId: 'cc-1',
              sortOrder: 0,
              questions: { default: 'سوال پیج اول' },
              contentCycle: { id: 'cc-1', title: null, conditions: [{ id: 'c1', value: 'قیمت' }] },
            },
          ],
          syncedAt: null,
          syncError: null,
        },
      },
      isLoading: false,
      mutate: vi.fn(),
    };
    // Page B's request has NOT resolved (failed): no entry for its key.

    const { rerender } = renderManager();
    expect(screen.getByDisplayValue('سوال پیج اول')).toBeDefined();

    // Switch to page B.
    const trigger = screen.getByRole('button', { name: /shop/i });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText('@other'));
    rerender(
      <NextIntlClientProvider locale="fa" messages={{ ...messages, ...errorCodes }}>
        <WelcomeMessageManager />
      </NextIntlClientProvider>,
    );

    // Page A's question must be gone, and Save must not be clickable.
    expect(screen.queryByDisplayValue('سوال پیج اول')).toBeNull();
    const save = screen.getByRole('button', { name: messages.WelcomeMessage.save });
    expect(save).toHaveProperty('disabled', true);
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  /**
   * Regression: `suppressSyncToastRef` is armed before every save but was only
   * cleared in the error branch, so after a clean save it stayed armed and ate
   * the next genuine failure. The save must actually run for the flag to arm.
   */
  it('still reports a sync failure that arrives after a successful save', async () => {
    const savedItem = {
      id: 'ib-1',
      instagramId: 'ig-1',
      contentCycleId: 'cc-1',
      sortOrder: 0,
      questions: { default: 'قیمت‌ها چنده؟' },
      contentCycle: { id: 'cc-1', title: null, conditions: [{ id: 'c1', value: 'قیمت' }] },
    };

    swrResponses[ACCOUNTS_KEY] = { data: { data: [PAGE] }, isLoading: false };
    swrResponses[LIST_KEY] = {
      data: {
        data: { items: [savedItem], syncedAt: '2026-08-29T00:00:00.000Z', syncError: null },
      },
      isLoading: false,
      mutate: vi.fn(),
    };

    const { rerender } = renderManager();

    // A real, successful save — this is what arms suppressSyncToastRef.
    fireEvent.click(screen.getByRole('button', { name: messages.WelcomeMessage.save }));
    await waitFor(() => expect(apiPostMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));
    expect(toastErrorMock).not.toHaveBeenCalled();

    // Later, an unrelated background re-push fails (e.g. the bound automation was
    // deleted from another tab). The user must still be told.
    swrResponses[LIST_KEY] = {
      data: {
        data: { items: [savedItem], syncedAt: null, syncError: 'Invalid OAuth access token' },
      },
      isLoading: false,
      mutate: vi.fn(),
    };
    rerender(
      <NextIntlClientProvider locale="fa" messages={{ ...messages, ...errorCodes }}>
        <WelcomeMessageManager />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
    expect(toastErrorMock.mock.calls[0][0]).toMatch(/Invalid OAuth access token/);
  });
});
