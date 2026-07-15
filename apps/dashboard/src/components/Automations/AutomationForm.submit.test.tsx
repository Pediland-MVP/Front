import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/hooks/useUser', () => ({
  default: () => ({ user: null, hasInstagram: true, isLoading: false }),
}));

// Mirrors the REAL `GET /templates/:id` response shape: templates don't load or
// synthesize `reminders`/`instagramLinks`/`instagramPost` (`ContentCycleService
// .readOneTemplateById` on the backend only loads `contents`/`conditions`, plus the
// plain `isDirect`/`isComment`/`isNoCondition` columns) — so a template source never
// carries those three keys, unlike a full `GET /contentCycle/:id` (copyFromId) read.
// This exact shape is what exposed a real regression while writing this test: without
// a `?? []` fallback in `AutomationForm.tsx`'s `initialValue` memo, `reminders` came
// through as `undefined`, which silently failed `AutomationFormSchema` (it requires
// `reminders` as a non-optional array) and blocked every template-prefilled submit —
// see the fix in `AutomationForm.tsx` and the task-28 report for detail.
const templateSource = {
  isDirect: true,
  isComment: false,
  isNoCondition: false,
  conditions: [{ type: 'EQUAL', value: 'test' }],
  contents: [{ type: 'text', text: 'hello from template' }],
  instagramLinks: [{ instagramId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }],
};

vi.mock('swr/immutable', () => ({
  default: (key: string | null) => ({
    data: key?.startsWith('/templates') ? templateSource : undefined,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// The dashboard's real submit path (`AutomationForm.tsx`'s `submitAutomation`) calls the
// axios instance directly as `api({ method, url, data })` — NOT `api.post(url, data)` —
// so the mock must replace the default export with a plain callable spy, not an object
// carrying a `.post` method (that shape doesn't match how the component actually calls it).
const post = vi.fn().mockResolvedValue({ data: {} });
vi.mock('@/hooks/swr/api-client', async () => {
  const actual =
    await vi.importActual<typeof import('@/hooks/swr/api-client')>('@/hooks/swr/api-client');
  return { ...actual, default: vi.fn((config: unknown) => post(config)), fetcher: vi.fn() };
});

// Same jsdom stubs the sibling AutomationForm tests use (AutomationForm.test.tsx,
// AutomationForm.templateId.test.tsx) — AutomationBuilder renders content that measures
// itself via matchMedia/ResizeObserver, neither implemented by jsdom.
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

describe('AutomationForm submit target regression', () => {
  it('POSTs to /contentCycle (never /templates) even when opened via templateId prefill, with a genuine full valid submit', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm templateId="11111111-1111-4111-8111-111111111111" />
      </NextIntlClientProvider>,
    );

    // `add_automation`'s real fa.json copy — confirms the form actually reached the
    // "create" (no `id`) rendered state before we try to submit it.
    await waitFor(() => expect(screen.getByText('ایجاد پیام خودکار')).toBeInTheDocument());
    fireEvent.click(screen.getByText('ایجاد پیام خودکار'));

    // A genuine full submit: `templateSource` above satisfies `AutomationFormSchema`
    // (non-empty `instagramIds`/`contents`, `isDirect` true, valid `conditions`), so this
    // exercises the REAL `handleBeforeSubmit` -> `submitAutomation` -> `api(...)` path,
    // not just a handler-shape assertion.
    await waitFor(() => expect(post).toHaveBeenCalled());
    const [config] = post.mock.calls[0];
    expect(config.url).toBe('/contentCycle');
    expect(config.method).toBe('POST');
  });
});
