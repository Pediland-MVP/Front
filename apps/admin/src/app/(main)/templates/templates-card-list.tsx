'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { LayoutCard } from '@/components/layout/LayoutCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/hooks/swr/api-client';
import { TemplateCard, TemplateRow } from './template-card';
import { TemplatesPagination } from './templates-pagination';

interface TemplatesCardListProps {
  isRefetching?: boolean;
  templates: TemplateRow[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  mutate: () => void;
}

export default function TemplatesCardList({
  isRefetching,
  templates,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  mutate,
}: TemplatesCardListProps) {
  const t = useTranslations('Templates');
  const t_ec = useTranslations('ERROR_CODES');
  const router = useRouter();

  const handleDelete = async (row: TemplateRow) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/templates/${row.id}`);
      toast.success(t('deleteSuccess'));
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('toastError'));
    }
  };

  return (
    <LayoutCard>
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search')}
            className="h-9 flex-1 text-[13px] md:max-w-[220px]"
          />
          <Button onClick={() => router.push('/templates/add')}>{t('addTemplate')}</Button>
        </div>

        <div className="flex-1">
          {templates.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground text-sm">{t('noTemplates')}</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {templates.map((row) => (
                <TemplateCard
                  key={row.id}
                  row={row}
                  onEdit={() => router.push(`/templates/${row.id}`)}
                  onDelete={() => handleDelete(row)}
                />
              ))}
            </div>
          )}
        </div>

        <TemplatesPagination
          isLoading={isRefetching}
          page={page}
          limit={limit}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </div>
    </LayoutCard>
  );
}
