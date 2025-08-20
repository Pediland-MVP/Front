// app/components/Table/TableLayout.tsx

import { cn } from "@/lib/utils";
import { FC, ReactNode } from "react";

export const TableLayout: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("_table-layout flex h-full flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
};
