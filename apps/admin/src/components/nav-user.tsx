// src/components/nav-user.tsx
'use client';

import { useLogout } from '@/hooks/swr/api-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';

// UI Imports
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { UserCircleIcon } from '@phosphor-icons/react/dist/ssr/UserCircle';
import { ChevronsUpDown } from 'lucide-react';

export function NavUser() {
  const t = useTranslations('NavUser');
  const { isMobile } = useSidebar();
  const { data, isLoading } = useSWR('/auth/me');
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success(t('logoutSuccess'));
    router.push('/auth/signin');
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer">
              <UserCircleIcon size={24} weight="duotone" />
              <div className="grid flex-1 text-right text-sm leading-tight">
                {isLoading ? (
                  t('loading')
                ) : (
                  <span className="truncate font-medium">{`${data?.firstname} ${data?.lastname}`}</span>
                )}
              </div>

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-44 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            {/* <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon size={18} />
                حساب کاربری
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator /> */}
            <DropdownMenuItem onClick={handleLogout}>
              <SignOutIcon size={18} />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
