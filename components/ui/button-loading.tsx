import React from "react";

import { Button, ButtonProps } from "@/components/theme/ui/button";
import { Loader2 } from "lucide-react";

interface LoadingProps extends ButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
}
export default function ButtonLoading({
  isLoading,
  children,
  ...props
}: LoadingProps) {
  return (
    <Button
      {...props}
      className={` ${props.className} duration-150 transition-[with]`}
      type="submit"
      disabled={isLoading}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      {children}
    </Button>
  );
}
