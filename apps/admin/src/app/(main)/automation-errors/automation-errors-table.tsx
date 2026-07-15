'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AutomationErrorRow } from '@/types/automationError';
import { PageMeta } from '@/types/meta';
import { LayoutTable } from '@/components/layout/LayoutTable';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Table } from '@tanstack/react-table';
import { useAutomationErrorColumns } from './columns';
import { ErrorDetailsSheet } from './error-details-sheet';

export default function AutomationErrorsTable({
  isRefetching,
  errors,
  meta,
  onPageChange,
  onLimitChange,
}: {
  isRefetching?: boolean;
  errors: AutomationErrorRow[];
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const t = useTranslations('AutomationErrors');
  const [tableInstance, setTableInstance] = useState<Table<AutomationErrorRow> | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<AutomationErrorRow | null>(null);

  const handleDetails = (row: AutomationErrorRow) => {
    setSelected(row);
    setDetailsOpen(true);
  };

  const columns = useAutomationErrorColumns(handleDetails);

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
        <h1 className="text-lg font-semibold">{t('title')}</h1>

        <DataTable
          columns={columns}
          data={errors}
          tableInstanceRef={setTableInstance}
          page={meta.currentPage}
          limit={meta.itemsPerPage}
          totalCount={meta.totalItems}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />

        {tableInstance && <DataTablePagination table={tableInstance} totalCount={meta.totalItems} />}
      </div>

      <ErrorDetailsSheet error={selected} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </LayoutTable>
  );
}
