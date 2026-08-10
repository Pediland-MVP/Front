import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { useEffect } from 'react';

vi.mock('@/utils/automationDraft', () => ({
  writeAutomationDraft: vi.fn(),
}));

import { writeAutomationDraft } from '@/utils/automationDraft';
import { AutomationDraftWatcher } from './AutomationDraftWatcher';

const WORKSPACE_ID = 'ws-1';

function Harness({ workspaceId, onDirty }: { workspaceId: string | null; onDirty?: () => void }) {
  const methods = useForm({ defaultValues: { title: '' } });
  return (
    <FormProvider {...methods}>
      <input data-testid="title" {...methods.register('title')} />
      <AutomationDraftWatcher workspaceId={workspaceId} onDirty={onDirty} />
    </FormProvider>
  );
}

function HarnessWithMountTimeDirtyFlip({
  workspaceId,
  onDirty,
}: {
  workspaceId: string | null;
  onDirty?: () => void;
}) {
  const methods = useForm({ defaultValues: { title: '' } });
  // Mirrors `Contents.tsx`'s mount-time `setValue(..., { shouldDirty: true })` auto-insert
  // effect — a programmatic write, not a user edit.
  useEffect(() => {
    methods.setValue('title', 'auto-inserted', { shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <FormProvider {...methods}>
      <input data-testid="title" {...methods.register('title')} />
      <AutomationDraftWatcher workspaceId={workspaceId} onDirty={onDirty} />
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

  it('does not call onDirty while the form is still pristine', () => {
    const onDirty = vi.fn();
    render(<Harness workspaceId={WORKSPACE_ID} onDirty={onDirty} />);
    expect(onDirty).not.toHaveBeenCalled();
  });

  it('calls onDirty as soon as the form becomes dirty, independent of the save debounce', async () => {
    const onDirty = vi.fn();
    const { getByTestId } = render(<Harness workspaceId={WORKSPACE_ID} onDirty={onDirty} />);

    act(() => {
      vi.advanceTimersByTime(0); // let the "armed" tick pass
    });

    await act(async () => {
      fireEvent.change(getByTestId('title'), { target: { value: 'hello' } });
    });

    expect(onDirty).toHaveBeenCalled();
    expect(writeAutomationDraft).not.toHaveBeenCalled();
  });

  it('ignores a mount-time programmatic dirty flip, but still calls onDirty on a later real edit', async () => {
    const onDirty = vi.fn();
    const { getByTestId } = render(
      <HarnessWithMountTimeDirtyFlip workspaceId={WORKSPACE_ID} onDirty={onDirty} />,
    );

    expect(getByTestId('title')).toHaveValue('auto-inserted');
    expect(onDirty).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(0); // let the "armed" tick pass — a real edit always lands after this
    });

    await act(async () => {
      fireEvent.change(getByTestId('title'), { target: { value: 'a real edit' } });
    });

    expect(onDirty).toHaveBeenCalled();
  });
});
