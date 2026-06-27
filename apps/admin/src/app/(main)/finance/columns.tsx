// src/app/(main)/finance/columns.tsx
'use client';

import dayjs from '@/lib/dayjs-jalali';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ColumnHeader } from '@/components/table/column-header';
import type { Payment } from '@/types/finance';
import {
  invoicePaymentMethodLabels,
  invoiceStatusBadgeClass,
  invoiceStatusLabels,
} from '@/constants/invoice-status';

export const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'createDate',
    header: ({ column }) => <ColumnHeader column={column} title="تاریخ پرداخت" />,
    cell: ({ row }) => {
      const date = row.getValue('createDate') as string;
      return <span>{dayjs(date).calendar('jalali').format('YYYY/MM/DD HH:mm')}</span>;
    },
  },
  {
    id: 'customerName',
    accessorFn: (row) => {
      const owner = row.workspace?.owner;
      return owner ? `${owner.firstname ?? ''} ${owner.lastname ?? ''}`.trim() : '-';
    },
    header: 'نام مشتری',
    cell: ({ row }) => {
      const owner = row.original.workspace?.owner;
      const fullName = row.getValue('customerName') as string;
      if (!owner) return <span>-</span>;
      return (
        <Link
          href={`/customers/${owner.id}`}
          className="text-primary hover:text-secondary underline-offset-4 hover:underline"
        >
          {fullName || '-'}
        </Link>
      );
    },
  },
  {
    id: 'mobile',
    accessorFn: (row) => row.workspace?.owner?.mobile ?? '-',
    header: 'همراه',
  },
  {
    id: 'planName',
    accessorFn: (row) => row.subscription?.planDuration?.plan?.name ?? '-',
    header: 'پلن',
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <ColumnHeader column={column} title="مبلغ" />,
    meta: { isNumeric: true },
    cell: ({ row }) => {
      const amount = row.getValue('amount') as number;
      return <span>{amount.toLocaleString('fa-IR')}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'وضعیت',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold',
            invoiceStatusBadgeClass[status],
          )}
        >
          {invoiceStatusLabels[status]}
        </span>
      );
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'روش پرداخت',
    cell: ({ row }) => <span>{invoicePaymentMethodLabels[row.original.paymentMethod] ?? '-'}</span>,
  },
];
