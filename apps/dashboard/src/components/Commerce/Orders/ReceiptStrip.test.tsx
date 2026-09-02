import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
