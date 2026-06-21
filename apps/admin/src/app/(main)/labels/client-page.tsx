"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";
import { Loading } from "@/components/loading";
import { FetchError } from "@/components/fetch-error";
import { useLabelsList } from "./use-labels";
import LabelsTable from "./labels-table";
import { LabelFormDialog } from "./label-form-dialog";
import type { LabelListItem } from "./types";

export default function LabelsPageClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 750);
  const [editing, setEditing] = useState<LabelListItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading, isValidating, error, mutate } = useLabelsList({
    page,
    limit,
    search: debounced,
  });

  if (!data && isLoading) return <Loading />;
  if (error) return <FetchError />;

  return (
    <>
      <LabelsTable
        isRefetching={isValidating && !!data}
        items={data?.items ?? []}
        totalCount={data?.meta?.totalItems ?? 0}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        search={search}
        onSearchChange={setSearch}
        mutate={mutate}
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={(item) => {
          setEditing(item);
          setFormOpen(true);
        }}
      />
      <LabelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        labelId={editing?.id}
        onSaved={() => mutate()}
      />
    </>
  );
}
