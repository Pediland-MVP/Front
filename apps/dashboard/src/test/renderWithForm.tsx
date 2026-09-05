import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm, type FieldErrors } from 'react-hook-form';

import messages from '@/messages/fa.json';
import type { ProductFormValues } from '@/components/Commerce/ProductEditor/productEditor.schema';

/**
 * The same empty-form shape `BasePriceSection.test.tsx` hand-rolls, lifted out here so every
 * section test can share one `FormProvider` + `NextIntlClientProvider` harness instead of
 * reinventing it per file.
 */
const emptyForm: ProductFormValues = {
  title: '',
  description: '',
  categoryId: null,
  tags: [],
  specs: [],
  collectionIds: [],
  media: [],
  basePrice: null,
  baseCompare: null,
  baseStock: null,
  options: [],
  variants: [],
};

interface RenderWithFormOptions {
  defaults?: Partial<ProductFormValues>;
  /** Seeded onto `formState.errors` via `setError`, so a section can be tested in its error state. */
  errors?: FieldErrors<ProductFormValues>;
}

const Harness = ({
  children,
  defaults,
  errors,
}: {
  children: ReactElement;
  defaults?: Partial<ProductFormValues>;
  errors?: FieldErrors<ProductFormValues>;
}) => {
  const form = useForm<ProductFormValues>({ defaultValues: { ...emptyForm, ...defaults } });

  // `useForm` has no option to seed `formState.errors` directly — `setError` is the supported way
  // to put the form into an already-invalid state for a test, without going through a real submit.
  useEffect(() => {
    if (!errors) return;
    (Object.keys(errors) as Array<keyof ProductFormValues>).forEach((name) => {
      const error = errors[name];
      if (!error) return;
      form.setError(name, error);
    });
    // Runs once, seeding the errors this render was asked to start with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <FormProvider {...form}>{children}</FormProvider>
    </NextIntlClientProvider>
  );
};

/** Renders one editor section inside a real `FormProvider`, the same way the full page does. */
export const renderWithForm = (
  ui: ReactElement,
  options: RenderWithFormOptions = {},
): RenderResult =>
  render(
    <Harness defaults={options.defaults} errors={options.errors}>
      {ui}
    </Harness>,
  );
