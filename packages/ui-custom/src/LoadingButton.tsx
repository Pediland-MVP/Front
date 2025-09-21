import React from "react";

import { Button, ButtonProps } from "@befroosh/ui/src/button";
import { Loader2 } from "lucide-react";

interface LoadingProps extends ButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
}
export const LoadingButton = ({
  isLoading,
  children,
  ...props
}: LoadingProps) => {
  return (
    <Button
      {...props}
      className={` ${props.className} duration-150 transition-[with]`}
      type="submit"
      disabled={props.disabled ? props.disabled : isLoading}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      {children}
    </Button>
  );
}
