'use client';

import { use, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import dayjs from '@/lib/dayjs-jalali';
import { fetcher } from '@/hooks/swr/api-client';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/formatNumber';
import { WorkspaceDetail } from '@/types/workspace';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { Receipt, ArrowRight, ArrowLeft, Wallet } from 'lucide-react';
import { SubscriptionCard } from '@/components/customer/SubscriptionCard';
import { AddSubscriptionDialog } from '@/components/customer/AddSubscriptionDialog';

export default function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('Workspaces');

  const [subsPage, setSubsPage] = useState(1);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

  const { data, isLoading, error, mutate: mutateWorkspace } = useSWR(`/workspaces/${id}`, fetcher);
  const workspace: WorkspaceDetail | undefined = data?.data;

  const {
    data: subsData,
    isLoading: isSubsLoading,
    mutate: mutateSubs,
  } = useSWR(`/workspaces/${id}/subscriptions?page=${subsPage}&limit=5`, fetcher);
  const subs = subsData?.items || [];
  const subsMeta = subsData?.meta;

  if (isLoading) return <Loading />;
  if (error) return <FetchError />;
  if (!workspace)
    return (
      <p className="shadow-3xs m-4 rounded-xl border border-slate-100 bg-white p-4 text-center text-sm text-slate-400">
        {t('notFound')}
      </p>
    );

  const { meta, members, resourceCounts, instagrams } = workspace;

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
      </div>

      {/* Left Column: Main content */}
      <div className="flex flex-1 flex-col gap-6 lg:overflow-y-auto">
        {/* Subscriptions */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Receipt size={18} className="text-indigo-600" />
              {t('subscriptions')}
            </h3>
            <Button size="sm" onClick={() => setSubscriptionDialogOpen(true)}>
              <Wallet className="ml-1 h-3.5 w-3.5" />
              {t('manualCharge')}
            </Button>
          </div>

          {isSubsLoading ? (
            <div className="flex justify-center py-10">
              <Loading />
            </div>
          ) : subs.length > 0 ? (
            <div className="space-y-4">
              {subs.map((sub: any) => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))}

              {subsMeta && subsMeta.totalPages > 1 && (
                <div className="shadow-3xs mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 cursor-pointer rounded-lg text-xs font-semibold"
                    disabled={subsPage <= 1}
                    onClick={() => setSubsPage((prev) => Math.max(prev - 1, 1))}
                  >
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    <span>{t('previousPage')}</span>
                  </Button>
                  <span className="text-xs font-bold text-slate-500">
                    {t('pageOf', { current: subsPage, total: subsMeta.totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 cursor-pointer rounded-lg text-xs font-semibold"
                    disabled={subsPage >= subsMeta.totalPages}
                    onClick={() => setSubsPage((prev) => Math.min(prev + 1, subsMeta.totalPages))}
                  >
                    <span>{t('nextPage')}</span>
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="shadow-3xs rounded-xl border border-slate-100 bg-slate-50 p-3 text-center text-[11px] text-slate-400">
              {t('noSubscriptionsList')}
            </p>
          )}
        </div>

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

      <AddSubscriptionDialog
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
        userId={meta.owner.id || ''}
        workspaceId={meta.id}
        workspaceInstagrams={instagrams.map((ig) => ({ id: ig.id, username: ig.username }))}
        onSuccess={() => {
          setSubsPage(1);
          mutateSubs();
          mutateWorkspace();
        }}
      />
    </div>
  );
}
