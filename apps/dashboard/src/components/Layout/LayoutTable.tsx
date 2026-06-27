import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface LayoutTableProps {
  children: ReactNode;
  className?: string;
}

export const LayoutTable = ({ children, className }: LayoutTableProps) => {
  return (
    <div
      className={cn(
        '_layout-table flex h-full flex-col overflow-y-auto rounded-t-3xl bg-white md:rounded-t-none',
        className,
      )}
    >
      {children}
    </div>
  );
};
