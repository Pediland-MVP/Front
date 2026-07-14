'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Table } from '@tanstack/react-table';
import { Trash } from 'lucide-react';

import { LayoutTable } from '@/components/layout/LayoutTable';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { formatNumber } from '@/lib/formatNumber';
import { onInputP2EHandler } from '@/lib/p2eNumber';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import api from '@/hooks/swr/api-client';
import { useBannerColumns, BannerRow, BannerCategoryRow } from './columns';

const ButtonSchema = z.object({
  textEn: z.string().min(1).max(100),
  textFa: z.string().min(1).max(100),
  url: z.string().url(),
});

const FormSchema = z.object({
  titleEn: z.string().min(1).max(200),
  titleFa: z.string().min(1).max(200),
  descriptionEn: z.string().min(1),
  descriptionFa: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'رنگ باید مثل #1F6F43 باشد'),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  categoryIds: z.array(z.string()),
  buttons: z.array(ButtonSchema),
});

type FormValues = z.infer<typeof FormSchema>;

interface BannersTableProps {
  isRefetching?: boolean;
  banners: BannerRow[];
  categories: BannerCategoryRow[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  mutate: () => void;
}

const emptyDefaults: FormValues = {
  titleEn: '', titleFa: '', descriptionEn: '', descriptionFa: '', color: '#1F6F43',
  isActive: true, order: 0, categoryIds: [], buttons: [],
};

export default function BannersTable({
  isRefetching, banners, categories, totalCount, page, limit,
  onPageChange, onLimitChange, search, onSearchChange, mutate,
}: BannersTableProps) {
  const t = useTranslations('Banners');
  const t_ec = useTranslations('ERROR_CODES');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableInstance, setTableInstance] = useState<Table<BannerRow> | null>(null);
  const { onFocus } = useSelectOnFocus();

  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: emptyDefaults });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'buttons' });

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyDefaults);
    setOpen(true);
  };

  const openEdit = (row: BannerRow) => {
    setEditing(row);
    form.reset({
      titleEn: row.titleEn, titleFa: row.titleFa,
      descriptionEn: row.descriptionEn, descriptionFa: row.descriptionFa,
      color: row.color, isActive: row.isActive, order: row.order,
      categoryIds: row.categories.map((c) => c.id),
      buttons: row.buttons.map((b) => ({ textEn: b.textEn, textFa: b.textFa, url: b.url })),
    });
    setOpen(true);
  };

  const handleDelete = async (row: BannerRow) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/banners/${row.id}`);
      toast.success(t('deleteSuccess'));
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('toastError'));
    }
  };

  const columns = useBannerColumns(openEdit, handleDelete);

  const toggleCategory = (id: string) => {
    const current = form.getValues('categoryIds');
    form.setValue(
      'categoryIds',
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );
  };

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        buttons: data.buttons.map((b, index) => ({ ...b, order: index })),
      };
      if (editing) {
        await api.patch(`/banners/${editing.id}`, payload);
        toast.success(t('updateSuccess'));
      } else {
        await api.post('/banners', payload);
        toast.success(t('createSuccess'));
      }
      setOpen(false);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('toastError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryIds = form.watch('categoryIds');

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
          <Button onClick={openCreate}>{t('addBanner')}</Button>
        </div>

        <DataTable
          columns={columns}
          data={banners}
          tableInstanceRef={setTableInstance}
          page={page}
          limit={limit}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />

        {tableInstance && <DataTablePagination table={tableInstance} totalCount={totalCount} />}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg overflow-y-auto" style={{ maxHeight: '90vh' }} dir="rtl">
            <DialogHeader>
              <DialogTitle>{editing ? t('editBanner') : t('addBanner')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField control={form.control} name="titleFa" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('titleFa')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="titleEn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('titleEn')}</FormLabel>
                    <FormControl><Input dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="descriptionFa" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('descriptionFa')}</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="descriptionEn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('descriptionEn')}</FormLabel>
                    <FormControl><Textarea dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="color" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('color')}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input type="color" value={field.value} onChange={field.onChange} className="h-9 w-12 rounded border" />
                        <Input dir="ltr" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="order" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('order')}</FormLabel>
                    <FormControl>
                      <Input
                        onInput={onInputP2EHandler}
                        onFocus={onFocus}
                        placeholder="۰"
                        value={field.value ? formatNumber(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel>{t('isActive')}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />

                <div>
                  <FormLabel>{t('categories')}</FormLabel>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedCategoryIds.length === 0 ? 'default' : 'outline'}
                      onClick={() => form.setValue('categoryIds', [])}
                    >
                      {t('allWorkspaces')}
                    </Button>
                    {categories.map((c) => (
                      <Button
                        key={c.id}
                        type="button"
                        size="sm"
                        variant={selectedCategoryIds.includes(c.id) ? 'default' : 'outline'}
                        onClick={() => toggleCategory(c.id)}
                      >
                        {c.nameFa}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <FormLabel>{t('buttons')}</FormLabel>
                  <div className="mt-2 space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex flex-col gap-2 rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">{t('button')} {index + 1}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input placeholder={t('buttonTextFa')} {...form.register(`buttons.${index}.textFa`)} />
                        <Input dir="ltr" placeholder={t('buttonTextEn')} {...form.register(`buttons.${index}.textEn`)} />
                        <Input dir="ltr" placeholder="https://..." {...form.register(`buttons.${index}.url`)} />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ textEn: '', textFa: '', url: '' })}
                    >
                      {t('addButton')}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('saving') : t('save')}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutTable>
  );
}
