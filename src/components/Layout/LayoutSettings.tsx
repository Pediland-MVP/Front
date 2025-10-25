import { cn } from "@/lib/utils";

interface LayoutSettingsProps {
  children: React.ReactNode;
  className?: string;
}

export const LayoutSettings = ({
  children,
  className,
}: LayoutSettingsProps) => {
  return (
    <div
      className={cn(
        className,
        "flex-1 flex-col overflow-y-auto rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl",
      )}
    >
      <div className="flex h-full flex-col border-gray-100 px-4 py-5 md:pt-0">
        {children}
      </div>
    </div>
  );
};
