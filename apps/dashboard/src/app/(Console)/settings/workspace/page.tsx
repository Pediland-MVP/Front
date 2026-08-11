'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { mutate as globalMutate } from 'swr';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { Plus } from 'lucide-react';

import api from '@/hooks/swr/api-client';
import { useInvitations } from '@/hooks/useInvitations';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceCategories } from '@/hooks/useWorkspaceCategories';

import { LayoutSettings } from '@/components/Layout/LayoutSettings';
import { WorkspaceForm } from '@/components/Settings/WorkspaceForm';
import { WorkspaceCategoryForm } from '@/components/Settings/WorkspaceCategoryForm';
import { WorkspaceDeleteDialog } from '@/components/Settings/WorkspaceDeleteDialog';
import { TransferOwnershipDialog } from '@/components/Settings/TransferOwnershipDialog';
import { IncomingTransferBanner } from '@/components/Settings/IncomingTransferBanner';
import { PendingTransferNotice } from '@/components/Settings/PendingTransferNotice';
import { Button } from '@/components/ui/button';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Page() {
  const t = useTranslations('Settings.Workspace');
  const t_ec = useTranslations('ERROR_CODES');
  const { pendingCount, isLoading: isInvitationsLoading } = useInvitations();
  const { workspaceId, userId, can, isLoading: isLoadingPermissions } = usePermissions();
  const { workspaces, isLoading: workspacesIsLoading, changeWorkspace, mutate } = useWorkspaces();
  const { categories } = useWorkspaceCategories();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createWorkspaceName, setCreateWorkspaceName] = useState('');
  const [createWorkspaceCategoryId, setCreateWorkspaceCategoryId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const activeWorkspace = workspaces.find((w: any) => w.id === workspaceId);
  const isOwner = !!activeWorkspace && activeWorkspace.ownerId === userId;
  const canDelete = isOwner && !activeWorkspace?.isPersonal;
  const canManage = can('team:manage');

  const handleCreateWorkspace = async () => {
    if (!createWorkspaceName.trim() || !createWorkspaceCategoryId) return;
    setIsCreating(true);
    try {
      const response = await api.post('/workspaces', {
        name: createWorkspaceName.trim(),
        categoryId: createWorkspaceCategoryId,
      });
      const newWs = response?.data?.data || response?.data || response;
      toast.success(t('create_success'));

      setIsCreateOpen(false);
      setCreateWorkspaceName('');
      setCreateWorkspaceCategoryId('');

      if (newWs && newWs.id) {
        await changeWorkspace(newWs.id);
      } else {
        mutate();
      }
    } catch (error: any) {
      const code = error?.response?.data?.code;
      toast.error(t_ec(code) || t('create_error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      toast.success(t('delete_success'));
      const personalWorkspace = workspaces.find((w: any) => w.isPersonal);
      if (personalWorkspace) {
        await changeWorkspace(personalWorkspace.id);
      }
    } catch (error: any) {
      const code = error?.response?.data?.code;
      toast.error(t_ec(code) || t('error'));
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (workspacesIsLoading || isLoadingPermissions) {
    return (
      <LayoutSettings className="_workspace-settings-page">
        <div className="flex min-h-[280px] flex-1 items-center justify-center">
          <LoaderSpin />
        </div>
      </LayoutSettings>
    );
  }

  return (
    <LayoutSettings className="_workspace-settings-page">
      <div className="space-y-6">
        <IncomingTransferBanner />

        {!isInvitationsLoading && pendingCount > 0 && (
          <Link
            href="/invitations"
            className="flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-right transition-all hover:bg-blue-100"
          >
            <EnvelopeSimpleIcon size={20} weight="duotone" className="shrink-0 text-blue-600" />
            <span className="flex-1 text-sm font-medium text-blue-800">
              {t('invitation_banner', { count: pendingCount })}
            </span>
            <span className="text-xs font-semibold text-blue-600">{t('view')}</span>
          </Link>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-primary text-lg font-semibold">{t('page_title')}</h2>
            <p className="text-muted-foreground text-xs">{t('page_description')}</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 shrink-0" />
                <span>{t('new_workspace')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('create_dialog_title')}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 pt-3">
                <div className="space-y-2 text-right">
                  <label className="block pr-1 text-sm font-medium text-gray-700">
                    {t('name')}
                  </label>
                  <Input
                    value={createWorkspaceName}
                    onChange={(e) => setCreateWorkspaceName(e.target.value)}
                    placeholder={t('name_placeholder')}
                    disabled={isCreating}
                    autoFocus
                  />
                </div>
                <div className="space-y-2 text-right">
                  <label className="block pr-1 text-sm font-medium text-gray-700">
                    {t('category')}
                  </label>
                  <Select
                    value={createWorkspaceCategoryId}
                    onValueChange={setCreateWorkspaceCategoryId}
                    disabled={isCreating}
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
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setCreateWorkspaceName('');
                      setCreateWorkspaceCategoryId('');
                    }}
                    disabled={isCreating}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    onClick={handleCreateWorkspace}
                    disabled={
                      isCreating || !createWorkspaceName.trim() || !createWorkspaceCategoryId
                    }
                    className="min-w-[80px]"
                  >
                    {isCreating ? t('creating') : t('create')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {canManage && (
          <div className="rounded-xl border border-gray-100 p-4">
            <WorkspaceForm />
          </div>
        )}

        <div className="rounded-xl border border-gray-100 p-4">
          <WorkspaceCategoryForm />
        </div>

        {(isOwner || canDelete) && (
          <div className="border-destructive/30 space-y-4 rounded-xl border p-4">
            <h3 className="text-destructive text-sm font-semibold">{t('danger_zone')}</h3>

            <div className="flex flex-wrap gap-3">
              {isOwner && (
                <Button
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/5 w-full md:w-auto"
                  onClick={() => setIsTransferOpen(true)}
                >
                  {t('transfer_ownership_button')}
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="destructive"
                  className="w-full md:w-auto"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  {t('delete_button')}
                </Button>
              )}
            </div>

            {isOwner && (
              <PendingTransferNotice workspaceId={activeWorkspace!.id} onChange={() => mutate()} />
            )}
          </div>
        )}
      </div>

      <WorkspaceDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteWorkspace}
        isDeleting={isDeleting}
      />

      {activeWorkspace && (
        <TransferOwnershipDialog
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          workspaceId={activeWorkspace.id}
          onCompleted={() => {
            mutate();
            globalMutate(`/workspaces/${activeWorkspace.id}/ownership-transfer/active`);
          }}
        />
      )}
    </LayoutSettings>
  );
}
