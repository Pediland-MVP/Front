import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

vi.mock('@/hooks/swr/api-client', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { data: { id: 't1' } } }),
    patch: vi.fn().mockResolvedValue({ data: { data: { id: 't1' } } }),
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
  fetcher: vi.fn(),
}));
vi.mock('swr', () => ({
  default: () => ({ data: { items: [{ id: 'c1', nameFa: 'فروشگاهی' }] }, isLoading: false }),
}));
vi.mock('swr/immutable', () => ({
  default: () => ({ data: undefined, isLoading: false, error: undefined }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ChooseAutomationType (rendered inside the shared Contents section) uses `useMediaQuery`,
// which calls `matchMedia` — jsdom doesn't implement it. Radix's `Switch` (Triggers/
// TargetPostComment, and this form's own "applies to all categories" toggle) measures
// itself via `ResizeObserver` on mount, which jsdom also doesn't implement. Same stubs
// `packages/ui`'s own `AutomationBuilder.test.tsx` and the dashboard's `AutomationForm.test.tsx` use.
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

import TemplateForm from '../TemplateForm';

describe('TemplateForm (admin create)', () => {
  it('hides the category multi-select when "applies to all categories" is toggled on', () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplateForm />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'اعمال روی همه دسته‌بندی‌ها' }));
    expect(screen.queryByPlaceholderText('انتخاب دسته‌بندی')).not.toBeInTheDocument();
  });

  it('submits templateTitle to POST /templates on save', async () => {
    const api = (await import('@/hooks/swr/api-client')).default as any;
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <TemplateForm />
      </NextIntlClientProvider>,
    );
    fireEvent.change(screen.getByLabelText('عنوان'), { target: { value: 'خوش‌آمدگویی' } });
    fireEvent.click(screen.getByText('ذخیره'));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/templates',
        expect.objectContaining({ templateTitle: 'خوش‌آمدگویی' }),
      ),
    );
  });
});
