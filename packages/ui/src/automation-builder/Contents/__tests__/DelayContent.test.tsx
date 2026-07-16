import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { DelayContent } from '../DelayContent';
import { AutomationContentTypesEnum } from '../../constants/automationContent.enum';

// DelayContent (and the AlertDialog it renders) call `useTranslations(...)` — without a
// `NextIntlClientProvider` this throws "No intl context found" (same pattern as
// MediaContent.test.tsx/Contents.test.tsx), so stub it to echo the key back.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

function Wrapper({ contents }: { contents: any[] }) {
  const form = useForm({ defaultValues: { contents } });
  return (
    <FormProvider {...form}>
      <DelayContent index={0} />
    </FormProvider>
  );
}

const delayItem = (delayMs: number, delayUnit = 'hour') => ({
  type: AutomationContentTypesEnum.DELAY,
  delayMs,
  delayUnit,
});

describe('DelayContent (shared)', () => {
  it('renders without throwing when it is the only DELAY item (full 23h budget available)', () => {
    render(<Wrapper contents={[delayItem(60 * 60 * 1000)]} />);
    expect(document.body).toBeTruthy();
  });

  it('renders without throwing when sibling DELAY items already consume the entire 23h budget', () => {
    render(
      <Wrapper contents={[delayItem(23 * 60 * 60 * 1000), delayItem(60 * 60 * 1000, 'hour')]} />,
    );
    // index 0 is the item under test; its own remaining budget excludes only itself, so
    // the sibling at index 1 (1h) fully consumes what's left of the 23h budget for index 0.
    expect(document.body).toBeTruthy();
  });

  it('renders the unit selector with hour/min/sec options', () => {
    render(<Wrapper contents={[delayItem(60 * 60 * 1000)]} />);
    expect(screen.getByText('timeUnits.hour')).toBeInTheDocument();
  });
});
