import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: mockCan }) }));

import messages from '@/messages/fa.json';
import { SpecsSection } from './SpecsSection';
import { buildEmptyProductFormValues, type ProductFormValues } from '../productForm.schema';

let latest: ProductFormValues | null = null;

function Harness({ specs }: { specs: ProductFormValues['specs'] }) {
  const form = useForm<ProductFormValues>({
    defaultValues: { ...buildEmptyProductFormValues(), specs },
  });
  latest = form.watch();
  return (
    <FormProvider {...form}>
      <SpecsSection step={8} mode="create" />
    </FormProvider>
  );
}

const renderSection = (specs: ProductFormValues['specs'] = []) => {
  latest = null;
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <Harness specs={specs} />
    </NextIntlClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCan.mockReset().mockReturnValue(true);
});

describe('SpecsSection', () => {
  it('shows an empty state when the product has no specs', () => {
    renderSection();
    expect(screen.getByText(messages.Commerce.Editor.Specs.empty)).toBeInTheDocument();
  });

  it('appends a blank row', () => {
    renderSection();

    fireEvent.click(screen.getByTestId('spec-add'));

    expect(latest?.specs).toEqual([{ title: '', body: '' }]);
    expect(screen.getByTestId('spec-title-0')).toBeInTheDocument();
  });

  it('writes the title and body into the form', () => {
    renderSection([{ title: '', body: '' }]);

    fireEvent.change(screen.getByTestId('spec-title-0'), { target: { value: 'جنس رویه' } });
    fireEvent.change(screen.getByTestId('spec-body-0'), { target: { value: 'مش تنفسی' } });

    expect(latest?.specs).toEqual([{ title: 'جنس رویه', body: 'مش تنفسی' }]);
  });

  it('removes the right row, keeping order', () => {
    renderSection([
      { title: 'a', body: '1' },
      { title: 'b', body: '2' },
      { title: 'c', body: '3' },
    ]);

    fireEvent.click(screen.getByTestId('spec-remove-1'));

    expect(latest?.specs).toEqual([
      { title: 'a', body: '1' },
      { title: 'c', body: '3' },
    ]);
  });

  it('preserves order, since specs are an ordered list rather than a set', () => {
    renderSection([
      { title: 'first', body: '1' },
      { title: 'second', body: '2' },
    ]);

    expect((screen.getByTestId('spec-title-0') as HTMLInputElement).value).toBe('first');
    expect((screen.getByTestId('spec-title-1') as HTMLInputElement).value).toBe('second');
  });

  // Mirrors the backend's @ArrayMaxSize(50): better a disabled button than a 400 after the
  // merchant has typed the 51st row.
  it('disables adding at the backend limit of 50', () => {
    renderSection(Array.from({ length: 50 }, (_, i) => ({ title: `t${i}`, body: `b${i}` })));

    expect(screen.getByTestId('spec-add')).toBeDisabled();
  });

  it('hides add/remove and disables the inputs without permission', () => {
    mockCan.mockReturnValue(false);
    renderSection([{ title: 'جنس رویه', body: 'مش تنفسی' }]);

    expect(screen.queryByTestId('spec-add')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spec-remove-0')).not.toBeInTheDocument();
    expect(screen.getByTestId('spec-title-0')).toBeDisabled();
  });
});
