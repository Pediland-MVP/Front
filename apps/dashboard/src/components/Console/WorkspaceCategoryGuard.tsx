'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceCategories } from '@/hooks/useWorkspaceCategories';
import api from '@/hooks/swr/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// The active workspace's category is nullable for workspaces created before
// this feature shipped. An owner who lands on such a workspace must pick one
// before doing anything else; non-owners aren't blocked since only the owner
// can act on it. The dialog is intentionally inescapable: no close button, and
// both the Escape key and outside clicks are suppressed.
export default function WorkspaceCategoryGuard() {
  const t = useTranslations('Settings.Workspace');
  const { workspaceId, userId } = usePermissions();
  const { workspaces, isLoading, mutate } = useWorkspaces();
  const { categories, isLoading: categoriesLoading } = useWorkspaceCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === workspaceId);
  const needsCategory =
    !isLoading &&
    !!activeWorkspace &&
    !activeWorkspace.category &&
    activeWorkspace.ownerId === userId;

  if (!needsCategory) return null;

  const handleSubmit = async () => {
    if (!selectedCategoryId || !workspaceId) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/workspaces/${workspaceId}`, { categoryId: selectedCategoryId });
      await mutate();
    } catch {
      toast.error(t('category_dialog_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('category_dialog_title')}</DialogTitle>
          <DialogDescription>{t('category_dialog_description')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-3">
          <Select
            value={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
            disabled={categoriesLoading}
          >
            <SelectTrigger className="w-full">
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
          <Button
            onClick={handleSubmit}
            disabled={!selectedCategoryId || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? t('creating') : t('category_dialog_confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
