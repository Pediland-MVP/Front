import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { Contents } from '../Contents';
import { AutomationContentModeEnum } from '../../constants/automationContent.enum';
import type { AutomationBuilderApiClient } from '../../types/apiClient';
import type { AutomationBuilderMode } from '../../AutomationBuilder.types';

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

function Wrapper({
  apiClient,
  builderMode,
  mode,
}: {
  apiClient?: AutomationBuilderApiClient;
  builderMode?: AutomationBuilderMode;
  mode?: AutomationContentModeEnum;
}) {
  const form = useForm({ defaultValues: { contents: [], reminders: [] } });
  return (
    <FormProvider {...form}>
      <Contents
        mode={mode ?? AutomationContentModeEnum.AUTOMATION}
        apiClient={apiClient ?? { upload: vi.fn(), get: vi.fn() }}
        helpSlot={<span data-testid="help-slot">help</span>}
        builderMode={builderMode}
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

describe('Contents — "template" content-type option (Task 27)', () => {
  it('shows the "template" option by default (builderMode omitted/"automation") and opens the shared TemplatePicker on select', async () => {
    const get = vi.fn().mockResolvedValue({ data: { items: [] } });
    render(<Wrapper apiClient={{ upload: vi.fn(), get }} />);

    fireEvent.click(screen.getByText('افزودن محتوا'));
    // Under the next-intl mock above, `t_contentTypes(\`buttons.titles.${value}\`)` echoes
    // its key back verbatim.
    const templateOption = screen.getByText('buttons.titles.template');
    expect(templateOption).toBeInTheDocument();

    fireEvent.click(templateOption);

    // Opens the TemplatePicker (its DialogTitle is `t_templatePicker('searchPlaceholder')`,
    // which the same mock echoes back as the literal key) and fetches the template list
    // via the injected `apiClient.get` (not a new `fetchTemplateDetail` method).
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith(expect.stringContaining('/templates?search=')),
    );
    expect(screen.getByText('searchPlaceholder')).toBeInTheDocument();
  });

  it('hides the "template" option entirely when builderMode="template" (a template cannot embed another template)', () => {
    const get = vi.fn();
    render(<Wrapper apiClient={{ upload: vi.fn(), get }} builderMode="template" />);

    fireEvent.click(screen.getByText('افزودن محتوا'));

    expect(screen.queryByText('buttons.titles.template')).not.toBeInTheDocument();
    // Sanity check: the other options are still there — this isn't an empty list.
    expect(screen.getByText('buttons.titles.text')).toBeInTheDocument();
    // Never renders the TemplatePicker (and never calls `apiClient.get` for it either),
    // since `builderMode !== 'template'` gates its whole subtree in `Contents.tsx`.
    expect(get).not.toHaveBeenCalled();
  });

  it('hides the "template" option when mode=REMINDER, even though builderMode defaults to "automation" (Reminder.tsx never passes builderMode)', () => {
    const get = vi.fn();
    render(
      <Wrapper apiClient={{ upload: vi.fn(), get }} mode={AutomationContentModeEnum.REMINDER} />,
    );

    fireEvent.click(screen.getByText('افزودن محتوا'));

    expect(screen.queryByText('buttons.titles.template')).not.toBeInTheDocument();
    // Sanity check: the other options are still there — this isn't an empty list.
    expect(screen.getByText('buttons.titles.text')).toBeInTheDocument();
    // Never renders the TemplatePicker.
    expect(get).not.toHaveBeenCalled();
  });

  it('still shows the "template" option for mode=AUTOMATION with builderMode="automation" (unchanged behavior)', () => {
    render(<Wrapper mode={AutomationContentModeEnum.AUTOMATION} builderMode="automation" />);

    fireEvent.click(screen.getByText('افزودن محتوا'));

    expect(screen.getByText('buttons.titles.template')).toBeInTheDocument();
  });
});
