'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import useSWRImmutable from 'swr/immutable';
import { usePermissions } from '@/hooks/usePermissions';
import useUser from '@/hooks/useUser';
// TODO: Should Refactor
import { OverallStats } from '@/types/stats';

import { CardContent } from '@/components/ui';
import { CardSimple } from '@/components/ui-custom/CardSimple';
import { LoaderPulse } from '@/components/ui-custom/LoaderPulse';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircleIcon } from '@phosphor-icons/react';
import { ItemsStatisticCard } from './ItemsStatisticCard';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

interface HomeItems {
  title: string;
  total: number | React.ReactNode;
  icon: string;
  link: string;
}

export const DashboardStats = () => {
  const t = useTranslations('Console.Dashboard');
  const locale = useLocale();
  const { can } = usePermissions();
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
      total: isStatsLoading ? <LoaderPulse /> : stats?.contentCycles?.count,
      icon: 'Lightning',
      link: '/automations',
    },
    {
      title: t('leads'),
      total: isStatsLoading ? <LoaderPulse /> : stats?.leads?.count,
      icon: 'AddressBook',
      link: '/contacts',
    },
    {
      title: isAccountView ? `${t('products')} *` : t('products'),
      total: isStatsLoading ? <LoaderPulse /> : stats?.products?.count,
      icon: 'Cube',
      link: '/products',
    },
    {
      title: t('orders'),
      total: isStatsLoading ? <LoaderPulse /> : stats?.sales?.count,
      icon: 'ShoppingBag',
      link: '/orders',
    },
    {
      title: t('sales'),
      total: isStatsLoading ? <LoaderPulse /> : rlsPriceFormat(stats?.sales?.total),
      icon: 'Coins',
      link: '/orders',
    },
  ];

  if (!canViewAnalytics) {
    return null;
  }

  return (
    <div className="space-y-3">
      {hasMultipleAccounts && (
        <div className="flex justify-end">
          <Select value={selectedIg} onValueChange={setSelectedIg}>
            <SelectTrigger className="w-52" aria-label={t('allAccounts')}>
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
                <PlusCircleIcon
                  weight="duotone"
                  className="text-secondary mx-auto size-6 md:size-8"
                />
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
