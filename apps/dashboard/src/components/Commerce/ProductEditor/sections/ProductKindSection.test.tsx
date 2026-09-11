import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

import messages from '@/messages/fa.json';
import { buildEmptyProductForm, type ProductFormValues } from '../productEditor.schema';

import { ProductKindSection } from './ProductKindSection';

const Wrapper = ({ initial }: { initial?: Partial<ProductFormValues> }) => {
  const form = useForm<ProductFormValues>({
    defaultValues: { ...buildEmptyProductForm(), ...initial },
  });
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <FormProvider {...form}>
        <ProductKindSection step={1} />
      </FormProvider>
    </NextIntlClientProvider>
  );
};

describe('ProductKindSection', () => {
  it('marks physical as pressed by default', () => {
    render(<Wrapper />);
    const copy = messages.Commerce.Editor.Kind;
    expect(screen.getByRole('button', { name: copy.physical })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: copy.digital })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('marks digital as pressed when the form already holds it', () => {
    render(<Wrapper initial={{ kind: 'digital' }} />);
    const copy = messages.Commerce.Editor.Kind;
    expect(screen.getByRole('button', { name: copy.digital })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('switches the form value when the other card is clicked', () => {
    render(<Wrapper />);
    const copy = messages.Commerce.Editor.Kind;
    fireEvent.click(screen.getByRole('button', { name: copy.digital }));
    expect(screen.getByRole('button', { name: copy.digital })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: copy.physical })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
