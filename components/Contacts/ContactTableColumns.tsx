// src/app/leads/columns.tsx
"use client";

import { ContactNamespace } from "@/types/contact";
import { ColumnDef } from "@tanstack/react-table";

// UI Imports
import Image from "next/image";

export function ContactTableColumns(
  data?: ContactNamespace.Contact[],
  withRowSelection: boolean = false,
): ColumnDef<ContactNamespace.Contact>[] {
  const cols: ColumnDef<ContactNamespace.Contact>[] = [];

  if (withRowSelection) {
    cols.push({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  cols.push(
    {
      accessorKey: "profilePic",
      header: "تصویر",
      cell: ({ row }) => {
        const src =
          row.original?.lead?.profilePic || "/images/avatar-placeholder.png";
        const alt = row.original?.lead?.firstname || "بدون نام";

        return (
          <Image
            src={src}
            alt={alt}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            unoptimized // یا دامنه رو تو next.config.js اضافه کن
          />
        );
      },
    },
    {
      id: "fullName",
      accessorFn: (row) =>
        !row.lead.firstname && !row.lead.lastname
          ? "نامشخص"
          : `${row.lead.firstname ?? ""} ${row.lead.lastname ?? ""}`,
      header: "نام کاربر",
    },
    {
      accessorKey: "username",
      header: "آیدی اینستاگرام",
    },
    {
      accessorKey: "messagesCount",
      header: "پیام ها",
    },
  );

  return cols;
}
