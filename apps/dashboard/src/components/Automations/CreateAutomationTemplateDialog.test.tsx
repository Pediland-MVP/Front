import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('swr', () => ({
  default: () => ({
    data: {
      items: [
        { id: 't1', templateTitle: 'خوش‌آمدگویی', templateDescription: null, templateImage: null },
      ],
    },
    isLoading: false,
  }),
}));

// TemplatePicker (rendered inside) uses `useMediaQuery`, which calls `matchMedia` — jsdom
// doesn't implement it. Same stub `AutomationForm.test.tsx` uses for the shared builder.
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
});

import messages from '@/messages/fa.json';
import { CreateAutomationTemplateDialog } from './CreateAutomationTemplateDialog';

describe('CreateAutomationTemplateDialog', () => {
  it('navigates to /automations/add?templateId=<id> when a template card is clicked', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <CreateAutomationTemplateDialog open onOpenChange={vi.fn()} />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByText('خوش‌آمدگویی'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/automations/add?templateId=t1'));
  });

  it('has a "start from scratch" action navigating to /automations/add with no query', () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <CreateAutomationTemplateDialog open onOpenChange={vi.fn()} />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByText('شروع از ابتدا'));
    expect(push).toHaveBeenCalledWith('/automations/add');
  });
});
