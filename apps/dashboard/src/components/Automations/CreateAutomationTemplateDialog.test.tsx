import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

// Both actions now go through the business-info gate instead of router.push. Mocked here
// rather than exercised: the blanket `swr` mock below answers every useSWR call with the
// templates payload, which would feed the real hook's useUser a bogus shape.
const startAutomationCreate = vi.fn();
vi.mock('@/hooks/useBusinessInfoGate', () => ({
  useBusinessInfoGate: () => ({ needsBusinessInfo: false, startAutomationCreate }),
}));
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
  beforeEach(() => {
    push.mockClear();
    startAutomationCreate.mockClear();
  });

  it('starts create for /automations/add?templateId=<id> when a template card is clicked', async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <CreateAutomationTemplateDialog open onOpenChange={vi.fn()} />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByText('خوش‌آمدگویی'));
    await waitFor(() =>
      expect(startAutomationCreate).toHaveBeenCalledWith('/automations/add?templateId=t1'),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('has a "start from scratch" action that starts create for /automations/add with no query', () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <CreateAutomationTemplateDialog open onOpenChange={vi.fn()} />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByText('شروع از ابتدا'));
    expect(startAutomationCreate).toHaveBeenCalledWith('/automations/add');
    expect(push).not.toHaveBeenCalled();
  });
});
