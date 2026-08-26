'use client';

import dayjs from '@/lib/dayjs-jalali';
import { ColumnDef } from '@tanstack/react-table';
import { ColumnHeader } from '@/components/table/column-header';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

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

const Dash = () => <span className="text-muted-foreground">—</span>;

export const makeColumns = ({
  onEdit,
}: {
  onEdit: (referralCode: ReferralCode) => void;
}): ColumnDef<ReferralCode>[] => [
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
    header: ({ column }) => <ColumnHeader column={column} title="تخفیف" />,
    meta: { isNumeric: true },
    cell: ({ row }) => {
      const type = row.original.type;
      const discount = row.getValue('discount') as number;

      // A PLAN code stores discount 0 and grants a subscription instead - that is shown
      // in the dedicated gift column, so this one stays empty rather than printing 0.
      if (type === 'PLAN') return <Dash />;

      return <span>{type === 'PERCENTAGE' ? `${discount}٪` : discount.toLocaleString()}</span>;
    },
  },
  {
    id: 'giftPlan',
    header: 'پلن هدیه',
    cell: ({ row }) => {
      const planDuration = row.original.planDuration;
      if (row.original.type !== 'PLAN' || !planDuration) return <Dash />;
      return (
        <span>
          {planDuration.plan?.name ? `${planDuration.plan.name} — ` : ''}
          {planDuration.name}
        </span>
      );
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
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" aria-label="ویرایش" onClick={() => onEdit(row.original)}>
        <Pencil className="size-4" />
      </Button>
    ),
  },
];
