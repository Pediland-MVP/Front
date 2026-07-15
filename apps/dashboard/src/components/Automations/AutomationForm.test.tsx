import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
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

// ChooseAutomationType (rendered inside the shared Contents) uses `useMediaQuery`, which
// calls `matchMedia` — jsdom doesn't implement it. Radix's `Switch` (Triggers/JustFollowers)
// measures itself via `ResizeObserver` on mount, which jsdom also doesn't implement. Same
// stub `packages/ui`'s own `AutomationBuilder.test.tsx` uses.
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

describe('AutomationForm (dashboard thin wrapper)', () => {
  it('renders the shared AutomationBuilder root', () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm />
      </NextIntlClientProvider>,
    );
    expect(screen.getByTestId('automation-builder-root')).toBeInTheDocument();
  });
});
