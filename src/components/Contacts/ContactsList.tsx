"use client";

import { InstagramFilter } from "@/components/ui-custom/InstagramFilter";
import { toContact } from "@/lib/mappers/contact";
import type { PageMeta, Paginated } from "@/types/api";
import type { ContactWire } from "@/types/contact";
import { Table } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";


import { ContactTableColumns } from "./ContactTableColumns";
import { ContactDetailsDialog } from "./ContactDetailsDialog";
import { DataTable } from "../Table/TableData";
import { TablePagination } from "../Table/TablePagination";

export const ContactsList = ({ search }: { search: string }) => {
  // Dialog
  const [open, setOpen] = useState<boolean>(false);
  const [contactId, setContactId] = useState<string>("");

  // Table
  const [tableInstance, setTableInstance] = useState<Table<any> | null>(null);

  const [selectedInstagramIds, setSelectedInstagramIds] = useState<string[]>([]);

  // Server-side pagination state (1-based page)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);

  const onPageChange = useCallback(
    (newPage: number) => setPage(Math.max(1, newPage)),
    [],
  );
  const onLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // SWR key as a tuple: [url, { params }]
  const instagramIdsParam = selectedInstagramIds
    .map((id) => `instagramIds[]=${id}`)
    .join("&");

  const swrKey = useMemo(
    () =>
      selectedInstagramIds.length > 0
        ? `/contacts?page=${page}&limit=${limit}${search ? `&search=${search}` : ""}&${instagramIdsParam}`
        : null,
    [page, limit, search, instagramIdsParam, selectedInstagramIds.length],
  );

  // Global fetcher from SWRProvider handles this tuple key
  const { data, error, isLoading } = useSWR<Paginated<ContactWire>>(swrKey);

  // Map Wire -> Domain (memoized)
  const rawItems = data?.items ?? [];
  const items = useMemo(() => rawItems.map(toContact), [rawItems]);

  const columns = useMemo(
    () => ContactTableColumns(setOpen, setContactId, items),
    [items],
  );

  // Safe meta (fallback while loading)
  const defaultMeta: PageMeta = {
    currentPage: page,
    itemsPerPage: limit,
    itemCount: 0,
    totalItems: 0,
    totalPages: 1,
  };
  const meta: PageMeta = data?.meta ?? defaultMeta;

  const currentPage = meta.currentPage;
  const itemsPerPage = meta.itemsPerPage;
  const itemCount = meta.itemCount;
  const totalItems = meta.totalItems;
  const totalPages = meta.totalPages;

  // Clamp page if server reports fewer pages (e.g., after a narrow search)
  useEffect(() => {
    if (currentPage > totalPages) setPage(totalPages);
  }, [currentPage, totalPages]);

  // Block controls while loading or in error state
  const blockControls = isLoading || !!error;

  return (
    <>
      <InstagramFilter
        selectedIds={selectedInstagramIds}
        onChange={setSelectedInstagramIds}
      />
      <ContactDetailsDialog
        open={open}
        setOpen={setOpen}
        contactId={contactId}
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        page={currentPage}
        limit={itemsPerPage}
        totalCount={totalItems}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        tableInstanceRef={setTableInstance}
      />

      <TablePagination
        isLoading={blockControls}
        table={tableInstance}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        totalCount={totalItems}
        serverPage={currentPage}
        serverPerPage={itemsPerPage}
        serverItemCount={itemCount}
        serverTotalPages={totalPages}
      />
    </>
  );
};
