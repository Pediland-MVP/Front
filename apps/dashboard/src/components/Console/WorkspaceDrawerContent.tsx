'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useLogout } from '@/hooks/swr/api-client';
import useUser from '@/hooks/useUser';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePermissions } from '@/hooks/usePermissions';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { cn } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { PageCoverageBadge } from '@/components/Settings/PageCoverageBadge';
import { LogOutIcon, CheckIcon, UserCircleIcon, PencilIcon, XIcon, PlusIcon } from 'lucide-react';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';

interface WorkspaceDrawerContentProps {
  onClose: () => void;
}

export const WorkspaceDrawerContent = ({ onClose }: WorkspaceDrawerContentProps) => {
  const router = useRouter();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const logout = useLogout();
  const { user: userData } = useUser();
  const { workspaces, isLoading: isWorkspacesLoading, changeWorkspace } = useWorkspaces();
  const { workspaceId } = usePermissions();

  const t = useTranslations('Console.WorkspaceDrawer');
  const tSidebar = useTranslations('Console.Sidebar');

  const totalConnectedPages = workspaces.reduce((sum, ws) => sum + (ws.instagrams?.length ?? 0), 0);

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

  const selectWorkspace = (wsId: string) => {
    onClose();
    if (wsId !== workspaceId) {
      changeWorkspace(wsId);
    }
  };

  return (
    <div className="font-Yekan flex flex-col bg-white px-4 pb-6">
      <div className="mb-2 flex justify-end">
        <button
          onClick={onClose}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-gray-50 text-gray-500 hover:bg-gray-100"
          aria-label={t('close')}
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {userData && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-linear-to-r from-gray-50 to-white p-3 text-right">
          <button
            onClick={() => {
              onClose();
              router.push('/settings');
            }}
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-gray-50 p-2 text-gray-500 hover:bg-gray-100"
            aria-label={t('editProfile')}
          >
            <PencilIcon className="size-4" />
          </button>
          <div className="flex flex-1 flex-col text-right">
            <span className="text-base leading-tight font-bold text-gray-800">
              {userData.firstname} {userData.lastname}
            </span>
            <span className="text-muted-foreground mt-1 text-xs tracking-wider">
              {userData.mobile || userData.email}
            </span>
          </div>
          <Avatar className="border-primary/20 h-12 w-12 rounded-full border-2">
            <AvatarImage src={undefined} alt={userData.firstname} />
            <AvatarFallback className="bg-primary/5 text-primary flex items-center justify-center">
              <UserCircleIcon size={32} className="stroke-[1.5]" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="mb-1 pr-1 text-right text-xs font-semibold text-gray-500">
          {t('connectedPages', { count: totalConnectedPages })}
        </h3>

        <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
          {isWorkspacesLoading ? (
            <div className="text-secondary flex items-center justify-center py-6 text-sm">
              <Spinner className="ml-2 h-4 w-4" />
            </div>
          ) : (
            workspaces.map((ws) => {
              const isActive = ws.id === workspaceId;
              return (
                <div
                  key={ws.id}
                  className={cn(
                    'flex flex-col gap-2 rounded-xl border p-2 text-right transition-all',
                    isActive ? 'border-primary bg-primary/[0.04] shadow-xs' : 'border-gray-100',
                  )}
                >
                  <button
                    onClick={() => selectWorkspace(ws.id)}
                    className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent p-1 text-right outline-none"
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold uppercase',
                        isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {ws.name.charAt(0)}
                    </div>
                    <span
                      className={cn(
                        'flex-1 text-sm font-medium',
                        isActive ? 'text-primary' : 'text-gray-800',
                      )}
                    >
                      {ws.name}
                    </span>
                    {isActive && (
                      <div className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white">
                        <CheckIcon size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {ws.instagrams.map((instagram) => (
                    <button
                      key={instagram.id}
                      onClick={() => selectWorkspace(ws.id)}
                      className="flex w-full cursor-pointer items-center gap-2 border-0 bg-white p-2 text-right outline-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'h-1.5 w-1.5 shrink-0 rounded-full',
                              instagram.isIgTokenValid ? 'bg-green-500' : 'bg-red-500',
                            )}
                          />
                          <span className="text-xs text-gray-500">
                            {instagram.isIgTokenValid ? t('connected') : t('disconnected')}
                          </span>
                        </div>
                        {isActive && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <PageCoverageBadge instagramId={instagram.id} />
                          </div>
                        )}
                      </div>
                      <span className="truncate text-xs text-gray-600">{instagram.username}</span>
                      <div className="shrink-0 overflow-hidden rounded-full border border-white bg-gray-100">
                        {instagram.profilePicture?.url && !imgErrors[instagram.id] ? (
                          <Image
                            src={instagram.profilePicture.url}
                            alt={instagram.username}
                            width={32}
                            height={32}
                            className="aspect-square"
                            onError={() =>
                              setImgErrors((prev) => ({ ...prev, [instagram.id]: true }))
                            }
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center text-gray-400">
                            <InstagramLogoIcon size={16} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      <Separator className="my-4 bg-gray-100" />

      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            onClose();
            router.push('/connect');
          }}
          className="bg-primary flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl p-3 text-sm font-semibold text-white"
        >
          <PlusIcon className="size-4" />
          {t('addPage')}
        </button>

        <button
          onClick={logoutHandler}
          disabled={isLogoutLoading}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl p-3 text-sm text-red-600 transition-all hover:bg-red-50 active:bg-red-100"
        >
          {isLogoutLoading ? (
            <Spinner className="size-5" />
          ) : (
            <LogOutIcon className="size-5 stroke-[1.8] text-red-500" />
          )}
          <span className="font-semibold">{tSidebar('logout')}</span>
        </button>
      </div>
    </div>
  );
};
