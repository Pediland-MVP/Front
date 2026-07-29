import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';

import messages from '@/messages/fa.json';
import { AttributesSection, type EditorConfirm } from './AttributesSection';
import type { ProductFormValues } from '../productEditor.schema';

const copy = messages.Commerce.Editor.Attributes;

// jsdom has exposed crypto.randomUUID since v22, but the component's value identity depends on
// it — stub it if this environment ever lacks it rather than failing on an unrelated detail.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  let seed = 0;
  Object.defineProperty(globalThis.crypto ?? (globalThis.crypto = {} as Crypto), 'randomUUID', {
    value: () => `uuid-${(seed += 1)}`,
    configurable: true,
  });
}

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

const Harness = ({
  defaults,
  onConfirm,
}: {
  defaults?: Partial<ProductFormValues>;
  onConfirm?: (confirm: EditorConfirm) => void;
}) => {
  const form = useForm<ProductFormValues>({ defaultValues: { ...emptyForm, ...defaults } });
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <FormProvider {...form}>
        <AttributesSection onConfirm={onConfirm ?? (() => {})} />
      </FormProvider>
    </NextIntlClientProvider>
  );
};

const axis = (name: string) => ({
  localKey: name,
  name,
  style: 'button' as const,
  values: [],
});

describe('AttributesSection', () => {
  it('splits one draft on a comma so several values land at once', () => {
    render(<Harness defaults={{ options: [axis('رنگ')] }} />);

    const draft = screen.getByLabelText(copy.valuePlaceholder);
    // A Persian comma and a latin comma in the same string — merchants type both.
    fireEvent.change(draft, { target: { value: 'قرمز، آبی, سبز' } });
    fireEvent.keyDown(draft, { key: 'Enter' });

    expect(screen.getByText('قرمز')).toBeInTheDocument();
    expect(screen.getByText('آبی')).toBeInTheDocument();
    expect(screen.getByText('سبز')).toBeInTheDocument();
    // And the draft is cleared, so pressing Enter twice cannot double-add.
    expect(draft).toHaveValue('');
  });

  it('ignores blank fragments from a trailing comma', () => {
    render(<Harness defaults={{ options: [axis('سایز')] }} />);

    const draft = screen.getByLabelText(copy.valuePlaceholder);
    fireEvent.change(draft, { target: { value: '۴۰،،۴۱،' } });
    fireEvent.keyDown(draft, { key: 'Enter' });

    expect(screen.getByText(copy.count.replace('{count}', '۲'))).toBeInTheDocument();
  });

  it('adds the value with the افزودن button as well as with Enter', () => {
    render(<Harness defaults={{ options: [axis('رنگ')] }} />);

    fireEvent.change(screen.getByLabelText(copy.valuePlaceholder), {
      target: { value: 'مشکی' },
    });
    fireEvent.click(screen.getByRole('button', { name: copy.add }));

    expect(screen.getByText('مشکی')).toBeInTheDocument();
  });

  it('disables افزودن ویژگی at three axes, because the backend caps options at three', () => {
    render(<Harness defaults={{ options: [axis('رنگ'), axis('سایز'), axis('جنس')] }} />);

    expect(screen.getByRole('button', { name: copy.addAttribute })).toBeDisabled();
  });

  it('still offers افزودن ویژگی at two axes', () => {
    render(<Harness defaults={{ options: [axis('رنگ'), axis('سایز')] }} />);

    expect(screen.getByRole('button', { name: copy.addAttribute })).toBeEnabled();
  });

  it('asks the page to confirm before dropping a value that variations depend on', () => {
    const onConfirm = vi.fn();
    render(
      <Harness
        onConfirm={onConfirm}
        defaults={{
          options: [
            {
              localKey: 'opt-1',
              name: 'رنگ',
              style: 'button',
              values: [{ localKey: 'v1', value: 'قرمز' }],
            },
          ],
          variants: [
            {
              valueIds: ['v1'],
              price: 1000,
              compare: null,
              hasDiscount: false,
              stock: 1,
              infinite: false,
              mediaIds: [],
              sku: null,
              weight: null,
              salePrice: null,
              saleStartsAt: null,
              saleEndsAt: null,
              allowBackorder: false,
              isActive: true,
            },
          ],
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: copy.removeValue.replace('{value}', 'قرمز') }),
    );

    // Not removed yet — the page owns the dialog and calls `run` only if the merchant agrees.
    expect(screen.getByText('قرمز')).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // `run` is the page's dialog confirming — not a DOM event RTL can wrap for us — so the
    // resulting `setValue` needs its own `act` or the assertion below races React's commit.
    act(() => {
      onConfirm.mock.calls[0][0].run();
    });
    expect(screen.queryByText('قرمز')).not.toBeInTheDocument();
  });

  it('removes a value without asking when there are no variations to lose', () => {
    const onConfirm = vi.fn();
    render(
      <Harness
        onConfirm={onConfirm}
        defaults={{
          options: [
            {
              localKey: 'opt-1',
              name: 'رنگ',
              style: 'button',
              values: [{ localKey: 'v1', value: 'قرمز' }],
            },
          ],
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: copy.removeValue.replace('{value}', 'قرمز') }),
    );

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText('قرمز')).not.toBeInTheDocument();
  });
});
