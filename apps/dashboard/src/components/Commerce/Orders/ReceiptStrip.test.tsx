import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderReceiptView } from '@/types/commerceOrders';

import { ReceiptStrip } from './ReceiptStrip';

const copy = messages.Commerce.Orders.receipts;

const receipts: OrderReceiptView[] = [
  { id: 'r1', url: 'https://dl.befroosh.app/one.jpg', createDate: '2026-09-02T11:47:00.000Z' },
  { id: 'r2', url: 'https://dl.befroosh.app/two.jpg', createDate: '2026-09-02T12:04:00.000Z' },
];

const renderStrip = (list: OrderReceiptView[]) =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ReceiptStrip receipts={list} />
    </NextIntlClientProvider>,
  );

describe('ReceiptStrip', () => {
  it('renders every receipt, not just the latest', () => {
    renderStrip(receipts);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('puts the newest first, so a re-upload after a reject leads', () => {
    renderStrip(receipts);
    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('src', 'https://dl.befroosh.app/two.jpg');
    expect(imgs[1]).toHaveAttribute('src', 'https://dl.befroosh.app/one.jpg');
  });

  it('does not mutate the array it was handed', () => {
    const input = [...receipts];
    renderStrip(input);
    expect(input[0].id).toBe('r1');
  });

  it('says so when there is no receipt at all', () => {
    renderStrip([]);
    expect(screen.getByText(copy.none)).toBeInTheDocument();
  });

  /**
   * I2 / spec §8 / decision D3: "all receipts, newest first, EACH LABELLED WITH ITS UPLOAD TIME".
   * The timestamp is the stated reason for showing every receipt rather than only the latest --
   * without it two similar-looking rejected/re-uploaded receipts are indistinguishable.
   * `createDate` was already fetched and used for sorting, just never shown.
   *
   * Literal Jalali strings: 11:47Z and 12:04Z are 13:47 and 14:04 in `toJalaliDateTime`'s default
   * Europe/Berlin, on 1405/06/11.
   */
  it('captions every receipt with its upload time', () => {
    renderStrip(receipts);
    expect(screen.getByText('1405/06/11 14:04')).toBeInTheDocument();
    expect(screen.getByText('1405/06/11 13:47')).toBeInTheDocument();
  });

  /**
   * I5: Radix points the dialog's `aria-labelledby` at a `DialogTitle`. Without one the dialog is
   * announced unlabeled and Radix errors to the console on every open. The label is the ATTEMPT
   * label, not the generic "رسیدهای پرداخت" -- a screen-reader user has to be able to tell which
   * attempt opened.
   */
  it('opens a lightbox labelled with the attempt that was tapped, not a generic title', () => {
    renderStrip(receipts);
    // Newest first, so the first thumbnail is attempt 2.
    fireEvent.click(screen.getAllByRole('button')[0]);

    const dialog = screen.getByRole('dialog');
    const attemptTwo = copy.attempt.replace('{n}', '2');
    expect(dialog).toHaveAccessibleName(attemptTwo);
    // The fullscreen image carries the same attempt label, not the generic receipts title.
    // Scoped to the dialog: the thumbnail behind it shares the label, which is the point.
    expect(within(dialog).getByAltText(attemptTwo)).toHaveAttribute(
      'src',
      'https://dl.befroosh.app/two.jpg',
    );
  });
});
