// src/app/leads/columns.tsx
"use client";

import { Contact } from "@/types/contact";
import { UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { ColumnDef } from "@/types/tables";

// UI Imports
import Image from "next/image";
import { memo, useState } from "react";

const AvatarCell = memo(function AvatarCell({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);
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
});

export function ContactTableColumns(
  setOpen: (open: boolean) => void,
  setContactId: (contactId: string) => void,
  _data?: Contact[],
  withRowSelection: boolean = false,
): ColumnDef<Contact>[] {
  const cols: ColumnDef<Contact>[] = [];

  if (withRowSelection) {
    cols.push({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          onClick={(e) => e.stopPropagation()}
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          onClick={(e) => e.stopPropagation()}
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
      id: "profilePic",
      accessorFn: (row) => row.lead?.profilePic ?? null,
      header: "تصویر",
      size: 10,
      enableSorting: false,
      cell: ({ row }) => (
        <AvatarCell
          src={row.getValue<string | undefined>("profilePic") ?? ""}
          alt={row.original?.lead?.firstname || "بدون نام"}
        />
      ),
      meta: {
        title: "تصویر",
        skeletonClass: "h-8 w-8 rounded-full mx-auto",
        className: "w-14",
      },
    },
    {
      id: "fullName",
      size: 70,
      enableSorting: false,
      accessorFn: (row) =>
        !row.lead.firstname && !row.lead.lastname
          ? "نامشخص"
          : `${row.lead.firstname ?? ""} ${row.lead.lastname ?? ""}`.trim(),
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
      meta: {
        title: "نام کاربر",
      },
    },
    {
      id: "username",
      accessorFn: (row) => row.username,
      header: "آیدی اینستاگرام",
      size: 50,
      meta: {
        title: "آیدی اینستاگرام",
        skeletonClass: "mx-auto",
      },
    },
    {
      id: "messagesCount",
      accessorFn: (row) => row.messagesCount,
      header: "پیام ها",
      size: 50,
      meta: {
        title: "پیام ها",
        skeletonClass: "mx-auto",
      },
    },
  );

  return cols;
}
