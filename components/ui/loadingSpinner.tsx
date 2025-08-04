// components/theme/ui/loadingSpinner.tsx

import { IconWeight } from "@phosphor-icons/react";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { FC } from "react";

export interface LoadingSpinner {
  size?: "sm" | "lg" | number;
}

const LoadingSpinner: FC<LoadingSpinner> = ({ ...props }) => {
  return (
    <div className="_spinner-wrap flex h-full flex-col items-center justify-center">
      <CircleNotchIcon
        {...props}
        className={`animate-spin`}
        size={props.size === "sm" ? 20 : props.size === "lg" ? 36 : 24}
      />
    </div>
  );
};

export default LoadingSpinner;
