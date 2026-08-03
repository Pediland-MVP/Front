'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link, { useLinkStatus } from 'next/link';
import useSWRImmutable from 'swr/immutable';
import { usePermissions } from '@/hooks/usePermissions';
import useUser from '@/hooks/useUser';
// TODO: Should Refactor
import { OverallStats } from '@/types/stats';

import { CardContent } from '@/components/ui';
import { CardSimple } from '@/components/ui-custom/CardSimple';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CircleNotchIcon } from '@phosphor-icons/react/dist/csr/CircleNotch';
import { PlusCircleIcon } from '@phosphor-icons/react/dist/csr/PlusCircle';
import { LightningIcon } from '@phosphor-icons/react/dist/csr/Lightning';
import { AddressBookIcon } from '@phosphor-icons/react/dist/csr/AddressBook';
import { CubeIcon } from '@phosphor-icons/react/dist/csr/Cube';
import { ShoppingBagIcon } from '@phosphor-icons/react/dist/csr/ShoppingBag';
import { CoinsIcon } from '@phosphor-icons/react/dist/csr/Coins';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react/dist/lib/types';
import { ItemsStatisticCard } from './ItemsStatisticCard';
import { DashboardStatsSkeleton } from './DashboardStats.skeleton';

const AddAutomationIcon = () => {
  const { pending } = useLinkStatus();
  if (pending) {
    return (
      <CircleNotchIcon
        weight="duotone"
        className="text-secondary mx-auto size-6 animate-spin md:size-8"
      />
    );
  }
  return <PlusCircleIcon weight="duotone" className="text-secondary mx-auto size-6 md:size-8" />;
};

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

interface HomeItems {
  title: string;
  total: number | React.ReactNode;
  icon: PhosphorIcon;
  link: string;
}

export const DashboardStats = () => {
  const t = useTranslations('Console.Dashboard');
  const { can, isLoading: isPermissionsLoading } = usePermissions();
  const { user } = useUser();

  const instagrams = user?.instagrams ?? [];
  const hasMultipleAccounts = instagrams.length > 1;

  const [selectedIg, setSelectedIg] = useState<string>('all');
  const isAccountView = selectedIg !== 'all';

  const canViewAnalytics = can('analytics:view');
  const canCreateAutomation = can('automation:create');

  const statsKey = canViewAnalytics
    ? `${API_URL}/stats/overall${isAccountView ? `?instagramId=${selectedIg}` : ''}`
    : null;

  const { data: stats, isLoading: isStatsLoading } = useSWRImmutable<OverallStats>(statsKey);

  const rlsPriceFormat = (price: number) => {
    if (!price) return '0';

    const million = price / 1000000;
    return (
      <>
        {million.toLocaleString('fa-IR')}{' '}
        <span className="flex text-sm font-medium">{t('million')}</span>
      </>
    );
  };

  const homeItems: HomeItems[] = [
    {
      title: t('automation'),
      total: stats?.contentCycles?.count,
      icon: LightningIcon,
      link: '/automations',
    },
    {
      title: t('leads'),
      total: stats?.leads?.count,
      icon: AddressBookIcon,
      link: '/contacts',
    },
    {
      title: isAccountView ? `${t('products')} *` : t('products'),
      total: stats?.products?.count,
      icon: CubeIcon,
      link: '/products',
    },
    {
      title: t('orders'),
      total: stats?.sales?.count,
      icon: ShoppingBagIcon,
      link: '/orders',
    },
    {
      title: t('sales'),
      total: rlsPriceFormat(stats?.sales?.total),
      icon: CoinsIcon,
      link: '/orders',
    },
  ];

  if (isPermissionsLoading) {
    return <DashboardStatsSkeleton />;
  }

  if (!canViewAnalytics) {
    return null;
  }

  if (isStatsLoading) {
    return <DashboardStatsSkeleton />;
  }

  return (
    <div className="space-y-3">
      {hasMultipleAccounts && (
        <div className="flex justify-end">
          <Select value={selectedIg} onValueChange={setSelectedIg}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allAccounts')}</SelectItem>
              {instagrams.map((ig) => (
                <SelectItem key={ig.id} value={ig.id}>
                  @{ig.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
        {canCreateAutomation && (
          <Link href="/automations/add">
            <CardSimple className="group h-full border-blue-200 bg-blue-50/50 duration-300">
              <CardContent className="flex flex-1 flex-col items-center justify-center gap-1 p-3 pb-2 md:py-4">
                <AddAutomationIcon />
                <div className="text-secondary/90 p-1 text-center text-sm leading-relaxed font-semibold">
                  {t('add')}
                  <br />
                  {t('automation')}
                </div>
              </CardContent>
            </CardSimple>
          </Link>
        )}

        {homeItems.map((item, i) => (
          <Link key={i} href={`${item.link}`}>
            <ItemsStatisticCard data={item} />
          </Link>
        ))}
      </div>

      {isAccountView && (
        <p className="text-muted-foreground text-[11px]">* {t('productsSharedHint')}</p>
      )}
    </div>
  );
};
