import { describe, it, expect, vi, beforeAll } from 'vitest';
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

// Spy on the real `sonner` toast so `handleInvalid`'s generic "please fix the form" toast
// (the Finding 2 fix — an `onInvalid` prop wired to `AutomationBuilder`'s internal
// `form.handleSubmit`'s second argument) is observable without mocking away the rest of
// the module (other toasts, e.g. `Toast.copied`, aren't exercised by this file).
// `vi.mock` factories are hoisted above imports, so the spy must be created via
// `vi.hoisted` rather than a plain top-level `const` (which would still be in the
// temporal-dead-zone when the hoisted factory runs).
const { toastErrorSpy } = vi.hoisted(() => ({ toastErrorSpy: vi.fn() }));
vi.mock('sonner', async () => {
  const actual = await vi.importActual<typeof import('sonner')>('sonner');
  return {
    ...actual,
    toast: { ...actual.toast, error: toastErrorSpy, success: vi.fn() },
  };
});

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

  it('shows the generic form-errors toast (Finding 2 fix: onInvalid wired to AutomationBuilder) when submitting a brand-new, still-empty automation', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AutomationForm />
      </NextIntlClientProvider>,
    );
    // A brand-new automation starts with no `instagramIds`/`contents` — `AutomationFormSchema`
    // rejects both as empty, so this submit never reaches `handleBeforeSubmit`/`submitAutomation`;
    // it only exercises `form.handleSubmit`'s "onInvalid" branch, i.e. the new `onInvalid` prop.
    fireEvent.click(screen.getByText('ایجاد پیام خودکار'));
    await waitFor(() =>
      expect(toastErrorSpy).toHaveBeenCalledWith(messages.Automations.form_errors),
    );
  });
});
