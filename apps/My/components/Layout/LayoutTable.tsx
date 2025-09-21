'use client'

import { cn } from "@befroosh/lib";
import { FC, ReactNode } from "react";

export const LayoutTable: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "_layout-table flex h-full flex-col overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
};
