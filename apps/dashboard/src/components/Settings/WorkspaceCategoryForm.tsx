'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/hooks/swr/api-client';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaceCategories } from '@/hooks/useWorkspaceCategories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';

export function WorkspaceCategoryForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations('Settings.Workspace');
  const t_ec = useTranslations('ERROR_CODES');
  const { workspaceId, can } = usePermissions();
  const { workspaces, isLoading: workspacesIsLoading, mutate } = useWorkspaces();
  const { categories, isLoading: categoriesIsLoading } = useWorkspaceCategories();
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === workspaceId);
  const canManage = can('team:manage');

  // The workspace carries its category as a nested object (`category.id`), while the
  // PATCH body wants a flat `categoryId` — hence the read/write asymmetry here.
  useEffect(() => {
    if (activeWorkspace?.category?.id) {
      setCategoryId(activeWorkspace.category.id);
    }
  }, [activeWorkspace?.category?.id]);

  const onSubmit = async () => {
    if (!workspaceId || !categoryId) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/workspaces/${workspaceId}`, { categoryId });
      toast.success(t('category_success'));
      mutate();
      onSuccess?.();
    } catch (e: any) {
      toast.error(t_ec(e?.response?.data?.code) || t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (workspacesIsLoading || categoriesIsLoading) return <LoaderSpin />;

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium">{t('category_label')}</label>
      <Select value={categoryId} onValueChange={setCategoryId} disabled={!canManage}>
        <SelectTrigger className="w-full md:w-1/2">
          <SelectValue placeholder={t('category_placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.nameFa}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground mt-2 text-xs">{t('category_description')}</p>
      <ButtonLoading
        isLoading={isSubmitting}
        type="button"
        onClick={onSubmit}
        disabled={!canManage || !categoryId}
        className="mt-4 w-full md:w-auto"
      >
        {t('save')}
      </ButtonLoading>
    </div>
  );
}
