'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Table } from '@tanstack/react-table';

import { LayoutTable } from '@/components/layout/LayoutTable';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import api from '@/hooks/swr/api-client';
import { useWorkspaceCategoryColumns, WorkspaceCategoryRow } from './columns';

const FormSchema = z.object({
  nameEn: z.string().min(1).max(100),
  nameFa: z.string().min(1).max(100),
});

type FormValues = z.infer<typeof FormSchema>;

interface WorkspaceCategoriesTableProps {
  isRefetching?: boolean;
  categories: WorkspaceCategoryRow[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  mutate: () => void;
}

export default function WorkspaceCategoriesTable({
  isRefetching,
  categories,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  mutate,
}: WorkspaceCategoriesTableProps) {
  const t = useTranslations('WorkspaceCategories');
  const t_ec = useTranslations('ERROR_CODES');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkspaceCategoryRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableInstance, setTableInstance] = useState<Table<WorkspaceCategoryRow> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { nameEn: '', nameFa: '' },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ nameEn: '', nameFa: '' });
    setOpen(true);
  };

  const openEdit = (row: WorkspaceCategoryRow) => {
    setEditing(row);
    form.reset({ nameEn: row.nameEn, nameFa: row.nameFa });
    setOpen(true);
  };

  const handleDelete = async (row: WorkspaceCategoryRow) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/workspace-categories/${row.id}`);
      toast.success(t('deleteSuccess'));
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('deleteConfirm'));
    }
  };

  const columns = useWorkspaceCategoryColumns(openEdit, handleDelete);

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/workspace-categories/${editing.id}`, data);
        toast.success(t('updateSuccess'));
      } else {
        await api.post('/workspace-categories', data);
        toast.success(t('createSuccess'));
      }
      setOpen(false);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search')}
            className="h-9 flex-1 text-[13px] md:max-w-[220px]"
          />
          <Button onClick={openCreate}>{t('addCategory')}</Button>
        </div>

        <DataTable
          columns={columns}
          data={categories}
          tableInstanceRef={setTableInstance}
          page={page}
          limit={limit}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />

        {tableInstance && <DataTablePagination table={tableInstance} totalCount={totalCount} />}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editing ? t('editCategory') : t('addCategory')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nameFa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('nameFa')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('nameFaPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('nameEn')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('nameEnPlaceholder')} dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('saving') : t('save')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutTable>
  );
}
