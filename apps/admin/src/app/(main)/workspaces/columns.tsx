'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import dayjs from '@/lib/dayjs-jalali';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { SubscriptionStatusBadge } from '@/components/table/subscription-status-badge';
import { SubscriptionStatusEnum } from '@/types/subscription';
import { WorkspaceRow } from '@/types/workspace';
import { LabelChips } from '@/components/table/label-chips';

export function useWorkspaceColumns(): ColumnDef<WorkspaceRow>[] {
  const t = useTranslations('Workspaces');

  return [
    {
      accessorKey: 'name',
      header: t('name'),
      cell: ({ row }) => (
        <Link
          href={`/workspaces/${row.original.id}`}
          className="text-primary font-medium hover:underline"
        >
          {row.original.name}
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
      accessorKey: 'membersCount',
      header: t('membersCount'),
    },
    {
      accessorKey: 'isPersonal',
      header: t('type'),
      cell: ({ row }) => (
        <Badge variant={row.original.isPersonal ? 'secondary' : 'default'}>
          {row.original.isPersonal ? t('personal') : t('team')}
        </Badge>
      ),
    },
    {
      id: 'category',
      header: t('category'),
      cell: ({ row }) => {
        const category = row.original.category;
        return category ? (
          <span>{category.nameFa}</span>
        ) : (
          <span className="text-muted-foreground text-xs">{t('noCategory')}</span>
        );
      },
    },
    {
      accessorKey: 'subscriptionStatus',
      header: t('subscriptionStatus'),
      cell: ({ row }) => {
        const status = row.original.subscriptionStatus;
        if (status === 'none') {
          return <span className="text-muted-foreground text-xs">{t('noSubscription')}</span>;
        }
        return (
          <SubscriptionStatusBadge
            status={
              status === 'active' ? SubscriptionStatusEnum.ACTIVE : SubscriptionStatusEnum.EXPIRED
            }
          />
        );
      },
    },
    {
      id: 'labels',
      header: t('labels'),
      cell: ({ row }) => <LabelChips labels={row.original.labels} />,
    },
    {
      accessorKey: 'createDate',
      header: t('createDate'),
      cell: ({ row }) => (
        <span>{dayjs(row.original.createDate).calendar('jalali').format('YYYY/MM/DD')}</span>
      ),
    },
  ];
}
