import { ColumnDef as BaseColumnDef } from '@tanstack/react-table';

export type ColumnMeta = {
  title: string;
  skeletonClass?: string;
  isNumeric?: boolean;
  headAlign?: 'text-left' | 'text-center' | 'text-right';
  cellAlign?: 'text-left' | 'text-center' | 'text-right';
  className?: string;
};

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<TData, TValue> & {
  meta?: ColumnMeta;
};
