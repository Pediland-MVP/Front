// src/constants/invoice-status.ts

import { InvoiceStatusEnum, InvoicePaymentMethodEnum } from '@/types/finance';

export const invoiceStatusLabels: Record<InvoiceStatusEnum, string> = {
  [InvoiceStatusEnum.SUCCESS]: 'موفق',
  [InvoiceStatusEnum.PENDING]: 'در انتظار',
  [InvoiceStatusEnum.FAILED]: 'ناموفق',
  [InvoiceStatusEnum.CANCELLED]: 'لغو شده',
};

/** Tailwind classes for the status badge in the payments table. */
export const invoiceStatusBadgeClass: Record<InvoiceStatusEnum, string> = {
  [InvoiceStatusEnum.SUCCESS]: 'bg-green-600 text-white border-transparent',
  [InvoiceStatusEnum.PENDING]: 'bg-yellow-500 text-white border-transparent',
  [InvoiceStatusEnum.FAILED]: 'bg-red-600 text-white border-transparent',
  [InvoiceStatusEnum.CANCELLED]: 'bg-gray-400 text-white border-transparent',
};

/** Hex colors for the stacked revenue chart (recharts `fill`). */
export const invoiceStatusChartColor: Record<InvoiceStatusEnum, string> = {
  [InvoiceStatusEnum.SUCCESS]: 'rgb(22 163 74)', // green-600
  [InvoiceStatusEnum.PENDING]: 'rgb(234 179 8)', // yellow-500
  [InvoiceStatusEnum.FAILED]: 'rgb(220 38 38)', // red-600
  [InvoiceStatusEnum.CANCELLED]: 'rgb(156 163 175)', // gray-400
};

/** Canonical display order for statuses (success first). */
export const INVOICE_STATUSES: InvoiceStatusEnum[] = [
  InvoiceStatusEnum.SUCCESS,
  InvoiceStatusEnum.PENDING,
  InvoiceStatusEnum.FAILED,
  InvoiceStatusEnum.CANCELLED,
];

export const invoicePaymentMethodLabels: Record<InvoicePaymentMethodEnum, string> = {
  [InvoicePaymentMethodEnum.Zarinpal]: 'زرین‌پال',
  [InvoicePaymentMethodEnum.Zibal]: 'زیبال',
  [InvoicePaymentMethodEnum.Free]: 'رایگان',
  [InvoicePaymentMethodEnum.ByAdmin]: 'توسط ادمین',
};
