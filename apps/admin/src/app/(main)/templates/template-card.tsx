'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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

interface TemplateCardProps {
  row: TemplateRow;
  onEdit: () => void;
  onDelete: () => void;
}

export function TemplateCard({ row, onEdit, onDelete }: TemplateCardProps) {
  const t = useTranslations('Templates');

  return (
    <Card className="gap-0 border-violet-200 p-0 shadow-violet-200">
      <CardContent className="p-3">
        <div className="bg-muted mb-3 h-24 w-full overflow-hidden rounded-lg">
          {row.templateImage?.url && (
            <img src={row.templateImage.url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="font-semibold">{row.templateTitle}</div>
          {row.templateDescription && (
            <div className="text-muted-foreground line-clamp-2 text-xs">
              {row.templateDescription}
            </div>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {row.templateAppliesToAllCategories ? (
              <Badge>{t('allCategories')}</Badge>
            ) : (
              row.categories.map((c) => (
                <Badge key={c.id} variant="outline">
                  {c.nameFa}
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex rounded-b-xl bg-gray-100 p-0">
        <Button
          className="text-muted-foreground h-9 w-full flex-1 rounded-none rounded-br-xl hover:bg-green-100 hover:text-green-800"
          variant="ghost"
          type="button"
          size="sm"
          onClick={onEdit}
        >
          <Pencil className="text-green-600" size={16} />
          {t('edit')}
        </Button>
        <Button
          className="hover:text-destructive text-muted-foreground h-9 w-full flex-1 rounded-none rounded-bl-xl hover:bg-red-100"
          variant="ghost"
          type="button"
          size="sm"
          onClick={onDelete}
        >
          <Trash className="text-destructive" size={16} />
          {t('delete')}
        </Button>
      </CardFooter>
    </Card>
  );
}
