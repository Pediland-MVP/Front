'use client';

import dayjs from '@/lib/dayjs-jalali';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { WebhookEndpoint } from './types';

interface ColumnArgs {
  t: (key: string) => string;
  onOpen: (id: string) => void;
}

export function columns({ t, onOpen }: ColumnArgs): ColumnDef<WebhookEndpoint>[] {
  return [
    {
      accessorKey: 'name',
      header: t('colName'),
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'url',
      header: t('colUrl'),
      cell: ({ row }) => (
        <span dir="ltr" className="block max-w-[260px] truncate font-mono text-xs">
          {row.getValue('url')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('colStatus'),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? t('statusActive') : t('statusDisabled')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'subscriptionCount',
      header: t('colSubscriptions'),
      meta: { isNumeric: true },
      cell: ({ row }) => <span>{row.original.subscriptionCount ?? 0}</span>,
    },
    {
      accessorKey: 'consecutiveFailures',
      header: t('colFailures'),
      meta: { isNumeric: true },
      cell: ({ row }) => {
        const failures = row.getValue('consecutiveFailures') as number;
        return <span className={failures > 0 ? 'text-destructive' : undefined}>{failures}</span>;
      },
    },
    {
      accessorKey: 'createDate',
      header: t('colCreated'),
      cell: ({ row }) => (
        <span>
          {dayjs(row.getValue('createDate') as string)
            .calendar('jalali')
            .format('YYYY/MM/DD')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => onOpen(row.original.id)}
          className="text-primary text-sm underline-offset-4 hover:underline"
        >
          {t('detailTitle')}
        </button>
      ),
    },
  ];
}
