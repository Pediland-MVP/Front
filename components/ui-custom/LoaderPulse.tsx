// src/components/ui-custom/LoaderPulse.tsx

import { cn } from "@/lib/utils";
import { EllipsisIcon } from "lucide-react";

interface LoaderPulseProps {
  size?: number;
}

export const LoaderPulse = ({ size }: LoaderPulseProps) => {
  return (
    <div className="flex items-center justify-center">
      <EllipsisIcon
        className={cn(
          "animate-pulse text-gray-500",
          size ? `size-${size}` : "size-4",
        )}
      />
    </div>
  );
};
