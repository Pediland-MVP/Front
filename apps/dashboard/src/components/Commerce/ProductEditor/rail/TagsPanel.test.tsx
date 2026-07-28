import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

// The panel toasts on every add/remove. Stub sonner so the assertions below are about form
// state, not about a toast portal that jsdom would have to mount.
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import messages from '@/messages/fa.json';
import { TagsPanel } from './TagsPanel';
import { buildEmptyProductForm, type ProductFormValues } from '../productEditor.schema';

// The harness's `form.watch()` (no name) subscribes the HOST component to every change, so
// `latest` is re-assigned on each re-render and always holds the current form values.
let latest: ProductFormValues | null = null;

function Harness({ tags, pool }: { tags: string[]; pool: string[] }) {
  const form = useForm<ProductFormValues>({
    defaultValues: { ...buildEmptyProductForm(), tags },
  });
  latest = form.watch();
  return (
    <FormProvider {...form}>
      <TagsPanel pool={pool} />
    </FormProvider>
  );
}

const renderPanel = (tags: string[] = [], pool: string[] = []) => {
  latest = null;
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <Harness tags={tags} pool={pool} />
    </NextIntlClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TagsPanel', () => {
  it('adds a typed tag on Enter and clears the field', () => {
    renderPanel();

    const input = screen.getByTestId('tag-input');
    fireEvent.change(input, { target: { value: 'کتانی' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(latest?.tags).toEqual(['کتانی']);
    expect((input as HTMLInputElement).value).toBe('');
  });

  // The merchant pastes "کتانی، دویدن" in one go; splitting on BOTH commas matters because a
  // Persian keyboard produces `،`, not `,`.
  it('splits a comma-separated entry into several tags at once', () => {
    renderPanel();

    fireEvent.change(screen.getByTestId('tag-input'), { target: { value: 'کتانی، دویدن' } });
    fireEvent.keyDown(screen.getByTestId('tag-input'), { key: 'Enter' });

    expect(latest?.tags).toEqual(['کتانی', 'دویدن']);
  });

  it('splits on the ASCII comma too, and trims each part', () => {
    renderPanel();

    fireEvent.change(screen.getByTestId('tag-input'), { target: { value: ' چرم , مش تنفسی ' } });
    fireEvent.click(screen.getByTestId('tag-add'));

    expect(latest?.tags).toEqual(['چرم', 'مش تنفسی']);
  });

  // The backend resolves-or-creates tags case-insensitively; letting the UI disagree would show
  // a chip that silently merges into another one on save.
  it('ignores a duplicate, case-insensitively', () => {
    renderPanel(['Running']);

    fireEvent.change(screen.getByTestId('tag-input'), { target: { value: 'running' } });
    fireEvent.keyDown(screen.getByTestId('tag-input'), { key: 'Enter' });

    expect(latest?.tags).toEqual(['Running']);
  });

  it('keeps the new names when only some of a comma list are duplicates', () => {
    renderPanel(['کتانی']);

    fireEvent.change(screen.getByTestId('tag-input'), { target: { value: 'کتانی،دویدن' } });
    fireEvent.keyDown(screen.getByTestId('tag-input'), { key: 'Enter' });

    expect(latest?.tags).toEqual(['کتانی', 'دویدن']);
  });

  it('adds a suggestion on click and drops it from the suggestion list', () => {
    renderPanel([], ['مش تنفسی', 'چرم']);

    expect(screen.getByTestId('tag-suggestion-مش تنفسی')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tag-suggestion-مش تنفسی'));

    expect(latest?.tags).toEqual(['مش تنفسی']);
    expect(screen.queryByTestId('tag-suggestion-مش تنفسی')).not.toBeInTheDocument();
    // The other pool entry is untouched — only the applied one leaves the list.
    expect(screen.getByTestId('tag-suggestion-چرم')).toBeInTheDocument();
  });

  it('removes a tag with its ✕', () => {
    renderPanel(['کتانی', 'دویدن']);

    fireEvent.click(screen.getByTestId('tag-remove-کتانی'));

    expect(latest?.tags).toEqual(['دویدن']);
  });

  it('shows the empty-state copy when the product carries no tag', () => {
    renderPanel();

    expect(screen.getByText(messages.Commerce.Editor.Tags.empty)).toBeInTheDocument();
  });

  it('disables the add button at the 30-tag limit', () => {
    renderPanel(Array.from({ length: 30 }, (_, index) => `tag-${index}`));

    fireEvent.change(screen.getByTestId('tag-input'), { target: { value: 'یکی بیشتر' } });

    expect(screen.getByTestId('tag-add')).toBeDisabled();
  });
});
