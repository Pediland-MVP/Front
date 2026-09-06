import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

import messages from '@/messages/fa.json';
import { buildEmptyProductForm, type ProductFormValues } from '../productEditor.schema';

import { FinalMessageSection } from './FinalMessageSection';

const Wrapper = ({ initial }: { initial?: Partial<ProductFormValues> }) => {
  const form = useForm<ProductFormValues>({
    defaultValues: { ...buildEmptyProductForm(), ...initial },
  });
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <FormProvider {...form}>
        <FinalMessageSection step={11} />
      </FormProvider>
    </NextIntlClientProvider>
  );
};

describe('FinalMessageSection', () => {
  it('renders empty by default', () => {
    render(<Wrapper />);
    const copy = messages.Commerce.Editor.FinalMessage;
    expect(screen.getByLabelText(copy.title)).toHaveValue('');
  });

  it('loads an existing message', () => {
    render(<Wrapper initial={{ finalMessage: 'ممنون از خریدت!' }} />);
    const copy = messages.Commerce.Editor.FinalMessage;
    expect(screen.getByLabelText(copy.title)).toHaveValue('ممنون از خریدت!');
  });

  it('lets the seller type a new message', () => {
    render(<Wrapper />);
    const copy = messages.Commerce.Editor.FinalMessage;
    fireEvent.change(screen.getByLabelText(copy.title), { target: { value: 'لینک دوره' } });
    expect(screen.getByLabelText(copy.title)).toHaveValue('لینک دوره');
  });

  // Same reasoning as `DescriptionSection`: the zod `.max(1000)` cap alone lets a merchant type
  // past the limit and only find out on save. `maxLength` stops the keystroke instead.
  it('caps the textarea at 1000 characters via maxLength', () => {
    render(<Wrapper />);
    const copy = messages.Commerce.Editor.FinalMessage;
    expect(screen.getByLabelText(copy.title)).toHaveAttribute('maxLength', '1000');
  });

  it('shows the count in Persian digits, and tracks it as the value changes', () => {
    render(<Wrapper />);
    const copy = messages.Commerce.Editor.FinalMessage;
    expect(screen.getByText('۰ / ۱۰۰۰')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(copy.title), { target: { value: 'سلام' } });
    expect(screen.getByText('۴ / ۱۰۰۰')).toBeInTheDocument();
  });
});
