// src/app/(main)/finance/payments-table.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Table } from '@tanstack/react-table';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Input } from '@/components/ui/input';
import type { Payment } from '@/types/finance';
import type { PageMeta } from '@/types/meta';
import { paymentColumns } from './columns';

interface PaymentsTableProps {
  payments: Payment[];
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function PaymentsTable({
  payments,
  meta,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
}: PaymentsTableProps) {
  const t = useTranslations('Finance');
  const [tableInstance, setTableInstance] = useState<Table<Payment> | null>(null);
  const [tempSearch, setTempSearch] = useState(search);

  return (
    // Plain block (not a height-constrained flex container): DataTable's root is
    // `flex-1 overflow-hidden`, which collapses to 0 height inside the page's
    // scroll-stack. Here the table sizes to its content and the page scrolls.
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={tempSearch}
          onChange={(e) => {
            const value = e.target.value;
            setTempSearch(value);
            if (value === '') onSearchChange('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearchChange(tempSearch);
            }
          }}
          placeholder={t('searchPlaceholder')}
          className="max-w-[220px]"
        />
      </div>

      <DataTable
        columns={paymentColumns}
        data={payments}
        tableInstanceRef={setTableInstance}
        page={meta.currentPage}
        limit={meta.itemsPerPage}
        totalCount={meta.totalItems}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />

      {tableInstance && <DataTablePagination table={tableInstance} totalCount={meta.totalItems} />}
    </div>
  );
}
