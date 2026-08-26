'use client';

import dayjs from '@/lib/dayjs-jalali';
import { ColumnDef } from '@tanstack/react-table';
import { ColumnHeader } from '@/components/table/column-header';

export type ReferralCode = {
  id: string;
  code: string;
  discount: number;
  type: 'PERCENTAGE' | 'FIXED' | 'PLAN';
  atLeast: number;
  max: number | null;
  maxUsage: number;
  createDate: string;
  user: {
    id: string;
    firstname: string;
    lastname: string;
    mobile: string;
  };
  // Only set on PLAN codes - the subscription gifted to the referred user at signup.
  planDuration?: {
    id: number;
    name: string;
    plan?: { id: number; name: string } | null;
  } | null;
};

const typeLabel: Record<string, string> = {
  PERCENTAGE: 'درصدی',
  FIXED: 'مبلغ ثابت',
  PLAN: 'پلن (هدیه)',
};

export const columns: ColumnDef<ReferralCode>[] = [
  {
    accessorKey: 'createDate',
    header: ({ column }) => <ColumnHeader column={column} title="تاریخ ثبت" />,
    cell: ({ row }) => {
      const date = row.getValue('createDate') as string;
      return <span>{dayjs(date).calendar('jalali').format('YYYY/MM/DD')}</span>;
    },
  },
  {
    accessorKey: 'code',
    header: 'کد رفرال',
    cell: ({ row }) => <span className="font-mono font-semibold">{row.getValue('code')}</span>,
  },
  {
    accessorKey: 'type',
    header: 'نوع',
    cell: ({ row }) => (
      <span>{typeLabel[row.getValue('type') as string] ?? row.getValue('type')}</span>
    ),
  },
  {
    accessorKey: 'discount',
    header: ({ column }) => <ColumnHeader column={column} title="تخفیف / هدیه" />,
    meta: { isNumeric: true },
    cell: ({ row }) => {
      const type = row.original.type;
      const discount = row.getValue('discount') as number;

      // A PLAN code stores discount 0 - show the gifted subscription instead.
      if (type === 'PLAN') {
        const planDuration = row.original.planDuration;
        if (!planDuration) return <span className="text-muted-foreground">—</span>;
        return (
          <span>
            {planDuration.plan?.name ? `${planDuration.plan.name} — ` : ''}
            {planDuration.name}
          </span>
        );
      }

      return <span>{type === 'PERCENTAGE' ? `${discount}٪` : discount.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: 'maxUsage',
    header: 'حداکثر استفاده',
    meta: { isNumeric: true },
  },
  {
    id: 'userName',
    header: 'کاربر',
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <span>
          {user?.firstname} {user?.lastname}
        </span>
      );
    },
  },
  {
    id: 'userMobile',
    header: 'همراه',
    cell: ({ row }) => <span>{row.original.user?.mobile ?? '-'}</span>,
  },
];
