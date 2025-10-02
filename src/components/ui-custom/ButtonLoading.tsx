import { Loader2 } from "lucide-react";
import React, { FC } from "react";

import { Button, ButtonProps } from "@/components/ui/button";

interface ButtonLoadingProps extends ButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
}
export const ButtonLoading: FC<ButtonLoadingProps> = ({
  isLoading,
  children,
  ...props
}: ButtonLoadingProps) => {
  return (
    <Button
      {...props}
      className={` ${props.className} transition-[with] duration-150`}
      type="submit"
      disabled={props.disabled ? props.disabled : isLoading}
    >
      {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
};
