import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

const { mockUseSWRImmutable } = vi.hoisted(() => ({ mockUseSWRImmutable: vi.fn() }));
vi.mock('swr/immutable', () => ({
  default: (...args: unknown[]) => mockUseSWRImmutable(...args),
}));

const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: mockCan }) }));

import messages from '@/messages/fa.json';
import { TagsSection } from './TagsSection';
import { buildEmptyProductFormValues, type ProductFormValues } from '../productForm.schema';

let latest: ProductFormValues | null = null;

function Harness({ tags = [] as string[] }) {
  const form = useForm<ProductFormValues>({
    defaultValues: { ...buildEmptyProductFormValues(), tags },
  });
  latest = form.watch();
  return (
    <FormProvider {...form}>
      <TagsSection mode="create" />
    </FormProvider>
  );
}

const renderSection = (tags: string[] = []) => {
  latest = null;
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <Harness tags={tags} />
    </NextIntlClientProvider>,
  );
};

const pool = (items: string[]) => ({
  items,
  meta: {
    currentPage: 1,
    itemCount: items.length,
    itemsPerPage: items.length,
    totalItems: items.length,
    totalPages: 1,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSWRImmutable.mockReturnValue({ data: pool([]), error: undefined, isLoading: false });
  mockCan.mockReset().mockReturnValue(true);
});

describe('TagsSection', () => {
  it('reads the workspace pool for suggestions', () => {
    renderSection();
    expect(mockUseSWRImmutable).toHaveBeenCalledWith('/commerce/tags');
  });

  it('adds a typed tag to the form on Enter, without submitting the product form', () => {
    renderSection();

    const input = screen.getByTestId('tag-input');
    fireEvent.change(input, { target: { value: 'کتانی' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(latest?.tags).toEqual(['کتانی']);
    // The field clears so the next tag can be typed straight away.
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('trims surrounding whitespace before adding', () => {
    renderSection();

    fireEvent.change(screen.getByTestId('tag-input'), { target: { value: '  دویدن  ' } });
    fireEvent.keyDown(screen.getByTestId('tag-input'), { key: 'Enter' });

    expect(latest?.tags).toEqual(['دویدن']);
  });

  it('ignores an empty or whitespace-only tag', () => {
    renderSection();

    fireEvent.change(screen.getByTestId('tag-input'), { target: { value: '   ' } });
    fireEvent.keyDown(screen.getByTestId('tag-input'), { key: 'Enter' });

    expect(latest?.tags).toEqual([]);
  });

  // The backend de-duplicates case-insensitively; letting the UI disagree would show a tag
  // that silently vanishes on save.
  it('refuses a duplicate case-insensitively, matching the backend', () => {
    renderSection(['Running']);

    fireEvent.change(screen.getByTestId('tag-input'), { target: { value: 'running' } });
    fireEvent.keyDown(screen.getByTestId('tag-input'), { key: 'Enter' });

    expect(latest?.tags).toEqual(['Running']);
  });

  it('removes a tag', () => {
    renderSection(['کتانی', 'دویدن']);

    fireEvent.click(screen.getByTestId('tag-remove-کتانی'));

    expect(latest?.tags).toEqual(['دویدن']);
  });

  it('offers pool tags as suggestions and adds one on click', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: pool(['مش تنفسی']),
      error: undefined,
      isLoading: false,
    });
    renderSection();

    fireEvent.click(screen.getByTestId('tag-suggestion-مش تنفسی'));

    expect(latest?.tags).toEqual(['مش تنفسی']);
  });

  it('hides a pool tag from suggestions once it is already applied', () => {
    mockUseSWRImmutable.mockReturnValue({
      data: pool(['کتانی']),
      error: undefined,
      isLoading: false,
    });
    renderSection(['کتانی']);

    expect(screen.queryByTestId('tag-suggestion-کتانی')).not.toBeInTheDocument();
  });

  it('hides every editing control without permission', () => {
    mockCan.mockReturnValue(false);
    renderSection(['کتانی']);

    expect(screen.queryByTestId('tag-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tag-remove-کتانی')).not.toBeInTheDocument();
    // The tag itself still renders — a viewer sees what the product carries.
    expect(screen.getByText('کتانی')).toBeInTheDocument();
  });
});
