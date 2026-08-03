'use client';

import { cn } from '@/lib/utils';
import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactElement } from 'react';
import { useTranslations } from 'next-intl';

import {
  CircleNotchIcon,
  HouseIcon,
  Icon,
  IconProps,
  LightningIcon,
  PlusCircleIcon,
  ShoppingBagIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import { WorkspaceDrawer } from '../Console/WorkspaceDrawer';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useInvitations } from '@/hooks/useInvitations';

// Interface kept for reference or external use if needed, but internal logic uses a specific shape
export interface NavItem {
  icon: ReactElement<IconProps>;
  label: ReactElement<HTMLParagraphElement>;
  labelClassName?: string;
  href: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  onClick?: () => void;
  isMain?: boolean;
}

const NavItemIcon = ({
  icon: ItemIcon,
  size,
  className,
}: {
  icon: Icon;
  size: number;
  className?: string;
}) => {
  const { pending } = useLinkStatus();
  if (pending) return <CircleNotchIcon size={size} className={cn('animate-spin', className)} />;
  return <ItemIcon weight="duotone" size={size} className={className} />;
};

export const NavBottom = () => {
  const pathname = usePathname();
  const t = useTranslations('NavBottom');

  const { workspaceId } = usePermissions();
  const { workspaces } = useWorkspaces();
  const { pendingCount } = useInvitations();
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);

  // Defined navigation items array
  const navItems = [
    {
      href: '/',
      icon: HouseIcon,
      labelKey: 'home',
      isActive: (path: string) => path === '/',
    },
    {
      href: '/automations',
      icon: LightningIcon,
      labelKey: 'list',
      isActive: (path: string) => path === '/automations',
    },
    {
      href: '/automations/add',
      icon: PlusCircleIcon,
      labelKey: 'add',
      isActive: (path: string) => path.startsWith('/automations/add'),
    },
    {
      href: '/orders',
      icon: ShoppingBagIcon,
      labelKey: 'orders',
      isActive: (path: string) => path === '/orders',
    },
    {
      isProfile: true,
      icon: UserCircleIcon,
      labelKey: 'profile',
    },
  ];

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 h-14 border-t border-gray-200/50 bg-white shadow-lg shadow-black md:hidden">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          // Render Profile Drawer / Switcher
          if (item.isProfile) {
            return (
              <WorkspaceDrawer key={item.labelKey}>
                <button className="text-secondary flex cursor-pointer flex-col items-center justify-center border-0 bg-transparent p-0">
                  <div className="relative">
                    <item.icon size={28} weight="duotone" className="text-secondary" />
                    {pendingCount > 0 && (
                      <span className="absolute start-0 top-0 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <span className="text-secondary mt-1 max-w-[75px] truncate text-xs">
                    {currentWorkspace?.name || t(item.labelKey)}
                  </span>
                </button>
              </WorkspaceDrawer>
            );
          }

          // Render Standard Links
          const isActive = item.isActive(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center"
            >
              <NavItemIcon
                icon={item.icon}
                size={28}
                className={cn('text-muted-foreground', isActive && 'text-primary')}
              />
              <span
                className={cn('mt-1 text-xs', isActive ? 'text-primary' : 'text-muted-foreground')}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
