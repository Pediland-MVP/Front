import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface LayoutCardProps {
  children: ReactNode;
  className?: string;
}

export const LayoutCard = ({ children, className }: LayoutCardProps) => {
  return (
    <div
      className={cn(
        "_layout-card flex h-full flex-col overflow-hidden rounded-t-3xl bg-violet-50 px-3 py-4 md:p-3 md:rounded-none",
        className,
      )}
    >
      {children}
    </div>
  );
};
