import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { SWRConfig } from 'swr';
import { AutomationSearchSelect } from '../AutomationSearchSelect';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// cmdk (the `Command` list under the popover) measures itself via ResizeObserver and
// scrolls the highlighted item into view — neither is implemented by jsdom.
beforeEach(() => {
  (global as any).ResizeObserver =
    (global as any).ResizeObserver ??
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
});

const CONDITIONS_RESPONSE = {
  data: {
    items: [{ value: 'سلام', contentCycleId: 'dest-cc-1' }],
  },
};

function Wrapper({
  apiClient,
  instagramIds,
  onSelect,
}: {
  apiClient: { get: ReturnType<typeof vi.fn> };
  instagramIds: string[];
  onSelect: (value: string, label: string) => void;
}) {
  const form = useForm({ defaultValues: { instagramIds } });
  return (
    // Fresh SWR cache per render — otherwise the identical `/contentCycle/conditions?...`
    // key from an earlier test in this file dedupes the fetch and this test would never
    // observe a real network call.
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <FormProvider {...form}>
        <AutomationSearchSelect onSelect={onSelect} apiClient={apiClient} />
      </FormProvider>
    </SWRConfig>
  );
}

describe('AutomationSearchSelect', () => {
  it("sends the automation form's instagramIds when the picker opens, as repeated query keys", async () => {
    const get = vi.fn().mockResolvedValue(CONDITIONS_RESPONSE);
    render(<Wrapper apiClient={{ get }} instagramIds={['ig-1', 'ig-2']} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('combobox'));

    await waitFor(() => expect(get).toHaveBeenCalled());
    const calledUrl: string = get.mock.calls[0][0];
    const params = new URLSearchParams(calledUrl.split('?')[1]);
    expect(params.getAll('instagramIds')).toEqual(['ig-1', 'ig-2']);
  });

  it('does NOT call the API when the automation has no linked Instagram accounts yet (avoids the guaranteed 400)', async () => {
    const get = vi.fn().mockResolvedValue(CONDITIONS_RESPONSE);
    render(<Wrapper apiClient={{ get }} instagramIds={[]} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('combobox'));

    // Give any (incorrect) fetch a chance to fire before asserting it didn't.
    await new Promise((r) => setTimeout(r, 50));
    expect(get).not.toHaveBeenCalled();
  });

  it('lets the user pick a destination automation once results load', async () => {
    const get = vi.fn().mockResolvedValue(CONDITIONS_RESPONSE);
    const onSelect = vi.fn();
    render(<Wrapper apiClient={{ get }} instagramIds={['ig-1']} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('combobox'));

    const item = await waitFor(() => {
      const el = screen.getByText('سلام');
      expect(el).toBeTruthy();
      return el;
    });
    fireEvent.click(item);

    expect(onSelect).toHaveBeenCalledWith('dest-cc-1', 'سلام');
  });
});
