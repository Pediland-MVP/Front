import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/hooks/useUser', () => ({
  default: () => ({ user: null, hasInstagram: true, isLoading: false }),
}));

const fetchSpy = vi.fn().mockResolvedValue({
  templateTitle: 'خوش‌آمدگویی',
  contents: [{ type: 'text', text: 'سلام!' }],
  conditions: [],
});

vi.mock('swr/immutable', () => ({
  default: (key: string | null) => ({
    data: key?.startsWith('/templates') ? fetchSpy() : undefined,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Same jsdom stubs `AutomationForm.test.tsx` uses — `AutomationBuilder` renders content that
// measures itself via `matchMedia`/`ResizeObserver`, neither implemented by jsdom.
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

describe('AutomationForm templateId prefill', () => {
  it('fetches GET /templates/:id (not /contentCycle/:id) when templateId is provided', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm templateId="11111111-1111-4111-8111-111111111111" />
      </NextIntlClientProvider>,
    );
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
  });
});
