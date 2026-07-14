import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { Conditions } from '../Conditions';

// Conditions renders translated copy for every condition type via `useTranslations`.
// Without a `NextIntlClientProvider` this throws "No intl context found" — stub it to
// echo the key back, same approach as Contents.test.tsx.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fa',
}));

function Wrapper() {
  const form = useForm({
    defaultValues: {
      conditionType: 'EQUAL',
      conditions: [{ type: 'EQUAL', value: '' }],
    },
  });
  return (
    <FormProvider {...form}>
      <Conditions
        control={form.control}
        getValues={form.getValues}
        helpSlot={<span data-testid="help-slot">help</span>}
      />
    </FormProvider>
  );
}

describe('Conditions (shared, moved to packages/ui)', () => {
  it('renders the injected helpSlot instead of a hardcoded HelpMeDialog', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('help-slot')).toBeInTheDocument();
  });
});
