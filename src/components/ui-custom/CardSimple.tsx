import { cn } from "@/lib/utils";
import { Card } from "@components";

interface CardSimpleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardSimple = ({ children, className }: CardSimpleProps) => {
  return (
    <Card className={cn("p-4 shadow-md shadow-gray-200/70", className)}>
      {children}
    </Card>
  );
};
