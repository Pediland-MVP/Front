'use client';

import { UserNamespace } from '@/types/user';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui';
import { UserCircleIcon } from '@phosphor-icons/react/dist/csr/UserCircle';
import { EllipsisVerticalIcon } from 'lucide-react';
import { UserDropdownMenu } from '../Console/UserDropdownMenu';
import { WorkspaceSwitcherDialog } from '../Console/WorkspaceSwitcherDialog';
import { NavUserSkeleton } from './NavUser.skeleton';

const NavUser = ({
  user,
  isLoading,
}: {
  user: UserNamespace.GET.User['data'] | undefined;
  isLoading: boolean;
}) => {
  if (isLoading || !user) {
    return <NavUserSkeleton />;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex w-full items-center">
          <WorkspaceSwitcherDialog />
          <UserDropdownMenu>
            <SidebarMenuButton className="focus-visible:ring-none hover:text-primary text-secondary data-[state=open]:text-primary active:text-primary flex-1 group-data-[collapsible=icon]:px-0 hover:bg-transparent active:bg-transparent data-[state=open]:bg-transparent">
              <Avatar className="h-7 w-7 rounded-lg border-0 duration-300 focus-within:ring-0">
                <AvatarImage src={undefined} alt={user.firstname} />
                <AvatarFallback className="bg-transparent">
                  <UserCircleIcon size={28} weight="duotone" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-right text-sm group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {user.firstname} {user.lastname}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </UserDropdownMenu>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default NavUser;
