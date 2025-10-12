import { cn } from "@/lib/utils";

import { Spinner } from "@components";

interface LoaderSpinProps {
  className?: string;
}

export const LoaderSpin = ({ className }: LoaderSpinProps) => {
  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
      <Spinner className={cn("text-secondary size-7", className)} />
    </div>
  );
};
