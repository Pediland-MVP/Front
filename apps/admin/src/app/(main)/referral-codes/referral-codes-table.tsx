'use client';

import { useMemo, useState } from 'react';

import { LayoutTable } from '@/components/layout/LayoutTable';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { makeColumns, ReferralCode } from './columns';
import ReferralCodeFormDialog from './referral-code-form-dialog';
import { Table } from '@tanstack/react-table';

interface ReferralCodesTableProps {
  isRefetching?: boolean;
  referralCodes: ReferralCode[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  mutate: () => void;
}

export default function ReferralCodesTable({
  isRefetching,
  referralCodes,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  mutate,
}: ReferralCodesTableProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReferralCode | undefined>();
  const [tableInstance, setTableInstance] = useState<Table<ReferralCode> | null>(null);

  const columns = useMemo(
    () =>
      makeColumns({
        onEdit: (referralCode) => {
          setEditing(referralCode);
          setOpen(true);
        },
      }),
    [],
  );

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <Input
            type="search"
            placeholder="جستجو بر اساس کد یا موبایل..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            ایجاد کد رفرال
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={referralCodes}
          page={page}
          limit={limit}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          tableInstanceRef={setTableInstance}
        />

        {tableInstance && <DataTablePagination table={tableInstance} totalCount={totalCount} />}

        <ReferralCodeFormDialog
          open={open}
          onOpenChange={setOpen}
          referralCode={editing}
          onSaved={mutate}
        />
      </div>
    </LayoutTable>
  );
}
