// src/components/ui-custom/LoaderSpin.tsx

import { IconWeight } from "@phosphor-icons/react";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr";
import { FC } from "react";

export interface LoaderSpinProps {
  size?: "sm" | "md" | "lg" | number;
  className?: string;
  weight?: IconWeight;
}
const LoaderSpin: FC<LoaderSpinProps> = ({ className, ...props }) => {
  return (
    <div
      className={`flex h-full w-full flex-1 flex-col items-center justify-center ${className}`}
    >
      <SpinnerGapIcon
        {...props}
        className={`text-secondary animate-spin ${className}`}
        size={28}
      />
    </div>
  );
};

export default LoaderSpin;
