import { cn } from "@/lib/utils";
import React from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface ButtonLoadingProps {
  isLoading: boolean;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive";
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  size?: "default" | "sm" | "lg";
}
export const ButtonLoading = ({
  isLoading,
  variant = "default",
  onClick,
  type = "submit",
  size = "default",
  ...props
}: ButtonLoadingProps) => {
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      {...props}
      onClick={onClick}
      disabled={props.disabled ? props.disabled : isLoading}
      className={cn(props.className)}
    >
      {isLoading && <Spinner />}
      {props.children}
    </Button>
  );
};
