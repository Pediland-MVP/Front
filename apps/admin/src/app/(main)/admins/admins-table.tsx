'use client';

import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DialogDelete from '@/components/dialog-delete';
import { Table } from '@tanstack/react-table';
import api from '@/hooks/swr/api-client';
import { AdminRow, useAdminColumns } from './columns';

const ROLES = ['admin', 'manager', 'kam'] as const;

const CreateSchema = z.object({
  firstname: z.string().min(1).max(100),
  lastname: z.string().min(1).max(100),
  username: z.string().min(14).max(64),
  password: z.string().min(16).max(64),
  role: z.enum(ROLES).optional(),
  telegramId: z.string().max(100).optional().or(z.literal('')),
});

const EditSchema = z.object({
  firstname: z.string().min(1).max(100).optional(),
  lastname: z.string().min(1).max(100).optional(),
  username: z.string().min(14).max(64).optional(),
  password: z.string().min(16).max(64).optional().or(z.literal('')),
  role: z.enum(ROLES).optional(),
  telegramId: z.string().max(100).optional().or(z.literal('')),
});

type CreateValues = z.infer<typeof CreateSchema>;
type EditValues = z.infer<typeof EditSchema>;

function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateStrongPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  const rest = Array.from({ length: 12 }, () => all[Math.floor(Math.random() * all.length)]);
  return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
}

interface AdminsTableProps {
  isRefetching?: boolean;
  admins: AdminRow[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  mutate: () => void;
}

export default function AdminsTable({
  isRefetching,
  admins,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  mutate,
}: AdminsTableProps) {
  const t = useTranslations('Admins');
  const t_ec = useTranslations('ERROR_CODES');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableInstance, setTableInstance] = useState<Table<AdminRow> | null>(null);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(CreateSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      username: '',
      password: '',
      role: 'kam',
      telegramId: '',
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(EditSchema),
  });

  const handleOpenEdit = (admin: AdminRow) => {
    setEditTarget(admin);
    editForm.reset({
      firstname: admin.firstname,
      lastname: admin.lastname,
      username: admin.username,
      password: '',
      role: admin.role,
      telegramId: admin.telegramId ?? '',
    });
  };

  const handleCreate = async (data: CreateValues) => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        firstname: data.firstname,
        lastname: data.lastname,
        username: data.username,
        password: data.password,
        role: data.role ?? 'kam',
      };
      if (data.telegramId) payload.telegramId = data.telegramId;
      await api.post('/admins', payload);
      toast.success(t('createSuccess'));
      createForm.reset();
      setCreateOpen(false);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: EditValues) => {
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      if (data.firstname) payload.firstname = data.firstname;
      if (data.lastname) payload.lastname = data.lastname;
      if (data.username) payload.username = data.username;
      if (data.password) payload.password = data.password;
      if (data.role) payload.role = data.role;
      if (data.telegramId !== undefined) payload.telegramId = data.telegramId || null;
      await api.patch(`/admins/${editTarget.id}`, payload);
      toast.success(t('updateSuccess'));
      setEditTarget(null);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admins/${deleteTarget.id}`);
      setDeleteTarget(null);
      toast.success(t('deleteSuccess'));
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t('deleteError'));
    }
  };

  const columns = useAdminColumns({ onEdit: handleOpenEdit, onDelete: setDeleteTarget });

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => setCreateOpen(true)}>{t('createAdmin')}</Button>
        </div>

        <DataTable
          columns={columns}
          data={admins}
          page={page}
          limit={limit}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          tableInstanceRef={setTableInstance}
        />

        {tableInstance && <DataTablePagination table={tableInstance} totalCount={totalCount} />}

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>{t('createAdminTitle')}</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={createForm.control}
                    name="firstname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('firstname')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="lastname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('lastname')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('username')}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} className="font-mono" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const base = field.value.split('-')[0] || field.value;
                            field.onChange(`${base}-${generateRandomSuffix()}`);
                          }}
                        >
                          {t('generateSuffix')}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('password')}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} className="font-mono" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => field.onChange(generateStrongPassword())}
                        >
                          {t('generatePassword')}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('role')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kam">{t('role_kam')}</SelectItem>
                          <SelectItem value="manager">{t('role_manager')}</SelectItem>
                          <SelectItem value="admin">{t('role_admin')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="telegramId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('telegramIdOptional')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
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

        {/* Edit Dialog */}
        <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>{t('editAdminTitle')}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={editForm.control}
                    name="firstname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('firstname')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="lastname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('lastname')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('username')}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} className="font-mono" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const base = (field.value ?? '').split('-')[0] || (field.value ?? '');
                            field.onChange(`${base}-${generateRandomSuffix()}`);
                          }}
                        >
                          {t('generateSuffix')}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('passwordOptional')}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            className="font-mono"
                            placeholder={t('passwordPlaceholder')}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => field.onChange(generateStrongPassword())}
                        >
                          {t('generatePassword')}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('role')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kam">{t('role_kam')}</SelectItem>
                          <SelectItem value="manager">{t('role_manager')}</SelectItem>
                          <SelectItem value="admin">{t('role_admin')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="telegramId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('telegramIdOptional')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
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

        {/* Delete Confirmation */}
        <DialogDelete
          open={!!deleteTarget}
          onOpenChange={(v) => !v && setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      </div>
    </LayoutTable>
  );
}
