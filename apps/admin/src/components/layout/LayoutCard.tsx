import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface LayoutCardProps {
  children: ReactNode;
  className?: string;
}

export const LayoutCard = ({ children, className }: LayoutCardProps) => {
  return (
    <div
      className={cn(
        '_layout-card flex h-full flex-col overflow-y-auto rounded-t-3xl bg-gradient-to-t from-white/85 to-white px-3 py-4 md:rounded-none md:p-3',
        className,
      )}
    >
      {children}
    </div>
  );
};
