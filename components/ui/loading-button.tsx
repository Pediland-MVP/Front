import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";

type LoadingProps = {
  isLoading: boolean;
  children: React.ReactNode;
};
export default function LoadingButton({ isLoading, children }: LoadingProps) {
  return (
    <Button
      className="bg-blue-600 duration-150 transition-[with]"
      type="submit"
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      {children}
    </Button>
  );
}
