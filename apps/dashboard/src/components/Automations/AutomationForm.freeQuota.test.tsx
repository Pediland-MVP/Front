import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/hooks/useUser', () => ({
  default: () => ({ user: null, hasInstagram: true, isLoading: false }),
}));

const INSTAGRAM_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

// Same shim `AutomationForm.submit.test.tsx` uses — a template prefilled with a single
// `instagramIds` entry, just enough to satisfy `AutomationFormSchema` without driving the
// real `InstagramSelectField` in this unit test.
const templateSource = {
  isDirect: true,
  isComment: false,
  isNoCondition: false,
  conditions: [{ type: 'EQUAL', value: 'test' }],
  contents: [{ type: 'text', text: 'hello from template' }],
  instagramLinks: [{ instagramId: INSTAGRAM_ID }],
};

// Mutable so each test can point `/instagram/accounts` at a different account shape
// without redeclaring the whole mock module.
let accountsData: unknown;

vi.mock('swr/immutable', () => ({
  default: (key: string | null) => {
    if (key?.startsWith('/templates')) {
      return { data: templateSource, isLoading: false, error: undefined, mutate: vi.fn() };
    }
    if (key?.endsWith('/instagram/accounts')) {
      return { data: accountsData, isLoading: false, error: undefined, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, error: undefined, mutate: vi.fn() };
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

const post = vi.fn().mockResolvedValue({ data: {} });
vi.mock('@/hooks/swr/api-client', async () => {
  const actual =
    await vi.importActual<typeof import('@/hooks/swr/api-client')>('@/hooks/swr/api-client');
  return { ...actual, default: vi.fn((config: unknown) => post(config)), fetcher: vi.fn() };
});

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList);

  (global as any).ResizeObserver =
    (global as any).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

import messages from '@/messages/fa.json';
import { AutomationForm } from './AutomationForm';

const DIALOG_TITLE = messages.Automations.FreeQuotaWarningDialog.title;

const renderAndSubmit = async () => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <AutomationForm templateId="11111111-1111-4111-8111-111111111111" />
    </NextIntlClientProvider>,
  );

  await waitFor(() => expect(screen.getByText('ایجاد پیام خودکار')).toBeInTheDocument());
  fireEvent.click(screen.getByText('ایجاد پیام خودکار'));
};

describe('AutomationForm free-quota warning dialog', () => {
  it('shows the dialog exactly on the submission that crosses the free limit', async () => {
    // Live count sits exactly at the limit, not yet flagged — this is the one submission
    // that would push the page over: the dialog must show and the submit must pause.
    accountsData = {
      data: [
        {
          id: INSTAGRAM_ID,
          automationCount: 2,
          freeAutomationLimit: 2,
          freeAutomationQuotaExceeded: false,
        },
      ],
    };

    await renderAndSubmit();

    await waitFor(() => expect(screen.getByText(DIALOG_TITLE)).toBeInTheDocument());
    expect(post).not.toHaveBeenCalled();
  });

  it('does not re-show the dialog once the live count is already past the limit (desync regression)', async () => {
    // Regression for the "always shows" bug: a page whose live automation count is already
    // past the limit but whose sticky `freeAutomationQuotaExceeded` flag never caught up
    // (e.g. links created outside the normal save/update path). The old `>=` comparison
    // re-showed the dialog on every submission in this state; it must not show here.
    accountsData = {
      data: [
        {
          id: INSTAGRAM_ID,
          automationCount: 3,
          freeAutomationLimit: 2,
          freeAutomationQuotaExceeded: false,
        },
      ],
    };

    await renderAndSubmit();

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(screen.queryByText(DIALOG_TITLE)).not.toBeInTheDocument();
  });

  it('does not show the dialog once the sticky flag is already set', async () => {
    accountsData = {
      data: [
        {
          id: INSTAGRAM_ID,
          automationCount: 2,
          freeAutomationLimit: 2,
          freeAutomationQuotaExceeded: true,
        },
      ],
    };

    await renderAndSubmit();

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(screen.queryByText(DIALOG_TITLE)).not.toBeInTheDocument();
  });
});
