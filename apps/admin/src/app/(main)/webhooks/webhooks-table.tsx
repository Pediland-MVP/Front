"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";

import { LayoutTable } from "@/components/layout/LayoutTable";
import { DataTable } from "@/components/table/data-table";
import { DataTablePagination } from "@/components/table/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { columns } from "./columns";
import { WebhookFormDialog } from "./webhook-form-dialog";
import { SecretRevealDialog } from "./secret-reveal-dialog";
import { WebhookDrawer } from "./webhook-drawer";
import { RevealedSecrets, WebhookEndpoint } from "./types";

interface WebhooksTableProps {
  isRefetching?: boolean;
  webhooks: WebhookEndpoint[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  mutate: () => void;
}

export default function WebhooksTable({
  isRefetching,
  webhooks,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  mutate,
}: WebhooksTableProps) {
  const t = useTranslations("Webhooks");
  const [createOpen, setCreateOpen] = useState(false);
  const [reveal, setReveal] = useState<RevealedSecrets | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<WebhookEndpoint> | null>(null);

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => setCreateOpen(true)}>{t("newWebhook")}</Button>
        </div>

        <DataTable
          columns={columns({ t, onOpen: setSelectedId })}
          data={webhooks}
          page={page}
          limit={limit}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          tableInstanceRef={setTableInstance}
        />

        {tableInstance && <DataTablePagination table={tableInstance} totalCount={totalCount} />}
      </div>

      <WebhookFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={mutate}
        onCreated={setReveal}
      />
      <SecretRevealDialog secrets={reveal} onClose={() => setReveal(null)} />
      <WebhookDrawer
        endpointId={selectedId}
        onClose={() => setSelectedId(null)}
        onListChange={mutate}
        onReveal={setReveal}
      />
    </LayoutTable>
  );
}
