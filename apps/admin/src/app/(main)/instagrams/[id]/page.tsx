'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { fetcher } from '@/hooks/swr/api-client';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { Badge } from '@/components/ui/badge';
import { LabelChips } from '@/components/table/label-chips';
import { InstagramDetail } from '@/types/instagram';

export default function InstagramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('Instagrams');

  const { data, isLoading, error } = useSWR(`/instagrams/${id}`, fetcher);
  const instagram: InstagramDetail | undefined = data?.data;

  if (isLoading) return <Loading />;
  if (error) return <FetchError />;
  if (!instagram)
    return (
      <p className="shadow-3xs m-4 rounded-xl border border-slate-100 bg-white p-4 text-center text-sm text-slate-400">
        {t('notFound')}
      </p>
    );

  return (
    <div className="flex flex-col gap-5 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="flex flex-col items-center space-y-3 border-b border-slate-100 pb-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-tr from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-md">
            {instagram.username?.[0]?.toUpperCase() || 'I'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">@{instagram.username}</h2>
            {instagram.name && <p className="mt-0.5 text-xs text-slate-400">{instagram.name}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{t('followers')}</span>
            <span className="tabular-nums">{(instagram.followersCount ?? 0).toLocaleString('fa-IR')}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{t('connection')}</span>
            <Badge variant={instagram.isIgTokenValid ? 'default' : 'destructive'}>
              {instagram.isIgTokenValid ? t('connected') : t('disconnected')}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{t('workspace')}</span>
            <Link
              href={`/workspaces/${instagram.workspace.id}`}
              className="text-primary font-medium hover:underline"
            >
              {instagram.workspace.name}
            </Link>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{t('owner')}</span>
            <div className="flex flex-col text-right">
              <span>{instagram.owner.name || '—'}</span>
              {instagram.owner.mobile && (
                <span className="text-xs text-slate-400">{instagram.owner.mobile}</span>
              )}
            </div>
          </div>

          {instagram.labels && instagram.labels.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{t('labels')}</span>
              <LabelChips labels={instagram.labels} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
