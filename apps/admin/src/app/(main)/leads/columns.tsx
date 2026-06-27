// src/app/leads/columns.tsx
'use client';

import { UserStatus } from '@/constants/user-status';
import dayjs from '@/lib/dayjs-jalali';
import { MarketingLead } from '@/types/lead';
import { ColumnDef } from '@tanstack/react-table';

// UI Imports
import { ColumnHeader } from '@/components/table/column-header';
import { ContactOptions } from '@/components/table/contact-options';
import { StatusBadge } from '@/components/table/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/types/user';
import { SmsData } from '@/types/sms';
import Link from 'next/link';
import DeleteItem from '@/components/lead/DeleteItem';

export function columns(
  user: User,
  mutateLeads?: () => void,
  openSmsDialog?: (data: SmsData) => void,
): ColumnDef<MarketingLead>[] {
  const cols: ColumnDef<MarketingLead>[] = [
    {
      accessorKey: 'createDate',
      header: ({ column }) => <ColumnHeader column={column} title="تاریخ ثبت" />,
      cell: ({ row }) => {
        const date = row.getValue('createDate') as string;
        const formatted = dayjs(date).calendar('jalali').format('YYYY/MM/DD');

        return <span>{formatted}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => {
        const status = row.getValue('status') as UserStatus;

        return (
          <Link href={`/leads/${row.original.id}`}>
            <StatusBadge status={status} />
          </Link>
        );
      },
    },
    {
      id: 'instagramTitle',
      accessorFn: (row) => {
        const name = row.instagram?.name ?? '';
        return name.length > 30 ? name.slice(0, 30) + '...' : name;
      },
      header: 'عنوان پیج اینستاگرام',
    },
    {
      id: 'instagramId',
      accessorFn: (row) => row.instagram?.username ?? '-',
      header: 'آیدی اینستاگرام',
      cell: ({ row }) => {
        const instagramId = row.getValue('instagramId') as string;

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
      accessorKey: 'mobile',
      header: 'همراه',
      cell: ({ row }) => {
        const mobile = row.getValue('mobile') as string;

        return (
          <ContactOptions
            leadId={row.original.id}
            mobile={mobile}
            fullName={row.getValue('fullName')}
            openSmsDialog={openSmsDialog}
          />
        );
      },
    },
    {
      id: 'category',
      accessorFn: (row) => row.category?.name,
      header: 'دسته‌بندی',
    },
    {
      id: 'fullName',
      accessorFn: (row) =>
        !row.firstname && !row.lastname ? 'نامشخص' : `${row.firstname ?? ''} ${row.lastname ?? ''}`,
      header: ({ column }) => <ColumnHeader column={column} title="نام و نام خانوادگی" />,
      cell: ({ row }) => {
        const fullName = row.getValue('fullName') as string;
        const id = row.original.id;

        return (
          <Link
            href={`/leads/${id}`}
            className="text-primary hover:text-secondary underline-offset-4 hover:underline"
          >
            {fullName}
          </Link>
        );
      },
    },
    {
      id: 'followersCount',
      accessorFn: (row) => row.instagram?.followersCount,
      header: ({ column }) => <ColumnHeader column={column} title="فالوور" />,
      meta: { isNumeric: true },
    },
    {
      id: 'followsCount',
      accessorFn: (row) => row.instagram?.followsCount,
      header: ({ column }) => <ColumnHeader column={column} title="فالوینگ" />,
      meta: { isNumeric: true },
    },
    {
      id: 'mediaCount',
      accessorFn: (row) => row.instagram?.mediaCount,
      header: ({ column }) => <ColumnHeader column={column} title="پست" />,
      meta: { isNumeric: true },
    },
  ];

  if (user?.role !== 'kam') {
    cols.push({
      id: 'deleteItem',
      header: 'حذف',
      cell: ({ row }) => {
        return <DeleteItem id={row.original.id} mutate={mutateLeads} />;
      },
    });
  }

  if (user?.role !== 'kam') {
    cols.unshift(
      {
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
      },
      {
        id: 'kam',
        accessorFn: (row) => {
          const activeAdmin = row.marketingLeadsAdmins.find((admin) => admin.isActive);

          return activeAdmin
            ? `${activeAdmin.admin.firstname} ${activeAdmin.admin.lastname}`
            : 'بدون مسئول';
        },
        header: ({ column }) => <ColumnHeader column={column} title="مسئول" />,
      },
    );
  }

  return cols;
}
