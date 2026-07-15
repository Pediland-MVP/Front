import { cn } from '@/lib/utils';

import { Card } from '@/components/ui/card';

interface CardSimpleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CardSimple = ({ children, className, style }: CardSimpleProps) => {
  return (
    <Card className={cn('gap-0 p-0 shadow-md shadow-gray-200/70', className)} style={style}>
      {children}
    </Card>
  );
};
