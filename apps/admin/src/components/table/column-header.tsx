// src/components/table/column-header.tsx

// UI Imports
import { Button } from "@/components/ui/button";
import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function ColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sortState = column.getIsSorted();

  const SortIcon =
    sortState === "asc"
      ? ArrowUp
      : sortState === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <Button
      variant={"ghost"}
      className="hover:[&>svg]:text-secondary gap-1 font-semibold has-[>svg]:p-0"
      onClick={() => column.toggleSorting()}
    >
      {title}
      <SortIcon className="size-3.5" />
    </Button>
  );
}
