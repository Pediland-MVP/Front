'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { InstagramRow } from '@/types/instagram';
import { PageMeta } from '@/types/meta';
import { User } from '@/types/user';
import { LayoutTable } from '@/components/layout/LayoutTable';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Input } from '@/components/ui/input';
import { FilterIgToken } from '@/components/table/filter-ig-token';
import { FilterLabel } from '@/components/table/filter-label';
import { FilterAdmin } from '@/components/table/filter-admin';
import { Table } from '@tanstack/react-table';
import { LabelListItem } from '../labels/types';
import { useInstagramColumns } from './columns';

export default function InstagramsTable({
  isRefetching,
  instagrams,
  meta,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  isIgTokenValid,
  onIgTokenValidChange,
  labelId,
  onLabelIdChange,
  labelsItems,
  admin,
  onAdminChange,
  kams,
  showAdminFilter,
}: {
  isRefetching?: boolean;
  instagrams: InstagramRow[];
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  isIgTokenValid: string;
  onIgTokenValidChange: (value: string) => void;
  labelId: string | undefined;
  onLabelIdChange: (labelId: string | undefined) => void;
  labelsItems: LabelListItem[];
  admin: string;
  onAdminChange: (value: string) => void;
  kams: User[];
  showAdminFilter: boolean;
}) {
  const t = useTranslations('Instagrams');
  const [tableInstance, setTableInstance] = useState<Table<InstagramRow> | null>(null);
  const [tempSearch, setTempSearch] = useState(search);
  const columns = useInstagramColumns();

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
        <h1 className="text-lg font-semibold">{t('title')}</h1>
        <div className="flex flex-wrap items-center gap-1.5">
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
            placeholder={t('search')}
            className="h-9 flex-1 text-[13px] md:max-w-[220px]"
          />

          <FilterIgToken size="sm" value={isIgTokenValid} onChange={onIgTokenValidChange} />
          <FilterLabel size="sm" value={labelId} onChange={onLabelIdChange} items={labelsItems} />
          {showAdminFilter && (
            <FilterAdmin size="sm" data={kams} value={admin} onChange={onAdminChange} />
          )}
        </div>

        <DataTable
          columns={columns}
          data={instagrams}
          tableInstanceRef={setTableInstance}
          page={meta.currentPage}
          limit={meta.itemsPerPage}
          totalCount={meta.totalItems}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />

        {tableInstance && (
          <DataTablePagination table={tableInstance} totalCount={meta.totalItems} />
        )}
      </div>
    </LayoutTable>
  );
}
