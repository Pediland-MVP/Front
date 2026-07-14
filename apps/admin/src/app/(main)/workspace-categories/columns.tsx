'use client';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from '@/lib/dayjs-jalali';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

export type WorkspaceCategoryRow = {
  id: string;
  nameEn: string;
  nameFa: string;
  workspaceCount: number;
  createDate: string;
};

export function useWorkspaceCategoryColumns(
  onEdit: (row: WorkspaceCategoryRow) => void,
  onDelete: (row: WorkspaceCategoryRow) => void,
): ColumnDef<WorkspaceCategoryRow>[] {
  const t = useTranslations('WorkspaceCategories');

  return [
    { accessorKey: 'nameFa', header: t('nameFa') },
    { accessorKey: 'nameEn', header: t('nameEn') },
    { accessorKey: 'workspaceCount', header: t('workspaceCount'), meta: { isNumeric: true } },
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
