// src/app/leads/columns.tsx
'use client';

import type { Automation } from '@/schemas/automation';
import type { ColumnDef } from '@/types/tables';
import { toJalaliDate } from '@/utils/jalali';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useState } from 'react';

import { ChatCircleTextIcon } from '@phosphor-icons/react/dist/ssr/ChatCircleText';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { DotsThreeOutlineIcon } from '@phosphor-icons/react/dist/ssr/DotsThreeOutline';
import { UserCircleIcon } from '@phosphor-icons/react/dist/ssr/UserCircle';
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui';

const AvatarCell = memo(function AvatarCell({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);
  const showFallback = hasError || !src;

  return (
    <div className="flex justify-center">
      {showFallback ? (
        <UserCircleIcon className="mx-auto size-8 text-neutral-400" weight="duotone" />
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

export const AutomationTableColumns = (
  onDelete?: (id: string) => void,
  setOpen?: (open: boolean) => void,
  setAutomationId?: (automationId: string) => void,
  _data?: Automation[],
  withRowSelection: boolean = false,
): ColumnDef<Automation>[] => {
  const cols: ColumnDef<Automation>[] = [];

  if (withRowSelection) {
    cols.push({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          onClick={(e) => e.stopPropagation()}
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      size: 50,
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
      id: 'createDate',
      accessorFn: (row) => row.createDate,
      header: 'تاریخ ایجاد',
      size: 120,
      cell: ({ row }) => {
        const value = row.getValue<string>('createDate');

        if (!value) return '-';

        return (
          <Link href={`/automations/${row.id}`} className="text-[13px] hover:text-fuchsia-800">
            {toJalaliDate(value, 'Europe/Berlin')}
          </Link>
        );
      },
      meta: {
        title: 'تاریخ ایجاد',
        skeletonClass: 'mx-auto',
      },
    },
    {
      id: 'conditions',
      accessorFn: (row) =>
        (row.conditions ?? [])
          .map((c) => c?.value)
          .filter((v): v is string => Boolean(v && String(v).trim())),
      header: () => <div className="text-right">شروط فعالسازی</div>,
      size: 300,
      cell: ({ getValue }) => {
        const values = getValue<string[]>();
        return (
          <div className="flex gap-1.5">
            {values.length ? (
              values.map((val, i) => (
                <Badge key={i} variant="outline" className="rounded px-1.5 text-[13px] font-medium">
                  {val}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">بدون شرط</span>
            )}
          </div>
        );
      },
      meta: {
        title: 'شرایط فعالسازی',
      },
    },
    {
      id: 'isDirect',
      accessorFn: (row) => row.isDirect,
      header: 'دایرکت',
      size: 50,
      cell: ({ row }) =>
        row.getValue<boolean>('isDirect') && (
          <CheckCircleIcon
            weight="light"
            className="group-hover:text-primary mx-auto text-gray-400"
            size={20}
          />
        ),
      meta: {
        title: 'دایرکت',
        skeletonClass: 'mx-auto w-4 rounded-none',
      },
    },
    {
      id: 'isComment',
      accessorFn: (row) => row.isComment,
      header: 'کامنت',
      size: 50,
      cell: ({ row }) =>
        row.getValue<boolean>('isComment') && (
          <CheckCircleIcon
            weight="light"
            className="group-hover:text-primary mx-auto text-gray-400"
            size={20}
          />
        ),
      meta: {
        title: 'کامنت',
        skeletonClass: 'mx-auto w-4 rounded-none',
      },
    },
    {
      id: 'sessions',
      header: 'پاسخ‌ها',
      size: 150,
      cell: ({ row }) => (
        <div className="flex justify-center gap-1">
          <ChatCircleTextIcon weight="light" size={20} /> <span>0</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'عملیات',
      size: 150,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <DotsThreeOutlineIcon size={20} className="cursor-pointer hover:text-fuchsia-800" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href={`/automations/${row.id}`}>ویرایش</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(row.original.id)}>حذف</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  );

  return cols;
};
