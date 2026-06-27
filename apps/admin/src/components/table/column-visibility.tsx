// src/components/table/column-visibility.tsx

import { ColumnMeta } from '@/types/tables';
import { Table, VisibilityState } from '@tanstack/react-table';

// UI Imports
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2Icon } from 'lucide-react';

interface ColVisibilityProps<T> {
  table?: Table<T>;
  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
}

export function ColVisibility<T>({
  table,
  columnVisibility,
  setColumnVisibility,
}: ColVisibilityProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Settings2Icon />
          نمایش
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          ?.getAllColumns()
          .filter((col) => col.getCanHide())
          .map((col) => (
            <DropdownMenuCheckboxItem
              key={col.id}
              size="sm"
              className="capitalize"
              checked={columnVisibility[col.id] !== false}
              onCheckedChange={(value) => {
                setColumnVisibility((prev) => ({
                  ...prev,
                  [col.id]: !!value,
                }));
              }}
            >
              {(col.columnDef.meta as ColumnMeta)?.title ?? col.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
