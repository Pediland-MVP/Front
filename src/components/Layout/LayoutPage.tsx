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
    <div
      className={cn(
        "scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-white flex flex-1 flex-col overflow-auto rounded-t-3xl bg-gradient-to-t from-white/85 to-white md:rounded-t-none",
        col === "half" && "md:pr-3 md:pb-3",
      )}
    >
      <div
        className={cn(
          "_layout-page flex flex-1 flex-col border-gray-100 bg-white px-4 py-5 md:p-5",
          col === "small" && "md:border-l-2 xl:w-1/3",
          col === "half" && "md:rounded-xl md:border-2 xl:w-1/2 2xl:w-1/3",
          col === "full" && "w-full",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
