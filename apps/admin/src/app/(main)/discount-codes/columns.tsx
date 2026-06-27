'use client';

import dayjs from '@/lib/dayjs-jalali';
import { ColumnDef } from '@tanstack/react-table';
import { ColumnHeader } from '@/components/table/column-header';
import { Badge } from '@/components/ui/badge';

export type DiscountCode = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  maxUsagePerUser: number;
  maxUsageTotal: number | null;
  description: string | null;
  createDate: string;
  planDurations: { id: number; name: string }[];
};

const typeLabel: Record<string, string> = {
  percentage: 'درصدی',
  fixed: 'مبلغ ثابت',
};

interface ColumnActions {
  onToggle: (id: string) => void;
  isToggling: string | null;
}

export function columns({ onToggle, isToggling }: ColumnActions): ColumnDef<DiscountCode>[] {
  return [
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
      header: 'کد تخفیف',
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
      accessorKey: 'value',
      header: ({ column }) => <ColumnHeader column={column} title="مقدار" />,
      meta: { isNumeric: true },
      cell: ({ row }) => {
        const type = row.original.type;
        const value = row.getValue('value') as number;
        return <span>{type === 'percentage' ? `${value}٪` : value.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'وضعیت',
      cell: ({ row }) => {
        const active = row.getValue('isActive') as boolean;
        return (
          <Badge variant={active ? 'default' : 'secondary'}>{active ? 'فعال' : 'غیرفعال'}</Badge>
        );
      },
    },
    {
      accessorKey: 'maxUsagePerUser',
      header: 'استفاده هر کاربر',
      meta: { isNumeric: true },
    },
    {
      accessorKey: 'maxUsageTotal',
      header: 'سقف کل استفاده',
      meta: { isNumeric: true },
      cell: ({ row }) => <span>{row.getValue('maxUsageTotal') ?? 'نامحدود'}</span>,
    },
    {
      accessorKey: 'validUntil',
      header: 'تاریخ انقضا',
      cell: ({ row }) => {
        const date = row.getValue('validUntil') as string | null;
        if (!date) return <span>-</span>;
        return <span>{dayjs(date).calendar('jalali').format('YYYY/MM/DD')}</span>;
      },
    },
    {
      accessorKey: 'description',
      header: 'توضیحات',
      cell: ({ row }) => <span>{row.getValue('description') ?? '-'}</span>,
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => {
        const id = row.original.id;
        const active = row.original.isActive;
        return (
          <button
            onClick={() => onToggle(id)}
            disabled={isToggling === id}
            className="text-primary text-sm underline-offset-4 hover:underline disabled:opacity-50"
          >
            {isToggling === id ? '...' : active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
          </button>
        );
      },
    },
  ];
}
