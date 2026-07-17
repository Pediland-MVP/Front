import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';

vi.mock('@/utils/automationDraft', () => ({
  writeAutomationDraft: vi.fn(),
}));

import { writeAutomationDraft } from '@/utils/automationDraft';
import { AutomationDraftWatcher } from './AutomationDraftWatcher';

const WORKSPACE_ID = 'ws-1';

function Harness({ workspaceId }: { workspaceId: string | null }) {
  const methods = useForm({ defaultValues: { title: '' } });
  return (
    <FormProvider {...methods}>
      <input data-testid="title" {...methods.register('title')} />
      <AutomationDraftWatcher workspaceId={workspaceId} />
    </FormProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AutomationDraftWatcher', () => {
  it('does not save while the form is still pristine', () => {
    render(<Harness workspaceId={WORKSPACE_ID} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(writeAutomationDraft).not.toHaveBeenCalled();
  });

  it('debounce-saves the form once it becomes dirty', async () => {
    const { getByTestId } = render(<Harness workspaceId={WORKSPACE_ID} />);

    await act(async () => {
      fireEvent.focus(getByTestId('title'));
      fireEvent.change(getByTestId('title'), { target: { value: 'hello' } });
    });

    expect(writeAutomationDraft).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(writeAutomationDraft).toHaveBeenCalledTimes(1);
    expect(writeAutomationDraft).toHaveBeenCalledWith(
      WORKSPACE_ID,
      expect.objectContaining({ title: 'hello' }),
    );
  });

  it('does nothing when workspaceId is null', async () => {
    const { getByTestId } = render(<Harness workspaceId={null} />);

    await act(async () => {
      fireEvent.change(getByTestId('title'), { target: { value: 'hello' } });
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(writeAutomationDraft).not.toHaveBeenCalled();
  });
});
