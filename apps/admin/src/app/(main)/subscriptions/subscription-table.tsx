// src/app/(main)/subscriptions/subscription-table.tsx
'use client';

import { Subscription } from '@/types/subscription';
import { PageMeta } from '@/types/meta';
import { User } from '@/types/user';
import { SubscriptionStatusEnum } from '@/types/subscription';
import { useState } from 'react';

// UI Imports
import { LayoutTable } from '@/components/layout/LayoutTable';
import { FilterStatus } from '@/components/table/filter-status';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Input } from '@/components/ui/input';
import { SortingState, Table } from '@tanstack/react-table';
import { columns } from './columns';
import { DatePicker } from '@/components/ui/date-picker';
import { FilterAdmin } from '@/components/table/filter-admin';

export default function SubscriptionTable({
  isRefetching,
  subscriptionAdmins,
  onAdminChange,
  user,
  subscriptions,
  subscriptionStatus,
  onStatusChange,
  sortingState,
  onSortingChange,
  mutateSubscriptions,
  kams,
  meta,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  userIds,
  onUserIdsChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: {
  isRefetching?: boolean;
  subscriptionAdmins: string;
  onAdminChange: (admins: string) => void;
  user: User;
  subscriptions: Subscription[];
  subscriptionStatus: SubscriptionStatusEnum | '';
  onStatusChange: (status: SubscriptionStatusEnum | '') => void;
  sortingState: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  mutateSubscriptions?: () => void;
  kams: User[];
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  userIds: string[];
  onUserIdsChange: (userIds: string[]) => void;
  startDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  endDate: Date | null;
  onEndDateChange: (date: Date | null) => void;
}) {
  const [rowSelection, setRowSelection] = useState({});
  const [selectedRows, setSelectedRows] = useState<Subscription[]>([]);
  const [tableInstance, setTableInstance] = useState<Table<Subscription> | null>(null);
  const [tempSearch, setTempSearch] = useState(search);

  const selectedIds = selectedRows.map((row) => row.id);
  const cols = columns(user);

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <div className="grid w-full flex-1 grid-cols-2 flex-wrap items-center gap-1.5 md:flex">
            <Input
              type="search"
              id="search"
              value={tempSearch}
              onChange={(e) => {
                const value = e.target.value;
                setTempSearch(value);

                if (value === '') {
                  onSearchChange('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearchChange(tempSearch);
                }
              }}
              placeholder="جستجو..."
              className="max-w-[200px]"
            />

            <FilterStatus
              type="subscription"
              value={subscriptionStatus}
              onChange={(value) => onStatusChange(value as SubscriptionStatusEnum | '')}
            />
          </div>

          {user && user.role !== 'kam' && (
            <FilterAdmin data={kams} value={subscriptionAdmins} onChange={onAdminChange} />
          )}
        </div>

        <DataTable
          columns={cols}
          data={subscriptions}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          setSelectedRows={setSelectedRows}
          tableInstanceRef={setTableInstance}
          page={meta.currentPage}
          limit={meta.itemsPerPage}
          totalCount={meta.totalItems}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          serverSorting
          sortingState={sortingState}
          onSortingChange={onSortingChange}
        />

        {tableInstance && (
          <DataTablePagination table={tableInstance} totalCount={meta.totalItems} />
        )}
      </div>
    </LayoutTable>
  );
}
