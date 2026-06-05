import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface LayoutTableProps {
  children: ReactNode;
  className?: string;
  isRefetching?: boolean;
}

export const LayoutTable = ({ children, className, isRefetching }: LayoutTableProps) => {
  return (
    <div
      className={cn(
        "_layout-table relative flex h-full flex-col overflow-y-auto rounded-t-3xl bg-white md:rounded-t-none",
        className,
      )}
    >
      {isRefetching && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-t-3xl md:rounded-t-none">
          <div className="h-full w-full animate-[progress_1.2s_ease-in-out_infinite] bg-primary" />
        </div>
      )}
      {children}
    </div>
  );
};
