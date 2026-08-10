import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/hooks/useUser', () => ({
  default: () => ({ user: null, hasInstagram: true, isLoading: false }),
}));
vi.mock('swr/immutable', () => ({
  default: () => ({ data: undefined, isLoading: false, error: undefined, mutate: vi.fn() }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/utils/automationDraft', () => ({
  getCurrentWorkspaceId: vi.fn(() => 'ws-1'),
  readAutomationDraft: vi.fn(() => null),
  clearAutomationDraft: vi.fn(),
  writeAutomationDraft: vi.fn(),
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
import {
  getCurrentWorkspaceId,
  readAutomationDraft,
  clearAutomationDraft,
} from '@/utils/automationDraft';

beforeEach(() => {
  vi.clearAllMocks();
  (getCurrentWorkspaceId as ReturnType<typeof vi.fn>).mockReturnValue('ws-1');
  (readAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue(null);
});

describe('AutomationForm draft integration', () => {
  it('seeds the form from a stored draft on a brand-new, query-param-free create', async () => {
    (readAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue({
      title: 'یک عنوان از پیش‌نویس',
      contents: [],
      instagramIds: [],
    });

    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(readAutomationDraft).toHaveBeenCalledWith('ws-1'));
    expect(screen.getByDisplayValue('یک عنوان از پیش‌نویس')).toBeInTheDocument();
  });

  it('does not consult the draft when copyFromId is set', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm copyFromId="11111111-1111-4111-8111-111111111111" />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('automation-builder-root')).toBeInTheDocument());
    expect(readAutomationDraft).not.toHaveBeenCalled();
  });

  it('clears the stored draft after a successful create', async () => {
    // Reuse readAutomationDraft's mock slot to seed a fully valid AutomationFormSchema
    // source directly (sidestepping the templates SWR mock this file doesn't set up) —
    // same minimal path AutomationForm.submit.test.tsx already exercises. Note this must
    // include `conditionType`/`conditions` explicitly: a *real* draft (captured live off
    // react-hook-form state by AutomationDraftWatcher) always carries `conditionType`
    // since it's a real form field, but AutomationBuilder's own `useForm` defaults
    // (`conditionType: 'EQUAL'`, `conditions: [{ type: 'EQUAL', value: '' }]`) survive the
    // `...initialValue` spread for any key the draft omits — so a `conditionType`-less
    // fixture would spuriously fail schema validation on the leftover empty condition.
    (readAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue({
      contents: [{ type: 'text', text: 'hi' }],
      instagramIds: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
      isDirect: true,
      isComment: false,
      isNoCondition: true,
      conditionType: 'noCondition',
      conditions: [],
    });

    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('ایجاد پیام خودکار')).toBeInTheDocument());
    fireEvent.click(screen.getByText('ایجاد پیام خودکار'));

    await waitFor(() => expect(post).toHaveBeenCalled());
    await waitFor(() => expect(clearAutomationDraft).toHaveBeenCalledWith('ws-1'));
  });
});

describe('AutomationForm draft-restored banner', () => {
  it('shows the banner when the form was seeded from a stored draft', async () => {
    (readAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue({
      title: 'یک عنوان از پیش‌نویس',
      contents: [],
      instagramIds: [],
    });

    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm />
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByText(messages.Automations.DraftBanner.description),
    ).toBeInTheDocument();
  });

  it('does not show the banner when there is no stored draft', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('automation-builder-root')).toBeInTheDocument());
    expect(
      screen.queryByText(messages.Automations.DraftBanner.description),
    ).not.toBeInTheDocument();
  });

  it('"ادامه ویرایش" dismisses the banner and keeps the draft values, without clearing storage', async () => {
    (readAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue({
      title: 'یک عنوان از پیش‌نویس',
      contents: [],
      instagramIds: [],
    });

    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm />
      </NextIntlClientProvider>,
    );

    await screen.findByText(messages.Automations.DraftBanner.description);
    fireEvent.click(screen.getByText(messages.Automations.DraftBanner.resume));

    expect(
      screen.queryByText(messages.Automations.DraftBanner.description),
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('یک عنوان از پیش‌نویس')).toBeInTheDocument();
    expect(clearAutomationDraft).not.toHaveBeenCalled();
  });

  it('"پیام جدید" clears the draft and resets the form to blank in place', async () => {
    (readAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue({
      title: 'یک عنوان از پیش‌نویس',
      contents: [],
      instagramIds: [],
    });

    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm />
      </NextIntlClientProvider>,
    );

    await screen.findByText(messages.Automations.DraftBanner.description);
    fireEvent.click(screen.getByText(messages.Automations.DraftBanner.createNew));

    expect(clearAutomationDraft).toHaveBeenCalledWith('ws-1');
    expect(
      screen.queryByText(messages.Automations.DraftBanner.description),
    ).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('یک عنوان از پیش‌نویس')).not.toBeInTheDocument();
  });

  it('dismisses the banner automatically once the user edits the form directly', async () => {
    (readAutomationDraft as ReturnType<typeof vi.fn>).mockReturnValue({
      title: 'یک عنوان از پیش‌نویس',
      contents: [],
      instagramIds: [],
    });

    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm />
      </NextIntlClientProvider>,
    );

    await screen.findByText(messages.Automations.DraftBanner.description);

    const titleInput = screen.getByDisplayValue('یک عنوان از پیش‌نویس');
    fireEvent.change(titleInput, { target: { value: 'یک عنوان از پیش‌نویس ویرایش‌شده' } });

    await waitFor(() =>
      expect(
        screen.queryByText(messages.Automations.DraftBanner.description),
      ).not.toBeInTheDocument(),
    );
  });
});
