'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { EnvelopeSimpleIcon, ArrowsLeftRight, Trash } from '@phosphor-icons/react';
import { Pencil, Plus } from 'lucide-react';
import { WorkspaceForm } from '@/components/Settings/WorkspaceForm';
import { TeamManager } from '@/components/Settings/TeamManager';
import { WorkspaceDeleteDialog } from '@/components/Settings/WorkspaceDeleteDialog';
import { TransferOwnershipDialog } from '@/components/Settings/TransferOwnershipDialog';
import { IncomingTransferBanner } from '@/components/Settings/IncomingTransferBanner';
import { WorkspaceSwitcherDialog } from '@/components/Console/WorkspaceSwitcherDialog';
import { useInvitations } from '@/hooks/useInvitations';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import api from '@/hooks/swr/api-client';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';

export default function WorkspacePage() {
  const tWorkspace = useTranslations('Settings.Workspace');
  const tTeam = useTranslations('Settings.Team');
  const t_ec = useTranslations('ERROR_CODES');
  const { pendingCount, isLoading: isInvitationsLoading } = useInvitations();
  const { workspaceId, userId, isLoading: isLoadingPermissions, can } = usePermissions();
  const { workspaces, isLoading: workspacesIsLoading, changeWorkspace, mutate } = useWorkspaces();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createWorkspaceName, setCreateWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const activeWorkspace = workspaces.find((w: any) => w.id === workspaceId);

  if (workspacesIsLoading || isLoadingPermissions) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  const workspaceName = activeWorkspace?.name || tWorkspace('title');
  const workspaceInitials = activeWorkspace?.name
    ? activeWorkspace.name.substring(0, 2).toUpperCase()
    : tWorkspace('title').substring(0, 2).toUpperCase();

  const handleCreateWorkspace = async () => {
    if (!createWorkspaceName.trim()) return;
    setIsCreating(true);
    try {
      const response = await api.post('/workspaces', { name: createWorkspaceName.trim() });
      const newWs = response?.data?.data || response?.data || response;
      toast.success(tWorkspace('create_success'));

      setIsCreateOpen(false);
      setCreateWorkspaceName('');

      if (newWs && newWs.id) {
        await changeWorkspace(newWs.id);
      } else {
        mutate();
      }
    } catch (error: any) {
      const code = error?.response?.data?.code;
      toast.error(t_ec(code) || tWorkspace('create_error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      toast.success(tWorkspace('delete_success'));
      const personalWorkspace = workspaces.find((w: any) => w.isPersonal);
      if (personalWorkspace) {
        await changeWorkspace(personalWorkspace.id);
      }
    } catch (error: any) {
      const code = error?.response?.data?.code;
      toast.error(t_ec(code) || tWorkspace('error'));
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="_workspace-page flex-1 overflow-y-auto rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <div className="animate-in fade-in flex h-full flex-col space-y-6 px-4 py-5 duration-300">
        <IncomingTransferBanner />

        {/* Invitation Banner */}
        {!isInvitationsLoading && pendingCount > 0 && (
          <Link
            href="/invitations"
            className="flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-right transition-all hover:bg-blue-100"
          >
            <EnvelopeSimpleIcon size={20} weight="duotone" className="shrink-0 text-blue-600" />
            <span className="flex-1 text-sm font-medium text-blue-800">
              {tWorkspace('invitation_banner', { count: pendingCount })}
            </span>
            <span className="text-xs font-semibold text-blue-600">{tWorkspace('view')}</span>
          </Link>
        )}

        <div className="flex items-center justify-between gap-4">
          <h2 className="text-primary shrink-0 text-lg font-semibold">{tWorkspace('title')}</h2>

          <div className="flex shrink-0 items-center gap-2">
            <WorkspaceSwitcherDialog
              trigger={
                <Button
                  variant="outline"
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all select-none"
                >
                  <ArrowsLeftRight className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{tWorkspace('switch_workspace')}</span>
                </Button>
              }
            />

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all select-none">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{tWorkspace('new_workspace')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{tWorkspace('create_dialog_title')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-3">
                  <div className="space-y-2 text-right">
                    <label className="block pr-1 text-sm font-medium text-gray-700">
                      {tWorkspace('name')}
                    </label>
                    <input
                      type="text"
                      value={createWorkspaceName}
                      onChange={(e) => setCreateWorkspaceName(e.target.value)}
                      placeholder={tWorkspace('name_placeholder')}
                      className="focus:border-primary w-full rounded-lg border border-gray-200 bg-white p-2.5 text-right text-sm text-gray-800 focus:outline-none"
                      disabled={isCreating}
                      autoFocus
                    />
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setCreateWorkspaceName('');
                      }}
                      disabled={isCreating}
                      className="rounded-xl"
                    >
                      {tWorkspace('cancel')}
                    </Button>
                    <Button
                      onClick={handleCreateWorkspace}
                      disabled={isCreating || !createWorkspaceName.trim()}
                      className="min-w-[80px] rounded-xl"
                    >
                      {isCreating ? tWorkspace('creating') : tWorkspace('create')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          {activeWorkspace && (
            <div className="from-primary/5 group relative flex flex-col items-center gap-3 rounded-2xl border bg-gradient-to-b to-white px-4 py-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              {/* Edit Workspace Dialog in Top-Left Corner */}
              {can('team:manage') && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 absolute top-4 left-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{tWorkspace('title')}</DialogTitle>
                    </DialogHeader>
                    <div className="pt-2">
                      <WorkspaceForm onSuccess={() => setIsEditDialogOpen(false)} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {activeWorkspace &&
                !activeWorkspace.isPersonal &&
                activeWorkspace.ownerId === userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 absolute top-4 right-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    aria-label={tWorkspace('delete_button')}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}

              <Avatar className="h-20 w-20 shrink-0 shadow-sm ring-4 ring-white transition-transform duration-300 group-hover:scale-105">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {workspaceInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-base leading-none font-semibold text-gray-900">
                  {workspaceName}
                </p>
              </div>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                {tWorkspace('card_description')}
              </p>

              {activeWorkspace && activeWorkspace.ownerId === userId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setIsTransferOpen(true)}
                >
                  {tWorkspace('transfer_ownership_button')}
                </Button>
              )}
            </div>
          )}

          {/* Team Manager Section */}
          {can('team:view') && (
            <Card className="overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-gray-900">
                  {tTeam('title')}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  {tTeam('description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="border-t border-gray-50 pt-4">
                <TeamManager />
              </CardContent>
            </Card>
          )}
        </div>
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
          onCompleted={() => mutate()}
        />
      )}
    </div>
  );
}
