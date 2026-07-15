// src/app/(main)/subscriptions/columns.tsx
'use client';

import dayjs from '@/lib/dayjs-jalali';
import { ColumnDef } from '@tanstack/react-table';
import { SubscriptionStatusEnum } from '@/types/subscription';
import { Subscription } from '@/types/subscription';

// UI Imports
import { ColumnHeader } from '@/components/table/column-header';
import { SubscriptionStatusBadge } from '@/components/table/subscription-status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/types/user';
import Link from 'next/link';

export function columns(user: User): ColumnDef<Subscription>[] {
  const cols: ColumnDef<Subscription>[] = [
    {
      accessorKey: 'createDate',
      header: ({ column }) => <ColumnHeader column={column} title="تاریخ ثبت" />,
      cell: ({ row }) => {
        // Prefer the (success) invoice's payment timestamp; fall back to the
        // subscription's own createDate for rows without a success invoice.
        const payDate =
          row.original.invoices?.[0]?.createDate ?? (row.getValue('createDate') as string);
        const formatted = dayjs(payDate).calendar('jalali').format('YYYY/MM/DD HH:mm');

        return <span>{formatted}</span>;
      },
    },
    {
      accessorKey: 'usersAdmins',
      header: 'مسئول',
      cell: ({ row }) => {
        const admin = row.original.workspace?.owner?.usersAdmins?.find((a) => a.isActive)?.admin;
        return !!admin ? `${admin?.firstname} ${admin?.lastname}` : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => {
        const status = row.getValue('status') as SubscriptionStatusEnum;
        return <SubscriptionStatusBadge status={status} />;
      },
    },
    {
      id: 'workspaceName',
      accessorFn: (row) => row.workspace?.name ?? '-',
      header: 'فضای کاری',
      cell: ({ row }) => {
        const name = row.getValue('workspaceName') as string;
        const id = row.original.workspace?.id;

        if (!id) return <span>-</span>;

        return (
          <Link
            href={`/workspaces/${id}`}
            className="text-primary hover:text-secondary underline-offset-4 hover:underline"
          >
            {name}
          </Link>
        );
      },
    },
    {
      id: 'customerName',
      accessorFn: (row) =>
        row.workspace?.owner
          ? `${row.workspace.owner.firstname} ${row.workspace.owner.lastname}`
          : '-',
      header: 'نام مشتری',
      cell: ({ row }) => {
        const fullName = row.getValue('customerName') as string;
        const owner = row.original.workspace?.owner;

        if (!owner) return <span>-</span>;

        return (
          <Link
            href={`/users/${owner.id}`}
            className="text-primary hover:text-secondary underline-offset-4 hover:underline"
          >
            {fullName}
          </Link>
        );
      },
    },
    {
      id: 'mobile',
      accessorFn: (row) => row.workspace?.owner?.mobile ?? '-',
      header: 'همراه',
      cell: ({ row }) => {
        const mobile = row.original.workspace?.owner?.mobile;
        return <span>{mobile ?? '-'}</span>;
      },
    },
    {
      id: 'instagramUsername',
      accessorFn: (row) => row.workspace?.instagrams?.[0]?.username ?? '-',
      header: 'آیدی اینستاگرام',
      cell: ({ row }) => {
        const instagramId = row.getValue('instagramUsername') as string;

        return instagramId ? (
          <Link
            className="text-primary hover:text-secondary text-sm lowercase underline-offset-4 hover:underline"
            href={`https://www.instagram.com/${instagramId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {instagramId}
          </Link>
        ) : (
          '-'
        );
      },
    },
    {
      id: 'planName',
      accessorFn: (row) => row.planDuration.plan?.name,
      header: 'پلن',
    },
    {
      id: 'durationName',
      accessorFn: (row) => row.planDuration.name,
      header: 'مدت',
    },
    {
      id: 'planPrice',
      accessorFn: (row) => row.planDuration.price,
      header: ({ column }) => <ColumnHeader column={column} title="قیمت پلن" />,
      meta: { isNumeric: true },
      cell: ({ row }) => {
        const price = row.getValue('planPrice') as number;
        return <span>{price.toLocaleString()}</span>;
      },
    },
    {
      id: 'invoiceAmount',
      accessorFn: (row) => row.invoices?.[0]?.amount ?? 0,
      header: ({ column }) => <ColumnHeader column={column} title="مبلغ پرداختی" />,
      meta: { isNumeric: true },
      cell: ({ row }) => {
        const amount = row.getValue('invoiceAmount') as number;
        return <span>{amount.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: 'expire',
      header: ({ column }) => <ColumnHeader column={column} title="تاریخ انقضا" />,
      cell: ({ row }) => {
        const date = row.getValue('expire') as string;
        if (!date) return <span>-</span>;
        const formatted = dayjs(date).calendar('jalali').format('YYYY/MM/DD');
        return <span>{formatted}</span>;
      },
    },
    {
      id: 'remainingDays',
      accessorFn: (row) => {
        if (!row.expire) return 0;
        const expire = new Date(row.expire).getTime();
        const now = Date.now();
        const remainingMs = expire - now;
        return remainingMs > 0 ? Math.ceil(remainingMs / (1000 * 60 * 60 * 24)) : 0;
      },
      header: ({ column }) => <ColumnHeader column={column} title="روز باقی‌مانده" />,
      meta: { isNumeric: true },
    },
    {
      id: 'followersCount',
      accessorFn: (row) => row.workspace?.instagrams?.[0]?.followersCount ?? 0,
      header: ({ column }) => <ColumnHeader column={column} title="تعداد فالوور" />,
      meta: { isNumeric: true },
    },
  ];

  if (user?.role !== 'kam') {
    cols.unshift({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    });
  }

  return cols;
}
