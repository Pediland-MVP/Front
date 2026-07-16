// src/components/app-sidebar.tsx
'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

// UI Imports
import logo from '@/assets/images/befroosh-logo.svg';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import {
  // ChartPieSliceIcon,
  HouseIcon,
  PlantIcon,
  UsersIcon,
  CreditCardIcon,
  CurrencyCircleDollarIcon,
  BarcodeIcon,
  ChatDotsIcon,
  UserGearIcon,
  BuildingsIcon,
  TagIcon,
  SlidersHorizontalIcon,
  BookmarksSimpleIcon,
  ClipboardTextIcon,
  InstagramLogoIcon,
  MegaphoneIcon,
  FileTextIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('Sidebar');
  const { user } = useAuth();

  const items = React.useMemo(() => {
    // Webhooks / AI / Settings live under the "advanced" submenu. Keep the
    // per-role gating on each child (KAM sees only the AI agent).
    const advancedChildren = [
      ...(user?.role !== 'kam' ? [{ title: t('plans'), url: '/plans' }] : []),
      ...(user?.role !== 'kam' ? [{ title: t('webhooks'), url: '/webhooks' }] : []),
      { title: t('aiAgent'), url: '/aiagent' },
      ...(user?.role !== 'kam' ? [{ title: t('settings'), url: '/settings' }] : []),
      ...(user?.role !== 'kam' ? [{ title: t('helpGuides'), url: '/guides' }] : []),
    ];

    return [
      {
        title: t('home'),
        url: '/',
        icon: HouseIcon,
      },
      {
        title: t('workspaces'),
        url: '/workspaces',
        icon: BuildingsIcon,
      },
      {
        title: t('instagrams'),
        url: '/instagrams',
        icon: InstagramLogoIcon,
      },
      ...(user?.role !== 'kam'
        ? [{ title: t('automationErrors'), url: '/automation-errors', icon: WarningCircleIcon }]
        : []),
      {
        title: t('workspaceCategories'),
        url: '/workspace-categories',
        icon: TagIcon,
      },
      {
        title: t('banners'),
        url: '/banners',
        icon: MegaphoneIcon,
      },
      {
        title: t('templates'),
        url: '/templates',
        icon: FileTextIcon,
      },
      {
        title: t('myCustomers'),
        url: '/users',
        icon: UsersIcon,
      },
      {
        title: t('myLeads'),
        url: '/leads',
        icon: PlantIcon,
      },
      {
        title: t('tasks'),
        url: '/tasks',
        icon: ClipboardTextIcon,
      },
      {
        title: t('subscriptions'),
        url: '/subscriptions',
        icon: CreditCardIcon,
      },
      ...(user?.role !== 'kam'
        ? [{ title: t('finance'), url: '/finance', icon: CurrencyCircleDollarIcon }]
        : []),
      ...(user?.role !== 'kam'
        ? [{ title: t('labels'), url: '/labels', icon: BookmarksSimpleIcon }]
        : []),
      ...(user?.role === 'admin'
        ? [{ title: t('admins'), url: '/admins', icon: UserGearIcon }]
        : []),
      {
        title: t('codes'),
        url: '/referral-codes',
        icon: BarcodeIcon,
        children: [
          { title: t('referralCodes'), url: '/referral-codes' },
          { title: t('discountCodes'), url: '/discount-codes' },
        ],
      },
      {
        title: t('telegramAutomation'),
        url: '/telegram-automation/chats',
        icon: ChatDotsIcon,
        children: [
          { title: t('docs'), url: '/telegram-automation/docs' },
          { title: t('qa'), url: '/telegram-automation/qa' },
          { title: t('guides'), url: '/telegram-automation/guides' },
          { title: t('chats'), url: '/telegram-automation/chats' },
        ],
      },
      ...(advancedChildren.length
        ? [
            {
              title: t('advanced'),
              url: advancedChildren[0].url,
              icon: SlidersHorizontalIcon,
              children: advancedChildren,
            },
          ]
        : []),
    ];
  }, [t, user?.role]);

  return (
    <Sidebar {...props} side="right" variant="inset" collapsible="offcanvas">
      <SidebarHeader className="flex-row gap-2">
        <Image src={logo} alt="logo" className="aspect-square" width={32} height={32} />
        <div className="flex items-center gap-1 truncate leading-tight">
          <h1 className="text-gradient text-[15px] font-bold">{t('befroosh')}</h1>
          <h2 className="text-muted-foreground text-[13px] font-semibold">{t('adminPortal')}</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
