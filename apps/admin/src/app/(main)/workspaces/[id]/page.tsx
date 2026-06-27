'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import dayjs from '@/lib/dayjs-jalali';
import { fetcher } from '@/hooks/swr/api-client';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubscriptionStatusBadge } from '@/components/table/subscription-status-badge';
import { formatNumber } from '@/lib/formatNumber';
import { WorkspaceDetail } from '@/types/workspace';
import { ArrowSquareOutIcon, InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr';

export default function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('Workspaces');

  const { data, isLoading, error } = useSWR(`/workspaces/${id}`, fetcher);
  const workspace: WorkspaceDetail | undefined = data?.data;

  if (isLoading) return <Loading />;
  if (error) return <FetchError />;
  if (!workspace)
    return (
      <p className="shadow-3xs m-4 rounded-xl border border-slate-100 bg-white p-4 text-center text-sm text-slate-400">
        {t('notFound')}
      </p>
    );

  const { meta, members, subscription, resourceCounts, instagrams } = workspace;

  const counts: { key: keyof typeof resourceCounts; label: string }[] = [
    { key: 'instagrams', label: t('instagrams') },
    { key: 'leads', label: t('leads') },
    { key: 'products', label: t('products') },
    { key: 'orders', label: t('orders') },
  ];

  return (
    <div
      className="flex flex-col gap-6 bg-slate-50/20 p-4 lg:h-[calc(100vh-40px)] lg:flex-row lg:overflow-hidden"
      dir="rtl"
    >
      {/* Right Column: Workspace Sidebar */}
      <div className="scrollbar-thin scrollbar-thumb-slate-200 flex w-full shrink-0 flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-5 pr-1 shadow-xs lg:w-96 lg:overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col items-center space-y-3 border-b border-slate-100 pb-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-tr from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-md">
            {meta.name?.[0]?.toUpperCase() || 'W'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{meta.name}</h2>
            {meta.description && (
              <p className="mt-0.5 text-xs text-slate-400">{meta.description}</p>
            )}
          </div>
          <Badge variant={meta.isPersonal ? 'secondary' : 'default'}>
            {meta.isPersonal ? t('personal') : t('team')}
          </Badge>
        </div>

        {/* Owner & create date */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
            <span className="font-semibold text-slate-400">{t('owner')}</span>
            <span className="font-medium text-slate-700">{meta.owner.name || '—'}</span>
          </div>
          {meta.owner.mobile && (
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
              <span className="font-semibold text-slate-400">{t('mobile')}</span>
              <span className="font-medium text-slate-700" dir="ltr">
                {meta.owner.mobile}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
            <span className="font-semibold text-slate-400">{t('createDate')}</span>
            <span className="font-medium text-slate-700">
              {dayjs(meta.createDate).calendar('jalali').format('YYYY/MM/DD')}
            </span>
          </div>
        </div>

        {/* Resource counts */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400">{t('resources')}</h4>
          <div className="grid grid-cols-2 gap-2">
            {counts.map((c) => (
              <div
                key={c.key}
                className="shadow-3xs space-y-0.5 rounded-xl border border-slate-100 bg-white p-2.5 text-center"
              >
                <span className="block text-lg font-bold text-slate-800">
                  {formatNumber(resourceCounts[c.key])}
                </span>
                <span className="block text-[10px] text-slate-400">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400">{t('subscription')}</h4>
          {subscription ? (
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('plan')}</span>
                <span className="font-medium text-slate-700">{subscription.plan?.name ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('planDuration')}</span>
                <span className="font-medium text-slate-700">
                  {subscription.planDuration?.name ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('subscriptionStatus')}</span>
                <SubscriptionStatusBadge status={subscription.status} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('payDate')}</span>
                <span className="font-medium text-slate-700">
                  {subscription.payDate
                    ? dayjs(subscription.payDate).calendar('jalali').format('YYYY/MM/DD HH:mm')
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('expire')}</span>
                <span className="font-medium text-slate-700">
                  {dayjs(subscription.expire).calendar('jalali').format('YYYY/MM/DD')}
                </span>
              </div>
            </div>
          ) : (
            <p className="shadow-3xs rounded-xl border border-slate-100 bg-white p-3 text-center text-[11px] text-slate-400">
              {t('noSubscription')}
            </p>
          )}
        </div>
      </div>

      {/* Left Column: Main content */}
      <div className="flex flex-1 flex-col gap-6 lg:overflow-y-auto">
        {/* Instagram accounts */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <InstagramLogoIcon size={18} className="text-pink-600" />
            {t('instagramAccounts')}
          </h3>
          {instagrams.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center text-[11px] text-slate-400">
              —
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {instagrams.map((ig) => (
                <div
                  key={ig.id}
                  className="shadow-3xs flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3"
                >
                  <div className="flex flex-col" dir="ltr">
                    <span className="font-semibold text-slate-800">@{ig.username}</span>
                    {ig.name && <span className="text-xs text-slate-400">{ig.name}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="space-y-0.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-center">
                      <span className="block text-[10px] text-slate-400">{t('followers')}</span>
                      <span className="block font-bold text-slate-800">
                        {formatNumber(ig.followersCount)}
                      </span>
                    </div>
                    <div className="space-y-0.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-center">
                      <span className="block text-[10px] text-slate-400">{t('follows')}</span>
                      <span className="block font-bold text-slate-800">
                        {formatNumber(ig.followsCount)}
                      </span>
                    </div>
                    <div className="space-y-0.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-center">
                      <span className="block text-[10px] text-slate-400">{t('media')}</span>
                      <span className="block font-bold text-slate-800">
                        {formatNumber(ig.mediaCount)}
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`https://instagram.com/${ig.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ArrowSquareOutIcon className="ml-1" />
                      {t('viewPage')}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h3 className="mb-4 text-sm font-bold text-slate-800">{t('members')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-right text-xs text-slate-400">
                  <th className="p-2 font-semibold">{t('name')}</th>
                  <th className="p-2 font-semibold">{t('mobile')}</th>
                  <th className="p-2 font-semibold">{t('role')}</th>
                  <th className="p-2 font-semibold">{t('joinedAt')}</th>
                  <th className="p-2 font-semibold">{t('permissions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.userId} className="border-b border-slate-100 align-top last:border-0">
                    <td className="p-2 text-slate-700">{m.name || '—'}</td>
                    <td className="p-2 text-slate-700" dir="ltr">
                      {m.mobile || '—'}
                    </td>
                    <td className="p-2">
                      <Badge variant={m.role === 'owner' ? 'default' : 'secondary'}>
                        {m.role === 'owner' ? t('role_owner') : t('role_member')}
                      </Badge>
                    </td>
                    <td className="p-2 text-slate-700">
                      {dayjs(m.joinedAt).calendar('jalali').format('YYYY/MM/DD')}
                    </td>
                    <td className="p-2">
                      {m.role === 'owner' ? (
                        <span className="text-xs text-slate-400">{t('role_owner')}</span>
                      ) : m.permissions.length === 0 ? (
                        <span className="text-xs text-slate-400">{t('noPermissions')}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.permissions.map((p) => (
                            <Badge key={p.slug} variant="secondary" className="text-[11px]">
                              {p.slug}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
