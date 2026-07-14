import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { Contents } from '../Contents';
import { AutomationContentModeEnum } from '../../constants/automationContent.enum';

// Contents/ChooseAutomationType render many `useTranslations(...)` calls. Without a
// `NextIntlClientProvider` this throws "No intl context found" (same issue MediaContent's
// test hit) — stub it to echo the key back, except for the one key this test actually
// asserts on ("add_content"), which we resolve to its real Persian copy so the test can
// find the button the same way the brief's test does.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => (key === 'add_content' ? 'افزودن محتوا' : key),
  useLocale: () => 'fa',
}));

// ChooseAutomationType uses `useMediaQuery`, which calls `matchMedia` — jsdom doesn't
// implement it, so stub a "not mobile" result.
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
});

function Wrapper() {
  const form = useForm({ defaultValues: { contents: [] } });
  return (
    <FormProvider {...form}>
      <Contents
        mode={AutomationContentModeEnum.AUTOMATION}
        apiClient={{ upload: vi.fn(), get: vi.fn() }}
        helpSlot={<span data-testid="help-slot">help</span>}
      />
    </FormProvider>
  );
}

describe('Contents (shared, mode=automation)', () => {
  it('renders the injected helpSlot instead of a hardcoded HelpMeDialog', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('help-slot')).toBeInTheDocument();
  });

  it('opens the ChooseAutomationType picker on add-content click', () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByText('افزودن محتوا'));
    expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
  });
});
