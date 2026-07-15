'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Table } from '@tanstack/react-table';
import { useState } from 'react';

import { LayoutTable } from '@/components/layout/LayoutTable';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/hooks/swr/api-client';
import { useTemplateColumns, TemplateRow } from './columns';

interface TemplatesTableProps {
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

export default function TemplatesTable({
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
}: TemplatesTableProps) {
  const t = useTranslations('Templates');
  const t_ec = useTranslations('ERROR_CODES');
  const router = useRouter();
  const [tableInstance, setTableInstance] = useState<Table<TemplateRow> | null>(null);

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

  const columns = useTemplateColumns((row) => router.push(`/templates/${row.id}`), handleDelete);

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
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

        <DataTable
          columns={columns}
          data={templates}
          tableInstanceRef={setTableInstance}
          page={page}
          limit={limit}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />

        {tableInstance && <DataTablePagination table={tableInstance} totalCount={totalCount} />}
      </div>
    </LayoutTable>
  );
}
