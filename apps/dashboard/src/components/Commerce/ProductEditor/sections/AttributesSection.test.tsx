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

describe('AttributesSection — the "use مشخصات instead" notice', () => {
  it('renders the notice above the step heading, before any axis is added', () => {
    render(<Harness />);

    const notice = screen.getByTestId('attributes-notice');
    expect(notice).toHaveAttribute('role', 'alert');
    /*
     * Asserts the whole rendered sentence, not a substring, because two separate things can eat
     * characters here and a substring match would survive both.
     *
     * The message writes the quotes around مشخصات DOUBLED (`''مشخصات''`) and that is load-bearing,
     * not a typo. `'` is ICU's escape character, so a single `'` immediately before `</specs>`
     * opens a quoted run that swallows the closing tag — the message then fails to parse and
     * next-intl renders the literal key `Commerce.Editor.Attributes.notice` on screen. `''` is
     * ICU's escape for one literal apostrophe, which is why this strips it back out before
     * comparing. If someone ever "tidies" the doubling away, this test is what catches it.
     */
    const plain = copy.notice.replace(/<\/?(?:attrs|specs)>/g, '').replaceAll("''", "'");
    expect(notice.textContent).toContain(plain);
  });

  it('marks up the two section names, each in its own colour', () => {
    render(<Harness />);

    const notice = screen.getByTestId('attributes-notice');
    const marked = [...notice.querySelectorAll('strong')];

    // Not just "some bold text somewhere": the whole point is that the feature being misused and
    // the one to use instead are told apart, so they must be two DIFFERENT classes.
    expect(marked.map((el) => el.textContent)).toEqual(['ویژگی‌ها', "'مشخصات'"]);
    expect(marked[0].className).not.toEqual(marked[1].className);
  });

  /*
   * Regression: the notice used to hand `t.rich`'s output straight to `AlertDescription`, which
   * is a flex ROW. The five pieces the message compiles to — text, <strong>, text, <strong>,
   * text — each became their own flex item, so one sentence rendered as five narrow columns side
   * by side, each wrapping on its own, and the phrases read as if stacked inside one another.
   *
   * Asserted on the DOM rather than on styling because that is where the fault actually lives:
   * as long as every piece of the sentence shares ONE non-flex parent, it flows as inline text.
   */
  it('keeps the whole sentence in a single block so it flows as one paragraph', () => {
    render(<Harness />);

    const notice = screen.getByTestId('attributes-notice');
    const paragraph = notice.querySelector('p');

    expect(paragraph).not.toBeNull();
    // The parent of every text run and both <strong>s is the same element, and it is not a flex
    // container — so no piece of the sentence can be laid out as its own column.
    expect(paragraph!.className).not.toMatch(/\bflex\b/);
    const parents = new Set(
      [...paragraph!.childNodes]
        .map((node) => node.parentElement)
        .concat([...notice.querySelectorAll('strong')].map((el) => el.parentElement)),
    );
    expect(parents.size).toBe(1);
    expect([...parents][0]).toBe(paragraph);
  });

  it('stays put once axes exist — it is guidance, not an empty state', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(copy.addAttribute));

    expect(screen.getByTestId('attributes-notice')).toBeInTheDocument();
  });
});
