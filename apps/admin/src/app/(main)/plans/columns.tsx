'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/formatNumber';
import { Plan } from '@/types/subscription';

export function usePlanColumns({
  onEdit,
  onDurations,
}: {
  onEdit: (plan: Plan) => void;
  onDurations: (plan: Plan) => void;
}): ColumnDef<Plan>[] {
  const t = useTranslations('Plans');

  return [
    {
      accessorKey: 'name',
      header: t('name'),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: t('type'),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.type === 'credit' ? t('type_credit') : t('type_time')}
        </Badge>
      ),
    },
    {
      id: 'followers',
      header: t('followersRange'),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatNumber(row.original.minFollowers)} – {formatNumber(row.original.maxFollowers)}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: t('isActive'),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? t('yes') : t('no')}
        </Badge>
      ),
    },
    {
      accessorKey: 'isVisible',
      header: t('isVisible'),
      cell: ({ row }) => (
        <Badge variant={row.original.isVisible ? 'default' : 'secondary'}>
          {row.original.isVisible ? t('yes') : t('no')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: t('actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
            {t('edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDurations(row.original)}>
            {t('durations')}
          </Button>
        </div>
      ),
    },
  ];
}
