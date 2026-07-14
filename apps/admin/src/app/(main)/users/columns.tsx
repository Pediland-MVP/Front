// src/app/leads/columns.tsx
'use client';

import { UserStatus } from '@/constants/user-status';
import dayjs from '@/lib/dayjs-jalali';
import { ColumnDef } from '@tanstack/react-table';

// UI Imports
import { ColumnHeader } from '@/components/table/column-header';
import { ContactOptions } from '@/components/table/contact-options';
import { StatusBadge } from '@/components/table/status-badge';
import { LabelChips } from '@/components/table/label-chips';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/types/user';
import { SmsData } from '@/types/sms';
import { Customer } from '@/types/customer';
import Link from 'next/link';
import { PanelModeType } from './client-page';
import { UnflagAction } from '@/components/table/unflag-action';

export function columns(
  user: User,
  panelMode: PanelModeType,
  openSmsDialog?: (data: SmsData) => void,
  mutateCustomers?: () => void,
  showDeleteFlagged?: boolean,
): ColumnDef<Customer>[] {
  const cols: ColumnDef<Customer>[] = [
    {
      accessorKey: 'createDate',
      header: ({ column }) => <ColumnHeader column={column} title="تاریخ ثبت" />,
      cell: ({ row }) => {
        const date = row.getValue('createDate') as string;
        const formatted = dayjs(date).tz('Asia/Tehran').calendar('jalali').format('YYYY/MM/DD');

        return <span>{formatted}</span>;
      },
    },
    {
      id: 'lastActivityDate',
      accessorKey: 'lastActivityDate',
      header: ({ column }) => <ColumnHeader column={column} title="آخرین فعالیت" />,
      cell: ({ row }) => {
        const last = row.getValue('lastActivityDate') as string | null;
        if (!last) return '-';

        // Parse the UTC date and convert to Asia/Tehran timezone
        const d = dayjs(last).tz('Asia/Tehran');
        if (!d.isValid()) return '-';

        const diffDays = dayjs().tz('Asia/Tehran').diff(d, 'day');
        if (diffDays > 3) {
          return <span>{d.calendar('jalali').format('YYYY/MM/DD HH:mm')}</span>;
        }

        return <span>{d.fromNow()}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => {
        const status = row.getValue('status') as UserStatus;
        return (
          <Link href={`/users/${row.original.id}`}>
            <StatusBadge status={status} />
          </Link>
        );
      },
    },
    {
      id: 'isIgTokenValid',
      accessorFn: (row) => (!!row.instagrams?.[0]?.isIgTokenValid ? 'متصل' : 'قطع'),
      header: 'وضعیت اتصال',
    },
    {
      id: 'instagramTitle',
      accessorFn: (row) => {
        const name = row.instagrams[0]?.name ?? '';
        return name.length > 30 ? name.slice(0, 30) + '...' : name;
      },
      header: 'عنوان پیج اینستاگرام',
    },
    {
      id: 'totalFollowers',
      accessorFn: (row) => row.instagrams[0]?.followersCount ?? 0,
      header: ({ column }) => <ColumnHeader column={column} title="فالوور" />,
      cell: ({ row }) => {
        const count = row.original.instagrams[0]?.followersCount;
        return count != null ? count.toLocaleString('en-US') : '-';
      },
      meta: { isNumeric: true },
    },
    {
      id: 'instagramId',
      accessorFn: (row) => row.instagrams[0]?.username ?? '-',
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
      id: 'submittedInstagramUsername',
      accessorFn: (row) => row.submittedInstagramUsername ?? '',
      header: 'یوزرنیم اولیه',
      cell: ({ row }) => {
        const submittedInstagramUsername = row.getValue('submittedInstagramUsername') as string;

        return submittedInstagramUsername ? (
          <Link
            className="text-primary hover:text-secondary text-sm lowercase underline-offset-4 hover:underline"
            href={`https://www.instagram.com/${submittedInstagramUsername}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {submittedInstagramUsername}
          </Link>
        ) : (
          '-'
        );
      },
    },
    {
      id: 'submittedInstagramFollowersCount',
      accessorFn: (row) => row.submittedInstagramFollowersCount ?? 0,
      header: 'فالوئر اولیه',
      cell: ({ row }) => {
        const count = row.original.submittedInstagramFollowersCount;
        return count != null ? count.toLocaleString('en-US') : '-';
      },
      meta: { isNumeric: true },
    },
    {
      id: 'labels',
      header: 'برچسب‌ها',
      cell: ({ row }) => <LabelChips labels={row.original.labels} />,
    },
    {
      id: 'contact',
      header: 'تماس',
      cell: ({ row }) => {
        return (
          <ContactOptions
            leadId={row.original.id}
            mobile={row.original.mobile}
            email={row.original.email}
            fullName={`${row.original.firstname ?? ''} ${row.original.lastname ?? ''}`.trim()}
            openSmsDialog={openSmsDialog}
          />
        );
      },
    },
  ];

  if (panelMode === 'pro') {
    const proItems = [
      {
        accessorKey: 'category',
        cell: ({ row }) =>
          row.original.category ? (
            row.original.category.name
          ) : (
            <span className="text-muted-foreground text-xs">ندارد</span>
          ),
        header: 'دسته‌بندی',
      },
      {
        id: 'fullName',
        accessorFn: (row) => `${row.firstname} ${row.lastname}`,
        header: 'نام و نام خانوادگی',
        cell: ({ row }) => {
          const fullName = row.getValue('fullName') as string;
          const id = row.original.id;

          return (
            <Link
              href={`/users/${id}`}
              className="text-primary hover:text-secondary underline-offset-4 hover:underline"
            >
              {fullName}
            </Link>
          );
        },
      },
      {
        id: 'followsCount',
        accessorFn: (row) => row.instagrams[0]?.followsCount ?? 0,
        header: 'فالوینگ',
        meta: { isNumeric: true },
      },
      {
        id: 'mediaCount',
        accessorFn: (row) => row.instagrams[0]?.mediaCount ?? 0,
        header: 'پست',
        meta: { isNumeric: true },
      },
      {
        id: 'leadCount',
        accessorFn: (row) => row.stats?.leadCount,
        header: ({ column }) => <ColumnHeader column={column} title="مخاطب" />,
        meta: { isNumeric: true },
      },
      {
        id: 'automationCount',
        accessorFn: (row) => row.stats.automationCount,
        header: ({ column }) => <ColumnHeader column={column} title="اتوماسیون" />,
        meta: { isNumeric: true },
      },
      {
        id: 'sessionCount',
        accessorFn: (row) => row.stats.sessionCount,
        header: ({ column }) => <ColumnHeader column={column} title="پاسخ‌ها" />,
        meta: { isNumeric: true },
      },
      {
        id: 'productCount',
        accessorFn: (row) => row.stats.productCount,
        header: ({ column }) => <ColumnHeader column={column} title="محصول" />,
        meta: { isNumeric: true },
      },
      {
        id: 'orderCount',
        accessorFn: (row) => row.stats.orderCount,
        header: ({ column }) => <ColumnHeader column={column} title="ت سفارش" />,
        meta: { isNumeric: true },
      },
      {
        id: 'salesCount',
        accessorFn: (row) => row.stats.salesCount,
        header: ({ column }) => <ColumnHeader column={column} title="ت فروش" />,
        meta: { isNumeric: true },
      },
      {
        id: 'totalSale',
        accessorFn: (row) => row.stats.totalSale,
        header: ({ column }) => <ColumnHeader column={column} title="جمع فروش" />,
        meta: { isNumeric: true },
      },
      {
        id: 'remainingDays',
        accessorFn: (row) => {
          const now = Date.now();

          const validSubs = row.subscriptions?.filter(
            (s) => ['active', 'reserved'].includes(s.status) && s.expire,
          );

          if (validSubs.length === 0) return 0;

          const totalDays = validSubs.reduce((sum, s) => {
            if (s.status === 'reserved') {
              return sum + (s.planDuration.durationDays || 0);
            }

            if (s.status === 'active') {
              const expire = new Date(s.expire).getTime();
              const remainingMs = expire - now;
              const remainingDays =
                remainingMs > 0 ? Math.ceil(remainingMs / (1000 * 60 * 60 * 24)) : 0;
              return sum + remainingDays;
            }

            return sum;
          }, 0);

          return totalDays;
        },
        header: ({ column }) => <ColumnHeader column={column} title="مانده" />,
        meta: { isNumeric: true },
      },
      {
        id: 'totalActiveSalesAmount',
        accessorFn: (row) => {
          const activeSub = row.subscriptions?.find((s) => s.status === 'active' && s.expire);

          if (!activeSub) return 0;

          const expire = new Date(activeSub.expire).getTime();
          const now = Date.now();
          const remainingMs = expire - now;

          return remainingMs > 0 ? (activeSub.invoices?.[0]?.amount ?? 0) : 0;
        },
        header: ({ column }) => <ColumnHeader column={column} title="پرداختی" />,
        meta: { title: 'پرداختی', isNumeric: true },
      },
      {
        id: 'referrer',
        accessorFn: (row) => {
          const fullName =
            row.referralUser?.referralCode?.user?.firstname ??
            '' + ' ' + row.referralUser?.referralCode?.user?.lastname ??
            '';
          return row.referralUser ? fullName : '-';
        },
        header: 'نام معرف',
        meta: { title: 'نام معرف' },
      },
      {
        id: 'referrerCode',
        accessorFn: (row) => (row.referralUser ? row.referralUser?.referralCode?.code : '-'),
        header: 'کد معرف',
        meta: { title: 'کد معرف' },
      },
    ];
    proItems.forEach((i) => cols.push(i));
  }

  // In the delete-flagged view (ADMIN only), expose a per-row "restore" action.
  if (showDeleteFlagged) {
    cols.push({
      id: 'unflag',
      header: 'عملیات',
      cell: ({ row }) =>
        row.original.isDeleteFlaged ? (
          <UnflagAction
            userId={row.original.id}
            userName={`${row.original.firstname ?? ''} ${row.original.lastname ?? ''}`.trim()}
            onUnflagged={mutateCustomers}
          />
        ) : null,
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
          const activeAdmin = row.usersAdmins?.find((u) => u.isActive);

          return activeAdmin
            ? `${activeAdmin.admin.firstname} ${activeAdmin.admin.lastname}`
            : 'بدون مسئول';
        },
        header: 'مسئول',
      },
    );
  }

  return cols;
}
