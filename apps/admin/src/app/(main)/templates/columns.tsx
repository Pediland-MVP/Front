'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

export type TemplateCategoryRow = { id: string; nameFa: string };
export type TemplateRow = {
  id: string;
  templateTitle: string;
  templateDescription: string | null;
  templateImage: { url: string } | null;
  templateAppliesToAllCategories: boolean;
  categories: TemplateCategoryRow[];
};

export function useTemplateColumns(
  onEdit: (row: TemplateRow) => void,
  onDelete: (row: TemplateRow) => void,
): ColumnDef<TemplateRow>[] {
  const t = useTranslations('Templates');

  return [
    {
      id: 'thumbnail',
      header: t('thumbnail'),
      cell: ({ row }) =>
        row.original.templateImage?.url ? (
          <img
            src={row.original.templateImage.url}
            alt=""
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="bg-muted h-10 w-10 rounded" />
        ),
    },
    { accessorKey: 'templateTitle', header: t('templateTitle') },
    {
      accessorKey: 'templateDescription',
      header: t('templateDescription'),
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-xs text-sm">{row.original.templateDescription}</span>
      ),
    },
    {
      id: 'categories',
      header: t('categories'),
      cell: ({ row }) =>
        row.original.templateAppliesToAllCategories ? (
          <Badge>{t('allCategories')}</Badge>
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
