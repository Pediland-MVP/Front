// src/types/tables.ts
import { ColumnDef as BaseColumnDef } from '@tanstack/react-table';

export type ColumnMeta = {
  isNumeric?: boolean;
  title: string;
  headAlign?: 'text-left' | 'text-center' | 'text-right';
  cellAlign?: 'text-left' | 'text-center' | 'text-right';
};

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<TData, TValue> & {
  meta?: ColumnMeta;
};
