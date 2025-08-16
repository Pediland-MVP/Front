// src/app/leads/columns.tsx
"use client";

import { ContactNamespace } from "@/types/contact";
import { UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { ColumnDef } from "@tanstack/react-table";

// UI Imports
import Image from "next/image";
import { useState } from "react";

export function ContactTableColumns(
  setOpen: (open: boolean) => void,
  setContactId: (contactId: string) => void,
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
      size: 10,
      cell: ({ row }) => {
        const [hasError, setHasError] = useState(false);
        const src = row.original?.lead?.profilePic;
        const alt = row.original?.lead?.firstname || "بدون نام";

        const showFallback = hasError || !src;

        return (
          <div className="flex justify-center">
            {showFallback ? (
              <UserCircleIcon
                className="mx-auto size-8 text-neutral-400"
                weight="duotone"
              />
            ) : (
              <Image
                src={src}
                alt={alt}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
                onError={() => setHasError(true)}
                unoptimized
              />
            )}
          </div>
        );
      },
      meta: {
        skeletonClass: "h-8 w-8 rounded-full mx-auto",
      },
    },
    {
      id: "fullName",
      size: 70,
      accessorFn: (row) =>
        !row.lead.firstname && !row.lead.lastname
          ? "نامشخص"
          : `${row.lead.firstname ?? ""} ${row.lead.lastname ?? ""}`,
      header: () => <div className="text-right">نام کاربر</div>,
      cell: ({ row }) => (
        <div
          className="cursor-pointer text-right hover:text-blue-900"
          onClick={() => {
            setOpen(true);
            setContactId(row.original.id);
          }}
        >
          {row.getValue("fullName")}
        </div>
      ),
    },
    {
      accessorKey: "username",
      header: "آیدی اینستاگرام",
      size: 50,
      meta: {
        skeletonClass: "mx-auto",
      },
    },
    {
      accessorKey: "messagesCount",
      header: "پیام ها",
      size: 50,
      meta: {
        skeletonClass: "mx-auto",
      },
    },
  );

  return cols;
}
