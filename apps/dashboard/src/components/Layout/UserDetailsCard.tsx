'use client';

import { useLogout } from '@/hooks/swr/api-client';
import useUser from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui';
import { Spinner } from '../ui/spinner';

// Same recipe as NavMain's inactive nav items, so these read as more menu rows.
const menuItemClassName =
  'text-secondary border border-dashed border-transparent hover:text-primary active:text-primary hover:border-violet-300/70 hover:bg-violet-100 active:bg-violet-100';

export const UserDetailsCard = () => {
  const router = useRouter();
  const locale = useLocale();
  const logout = useLogout();
  const t = useTranslations('Console.Dashboard');
  const tSidebar = useTranslations('Console.Sidebar');
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const { user: userData } = useUser();

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

  if (!userData) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <Avatar className="h-9 w-9 shrink-0 rounded-full">
          <AvatarImage src={undefined} alt={userData.firstname} />
          <AvatarFallback className="bg-primary text-white">
            <UserIcon size={20} weight="fill" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-secondary truncate text-sm leading-tight font-semibold">
            {userData.firstname} {userData.lastname}
          </p>
          <p className="text-muted-foreground mt-0.5 truncate text-sm leading-tight tracking-wider">
            {userData.mobile || userData.email}
          </p>
        </div>
      </div>

      <SidebarMenu className="flex-row gap-2">
        <SidebarMenuItem className="flex-1">
          <SidebarMenuButton
            className={cn(menuItemClassName, 'justify-center')}
            onClick={() => router.push('/settings/profile')}
          >
            <PencilSimpleIcon size={20} weight="duotone" />
            <span>{t('edit')}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem className="flex-1">
          <SidebarMenuButton
            className={cn(menuItemClassName, 'justify-center')}
            onClick={logoutHandler}
            disabled={isLogoutLoading}
          >
            {isLogoutLoading ? (
              <Spinner className="size-5" />
            ) : (
              <SignOutIcon
                size={20}
                weight="duotone"
                className={cn(locale === 'fa' && 'rotate-180')}
              />
            )}
            <span>{tSidebar('logout')}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
};
