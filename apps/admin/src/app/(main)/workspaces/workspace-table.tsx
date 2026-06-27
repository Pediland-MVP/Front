'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { WorkspaceRow } from '@/types/workspace';
import { PageMeta } from '@/types/meta';
import { LayoutTable } from '@/components/layout/LayoutTable';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table } from '@tanstack/react-table';
import { useWorkspaceColumns } from './columns';

export default function WorkspaceTable({
  isRefetching,
  workspaces,
  meta,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  type,
  onTypeChange,
}: {
  isRefetching?: boolean;
  workspaces: WorkspaceRow[];
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  type: string;
  onTypeChange: (type: string) => void;
}) {
  const t = useTranslations('Workspaces');
  const [tableInstance, setTableInstance] = useState<Table<WorkspaceRow> | null>(null);
  const [tempSearch, setTempSearch] = useState(search);
  const columns = useWorkspaceColumns();

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
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

          <Select
            value={type || 'all'}
            onValueChange={(value) => onTypeChange(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="h-9 w-[140px] text-[13px]">
              <SelectValue placeholder={t('filterType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="personal">{t('personal')}</SelectItem>
              <SelectItem value="team">{t('team')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={workspaces}
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
