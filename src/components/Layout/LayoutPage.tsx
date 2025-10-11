import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface LayoutPageProps {
  children: ReactNode;
  className?: string;
  col?: string | "small" | "half" | "full";
}

export const LayoutPage = ({
  col = "full",
  className,
  children,
}: LayoutPageProps) => {
  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-white flex flex-1 flex-col overflow-auto rounded-t-3xl bg-violet-50 md:rounded-t-none md:bg-transparent">
      <div
        className={cn(
          "_layout-page flex flex-1 flex-col border-gray-100 px-3 py-4 md:p-5 bg-white",
          col === "small" && "md:border-l-2 xl:w-1/3",
          col === "half" && "md:border-l-2 xl:w-1/2 2xl:w-1/3",
          col === "full" && "w-full",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
