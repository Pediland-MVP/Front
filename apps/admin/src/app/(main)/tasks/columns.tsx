"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { TaskListItem } from "@/types/task";
import { formatTaskDate } from "@/lib/task-datetime";
import { toAssignedLabels } from "./to-assigned-labels";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ContactOptions } from "@/components/table/contact-options";
import { LabelChips } from "@/components/table/label-chips";

interface TaskColumnsOpts {
  role: string;
  onManage: (task: TaskListItem) => void;
  t: (key: string) => string;
}

export function taskColumns({
  role,
  onManage,
  t,
}: TaskColumnsOpts): ColumnDef<TaskListItem>[] {
  const cols: ColumnDef<TaskListItem>[] = [
    // ── 2. actions ───────────────────────────────────────────────────────────
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => (
        <Button size="sm" onClick={() => onManage(row.original)}>
          {t("manage")}
        </Button>
      ),
    },

    // ── 3. admin (super-admin only) ──────────────────────────────────────────
    ...(role !== "kam"
      ? ([
          {
            id: "admin",
            header: t("columns.admin"),
            cell: ({ row }) =>
              `${row.original.admin.firstname} ${row.original.admin.lastname}`,
          },
        ] as ColumnDef<TaskListItem>[])
      : []),

    // ── 4. actionDate ────────────────────────────────────────────────────────
    {
      id: "actionDate",
      header: t("columns.actionDate"),
      cell: ({ row }) => formatTaskDate(row.original.actionDate),
    },

    // ── 5. description ───────────────────────────────────────────────────────
    {
      id: "description",
      header: t("columns.description"),
      cell: ({ row }) => {
        const desc = row.original.description ?? "";
        const truncated = desc.length > 40 ? desc.slice(0, 40) + "…" : desc;
        return truncated ? (
          <span title={desc}>{truncated}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },

    // ── 6. user ──────────────────────────────────────────────────────────────
    {
      id: "user",
      header: t("columns.user"),
      cell: ({ row }) => {
        const { id, firstname, lastname } = row.original.user;
        return (
          <Link
            href={`/customers/${id}`}
            className="text-primary hover:text-secondary underline-offset-4 hover:underline"
          >
            {`${firstname} ${lastname}`.trim()}
          </Link>
        );
      },
    },

    // ── 7. instagram ─────────────────────────────────────────────────────────
    {
      id: "instagram",
      header: t("columns.instagram"),
      cell: ({ row }) => {
        const username = row.original.instagramUsername;
        return username ? (
          <Link
            className="text-primary hover:text-secondary text-sm lowercase underline-offset-4 hover:underline"
            href={`https://www.instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {username}
          </Link>
        ) : (
          "-"
        );
      },
    },

    // ── 8. mobile ────────────────────────────────────────────────────────────
    {
      id: "mobile",
      header: t("columns.mobile"),
      cell: ({ row }) => {
        const { id, firstname, lastname, mobile } = row.original.user;
        return (
          <ContactOptions
            leadId={id}
            mobile={mobile}
            fullName={`${firstname} ${lastname}`.trim()}
          />
        );
      },
    },

    // ── 9. labels ────────────────────────────────────────────────────────────
    {
      id: "labels",
      header: t("columns.labels"),
      cell: ({ row }) => (
        <LabelChips labels={toAssignedLabels(row.original.labels)} />
      ),
    },
  ];

  // ── 1. select (super-admin only, prepended) ───────────────────────────────
  if (role !== "kam") {
    cols.unshift({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    });
  }

  return cols;
}
