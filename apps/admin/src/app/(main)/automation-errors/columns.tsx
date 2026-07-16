'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import dayjs from '@/lib/dayjs-jalali';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AutomationErrorRow } from '@/types/automationError';

export function useAutomationErrorColumns(
  onDetails: (row: AutomationErrorRow) => void,
): ColumnDef<AutomationErrorRow>[] {
  const t = useTranslations('AutomationErrors');

  return [
    {
      accessorKey: 'queue',
      header: t('queue'),
      cell: ({ row }) => <Badge variant="outline">{row.original.queue}</Badge>,
    },
    {
      id: 'instagram',
      header: t('instagramColumn'),
      cell: ({ row }) => {
        const ig = row.original.instagram;
        if (!ig) return <Badge variant="destructive">{t('unknownAccount')}</Badge>;
        return (
          <Link href={`/instagrams/${ig.id}`} className="text-primary font-medium hover:underline">
            @{ig.username}
          </Link>
        );
      },
    },
    {
      accessorKey: 'title',
      header: t('titleColumn'),
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: 'description',
      header: t('descriptionColumn'),
      cell: ({ row }) => <span className="text-slate-500">{row.original.description}</span>,
    },
    {
      accessorKey: 'failedAt',
      header: t('failedAt'),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {dayjs(row.original.failedAt)
            .tz('Asia/Tehran')
            .calendar('jalali')
            .format('YYYY/MM/DD HH:mm')}
        </span>
      ),
    },
    {
      id: 'details',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => onDetails(row.original)}>
          {t('details')}
        </Button>
      ),
    },
  ];
}
