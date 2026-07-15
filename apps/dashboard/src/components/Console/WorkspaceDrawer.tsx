'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api, { useLogout } from '@/hooks/swr/api-client';
import useUser from '@/hooks/useUser';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePermissions } from '@/hooks/usePermissions';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage, Spinner } from '@/components/ui';
import { Separator } from '@/components/ui/separator';
import { LogOutIcon, CheckIcon, UserCircleIcon, PlusIcon, Settings } from 'lucide-react';

interface WorkspaceDrawerProps {
  children: React.ReactNode;
}

export const WorkspaceDrawer = ({ children }: WorkspaceDrawerProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const logout = useLogout();
  const { user: userData, isLoading: isUserLoading } = useUser();
  const { workspaces, isLoading: isWorkspacesLoading, changeWorkspace, mutate } = useWorkspaces();
  const { workspaceId } = usePermissions();

  const tConsole = useTranslations('Console');
  const tSidebar = useTranslations('Console.Sidebar');

  const logoutHandler = async () => {
    setIsLogoutLoading(true);
    try {
      await logout();
      const subStore = useSubscriptionStore.getState();
      subStore.setSubscriptions([]);
      subStore.setPlans([]);
      subStore.setPlansData(undefined);
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const handleWorkspaceSettings = async (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    setOpen(false);
    if (wsId !== workspaceId) {
      try {
        await changeWorkspace(wsId);
      } catch (error) {
        console.error('Error changing workspace for settings:', error);
      }
    }
    router.push('/workspace');
  };

  const handleAddWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWorkspace(true);
    try {
      const response = await api.post('/workspaces', { name: newWorkspaceName.trim() });
      const newWs = response?.data?.data || response?.data || response;
      toast.success(tConsole('Workspace.success') || 'فضای کاری با موفقیت ایجاد شد');

      setIsAddingWorkspace(false);
      setNewWorkspaceName('');

      // Auto-switch to the newly created workspace if available
      if (newWs && newWs.id) {
        await changeWorkspace(newWs.id);
      } else {
        mutate(); // fallback: just refresh lists
      }
    } catch (error) {
      console.error('Create workspace error:', error);
      toast.error(tConsole('Workspace.error') || 'خطا در ایجاد فضای کاری جدید');
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent dir="rtl" className="font-Yekan bg-white px-4 pb-6">
        <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-gray-200" />

        {/* Profile Details Header */}
        {userData && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-linear-to-r from-gray-50 to-white p-3 text-right">
            <Avatar className="border-primary/20 h-12 w-12 rounded-full border-2">
              <AvatarImage src={undefined} alt={userData.firstname} />
              <AvatarFallback className="bg-primary/5 text-primary flex items-center justify-center">
                <UserCircleIcon size={32} className="stroke-[1.5]" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-right">
              <span className="text-base leading-tight font-bold text-gray-800">
                {userData.firstname} {userData.lastname}
              </span>
              <span className="text-muted-foreground mt-1 text-xs tracking-wider">
                {userData.mobile || userData.email}
              </span>
            </div>
          </div>
        )}

        {/* Workspaces Section */}
        <div className="flex flex-col gap-2">
          <div className="mb-1 flex items-center justify-between pr-1">
            <h3 className="text-right text-xs font-semibold text-gray-500">
              {tConsole('yourWorkspaces') || 'فضاهای کاری شما'}
            </h3>
            {!isAddingWorkspace && (
              <button
                onClick={() => setIsAddingWorkspace(true)}
                className="text-primary hover:text-primary/80 flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-bold"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                <span>افزودن</span>
              </button>
            )}
          </div>

          {isAddingWorkspace ? (
            <div className="border-primary/30 bg-primary/[0.01] animate-in fade-in flex flex-col gap-2 rounded-xl border border-dashed p-3.5 text-right duration-200">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="نام فضای کاری جدید..."
                className="focus:border-primary w-full rounded-lg border border-gray-200 bg-white p-2.5 text-right text-sm text-gray-800 focus:outline-hidden"
                disabled={isCreatingWorkspace}
                autoFocus
              />
              <div className="mt-1 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAddingWorkspace(false);
                    setNewWorkspaceName('');
                  }}
                  className="text-muted-foreground cursor-pointer rounded-lg border-0 bg-transparent px-3 py-1.5 text-xs hover:bg-gray-50"
                  disabled={isCreatingWorkspace}
                >
                  انصراف
                </button>
                <button
                  onClick={handleAddWorkspace}
                  className="bg-primary flex cursor-pointer items-center gap-1 rounded-lg border-0 px-4 py-1.5 text-xs font-semibold text-white"
                  disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                >
                  {isCreatingWorkspace ? (
                    <Spinner className="h-3 w-3 animate-spin text-white" />
                  ) : (
                    'ثبت'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
              {isWorkspacesLoading ? (
                <div className="text-secondary flex items-center justify-center py-6 text-sm">
                  <Spinner className="ml-2 h-4 w-4" />
                  <span>{tConsole('loading') || 'در حال بارگذاری...'}</span>
                </div>
              ) : workspaces.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  {tConsole('noData') || 'فضای کاری یافت نشد'}
                </div>
              ) : (
                workspaces.map((ws) => {
                  const isActive = ws.id === workspaceId;
                  return (
                    <div
                      key={ws.id}
                      className={cn(
                        'flex items-center justify-between rounded-xl border p-3 text-right transition-all',
                        isActive
                          ? 'border-primary bg-primary/[0.04] text-primary font-bold shadow-xs'
                          : 'text-secondary border-gray-100 hover:border-gray-200 active:bg-gray-50',
                      )}
                    >
                      <button
                        onClick={() => {
                          if (!isActive) changeWorkspace(ws.id);
                        }}
                        className="flex flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-right outline-none"
                      >
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold uppercase',
                            isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {ws.name.charAt(0)}
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-sm font-medium">{ws.name}</span>
                          {isActive && (
                            <span className="text-primary/80 mt-0.5 text-[10px] font-normal">
                              {tConsole('Dashboard.active') || 'فعال'}
                            </span>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        {isActive && (
                          <div className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white">
                            <CheckIcon size={12} className="stroke-[3]" />
                          </div>
                        )}
                        <button
                          onClick={(e) => handleWorkspaceSettings(e, ws.id)}
                          className={cn(
                            'flex cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600',
                            isActive && 'text-primary/70 hover:text-primary hover:bg-primary/10',
                          )}
                        >
                          <Settings size={18} className="stroke-[1.8]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <Separator className="my-4 bg-gray-100" />

        {/* Logout */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={logoutHandler}
            disabled={isLogoutLoading}
            className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-right text-sm text-red-600 transition-all hover:bg-red-50 active:bg-red-100"
          >
            {isLogoutLoading ? (
              <Spinner className="size-5" />
            ) : (
              <LogOutIcon className="size-5 stroke-[1.8] text-red-500" />
            )}
            <span className="font-semibold">{tSidebar('logout')}</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
