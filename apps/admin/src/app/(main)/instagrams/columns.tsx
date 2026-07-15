'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { LabelChips } from '@/components/table/label-chips';
import { InstagramRow } from '@/types/instagram';

export function useInstagramColumns(): ColumnDef<InstagramRow>[] {
  const t = useTranslations('Instagrams');

  return [
    {
      accessorKey: 'username',
      header: t('username'),
      cell: ({ row }) => <span className="font-medium">{row.original.username}</span>,
    },
    {
      accessorKey: 'name',
      header: t('name'),
      cell: ({ row }) => <span>{row.original.name || '—'}</span>,
    },
    {
      accessorKey: 'followersCount',
      header: t('followers'),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {(row.original.followersCount ?? 0).toLocaleString('fa-IR')}
        </span>
      ),
    },
    {
      accessorKey: 'isIgTokenValid',
      header: t('connection'),
      cell: ({ row }) => (
        <Badge variant={row.original.isIgTokenValid ? 'default' : 'destructive'}>
          {row.original.isIgTokenValid ? t('connected') : t('disconnected')}
        </Badge>
      ),
    },
    {
      id: 'workspace',
      header: t('workspace'),
      cell: ({ row }) => (
        <Link
          href={`/workspaces/${row.original.workspace.id}`}
          className="text-primary font-medium hover:underline"
        >
          {row.original.workspace.name}
        </Link>
      ),
    },
    {
      id: 'owner',
      header: t('owner'),
      cell: ({ row }) => {
        const { name, mobile } = row.original.owner;
        return (
          <div className="flex flex-col">
            <span>{name || '—'}</span>
            {mobile && <span className="text-muted-foreground text-xs">{mobile}</span>}
          </div>
        );
      },
    },
    {
      id: 'labels',
      header: t('labels'),
      cell: ({ row }) => <LabelChips labels={row.original.labels} />,
    },
  ];
}
