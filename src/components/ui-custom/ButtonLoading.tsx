import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/index";

interface ButtonLoadingProps {
  isLoading: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}
export const ButtonLoading = ({
  isLoading,
  onClick,
  ...props
}: ButtonLoadingProps) => {
  return (
    <Button
      {...props}
      className={cn(props.className)}
      type="submit"
      disabled={props.disabled ? props.disabled : isLoading}
    >
      {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      {props.children}
    </Button>
  );
};
