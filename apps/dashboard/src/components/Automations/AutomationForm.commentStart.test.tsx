import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/hooks/useUser', () => ({
  default: () => ({ user: null, hasInstagram: true, isLoading: false }),
}));

// A comment-triggered automation whose FIRST content is a QUESTION, followed by another
// content. The backend (`handleComment` in
// `Back/apps/core/src/contentCycle/contentCycleMessage.service.ts`) treats this as
// `firstContentSelfGates` and NEVER sends the separate start-request message, so
// `commentStartText` is unused — and `StartAutomationMessage` correspondingly hides the
// field and clears the value to ''. The dashboard's `handleBeforeSubmit` guard used to
// still demand a non-empty `commentStartText` here, blocking the submit on a field that
// was no longer rendered — an unfixable dead end for the user. BEF-162.
const copySource = {
  isDirect: false,
  isComment: true,
  isNoCondition: false,
  justFollowers: false,
  conditions: [{ type: 'EQUAL', value: 'test' }],
  contents: [
    {
      type: 'question',
      text: 'شماره موبایلت رو بفرست',
      validationType: 'text',
      validationErrorMessage: 'نامعتبر است',
    },
    { type: 'text', text: 'ممنون!' },
  ],
  instagramLinks: [{ instagramId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }],
};

vi.mock('swr/immutable', () => ({
  default: (key: string | null) => ({
    data: key?.startsWith('/contentCycle') ? copySource : undefined,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
  }),
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

// `vi.hoisted` because `vi.mock`'s factory is hoisted above normal `const`s — a plain
// top-level `const toastError` would still be in its TDZ when the factory runs.
const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock('sonner', async () => {
  const actual = await vi.importActual<typeof import('sonner')>('sonner');
  return {
    ...actual,
    toast: { ...actual.toast, error: toastError, success: vi.fn() },
  };
});

// Same jsdom stubs the sibling AutomationForm tests use — AutomationBuilder renders
// content that measures itself via matchMedia/ResizeObserver, neither implemented by jsdom.
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

describe('AutomationForm commentStartText guard', () => {
  it('submits a comment automation whose first content is a QUESTION, without demanding commentStartText', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm copyFromId="22222222-2222-4222-8222-222222222222" />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('ایجاد پیام خودکار')).toBeInTheDocument());
    fireEvent.click(screen.getByText('ایجاد پیام خودکار'));

    // The submit must actually reach the API. Before the fix, `handleBeforeSubmit`
    // returned false here and `post` was never called.
    await waitFor(() => expect(post).toHaveBeenCalled());
    const [config] = post.mock.calls[0];
    expect(config.url).toBe('/contentCycle');
    expect(config.method).toBe('POST');

    // And the user must never have seen the (unsatisfiable) start-request error.
    expect(toastError).not.toHaveBeenCalledWith('در حالت کامنت، پیام درخواست شروع ضروری است');
  });
});
