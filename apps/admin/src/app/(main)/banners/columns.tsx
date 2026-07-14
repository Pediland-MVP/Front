'use client';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from '@/lib/dayjs-jalali';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

export type BannerCategoryRow = { id: string; nameEn: string; nameFa: string };
export type BannerButtonRow = { id: string; textEn: string; textFa: string; url: string; order: number };
export type BannerRow = {
  id: string;
  titleEn: string;
  titleFa: string;
  descriptionEn: string;
  descriptionFa: string;
  color: string;
  isActive: boolean;
  order: number;
  createDate: string;
  categories: BannerCategoryRow[];
  buttons: BannerButtonRow[];
};

export function useBannerColumns(
  onEdit: (row: BannerRow) => void,
  onDelete: (row: BannerRow) => void,
): ColumnDef<BannerRow>[] {
  const t = useTranslations('Banners');

  return [
    { accessorKey: 'titleFa', header: t('titleFa') },
    {
      id: 'categories',
      header: t('categories'),
      cell: ({ row }) =>
        row.original.categories.length === 0 ? (
          <Badge variant="secondary">{t('allWorkspaces')}</Badge>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.original.categories.map((c) => (
              <Badge key={c.id} variant="outline">
                {c.nameFa}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      accessorKey: 'isActive',
      header: t('isActive'),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    { accessorKey: 'order', header: t('order'), meta: { isNumeric: true } },
    {
      accessorKey: 'createDate',
      header: t('createDate'),
      cell: ({ row }) => (
        <span>{dayjs(row.original.createDate).calendar('jalali').format('YYYY/MM/DD')}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.original)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
