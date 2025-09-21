'use client'
import { cn } from "@befroosh/lib";
import { ReactNode } from "react";

interface LayoutPageProps {
  children: ReactNode;
  className?: string;
  col?: string | "small" | "half" | "full";
}

export const LayoutPage = ({
  col = "half",
  className,
  children,
}: LayoutPageProps) => {
  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-white flex flex-1 flex-col overflow-auto">
      <div
        className={cn(
          "_layout-page flex flex-1 flex-col md:border-l-2 border-gray-100 px-3 py-4 md:p-5",
          col === "small" && "xl:w-1/3",
          col === "half" && "xl:w-1/2 2xl:w-1/3",
          col === "full" && "w-full",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
