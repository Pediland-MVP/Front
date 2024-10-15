import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";

interface LoadingProps extends ButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
}
export default function LoadingButton({
  isLoading,
  children,
  ...props
}: LoadingProps) {
  return (
    <Button
      {...props}
      className="bg-blue-600 duration-150 transition-[with]"
      type="submit"
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      {children}
    </Button>
  );
}
