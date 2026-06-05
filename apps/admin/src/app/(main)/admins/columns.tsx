"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/table/column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import dayjs from "@/lib/dayjs-jalali";
import { useTranslations } from "next-intl";

export type AdminRow = {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  role: "admin" | "manager" | "kam";
  telegramId: string | null;
  createDate: string;
};

interface ColumnActions {
  onEdit: (admin: AdminRow) => void;
  onDelete: (admin: AdminRow) => void;
}

const roleVariant: Record<string, "default" | "secondary" | "destructive"> = {
  admin: "destructive",
  manager: "default",
  kam: "secondary",
};

export function useAdminColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<AdminRow>[] {
  const t = useTranslations("Admins");

  return [
    {
      accessorKey: "createDate",
      header: ({ column }) => <ColumnHeader column={column} title={t("createDate")} />,
      cell: ({ row }) => {
        const date = row.getValue("createDate") as string;
        return <span>{dayjs(date).calendar("jalali").format("YYYY/MM/DD")}</span>;
      },
    },
    {
      accessorKey: "firstname",
      header: t("firstname"),
    },
    {
      accessorKey: "lastname",
      header: t("lastname"),
    },
    {
      accessorKey: "username",
      header: t("username"),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("username")}</span>
      ),
    },
    {
      accessorKey: "role",
      header: t("role"),
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        const label = t(`role_${role}` as any);
        return <Badge variant={roleVariant[role] ?? "secondary"}>{label}</Badge>;
      },
    },
    {
      accessorKey: "telegramId",
      header: t("telegramId"),
      cell: ({ row }) => <span>{row.getValue("telegramId") ?? "—"}</span>,
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            icon
            onClick={() => onEdit(row.original)}
          >
            <PencilSimpleIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            color="destructive"
            icon
            className="hover:text-red-500"
            onClick={() => onDelete(row.original)}
          >
            <TrashIcon />
          </Button>
        </div>
      ),
    },
  ];
}
