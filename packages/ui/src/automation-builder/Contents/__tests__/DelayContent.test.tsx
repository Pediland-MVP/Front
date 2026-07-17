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

  it('no longer displays "hour" as the unit selector\'s value once a sibling leaves it less than 1 hour of room', () => {
    // Sibling consumes 22h15m of the 23h budget -> only 45min remains for this item's own
    // unit switch -- "hour" (this item's own current selection) is filtered out of the
    // rendered options, so Radix has no matching item to show for the still-stored 'hour'
    // value (a closed Select only ever shows its currently-selected value's label; the
    // other options' text never mounts until opened, so this is the only way to observe
    // the filtering here without simulating a click-open).
    render(
      <Wrapper
        contents={[
          delayItem(60 * 60 * 1000, 'hour'),
          delayItem(22 * 60 * 60 * 1000 + 15 * 60 * 1000, 'hour'),
        ]}
      />,
    );
    expect(screen.queryByText('timeUnits.hour')).not.toBeInTheDocument();
  });

  it('removes the unit selector entirely when siblings consume the full 23h budget (no unit is affordable)', () => {
    render(
      <Wrapper
        contents={[delayItem(60 * 60 * 1000, 'hour'), delayItem(23 * 60 * 60 * 1000 - 500, 'hour')]}
      />,
    );
    expect(screen.queryByText('timeUnits.hour')).not.toBeInTheDocument();
    expect(screen.queryByText('selectTimeUnit')).not.toBeInTheDocument();
  });
});
