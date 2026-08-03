'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { LockKeyIcon } from '@phosphor-icons/react/dist/ssr/LockKey';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';

import { InstagramAccounts } from '@/components/Settings/InstagramAccounts';
import { Button } from '@/components/ui';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { usePermissions } from '@/hooks/usePermissions';

const MAX_INSTAGRAM_ACCOUNTS = 5;

export default function Page() {
  const t = useTranslations('Settings.Accounts');
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [accountCount, setAccountCount] = useState<number>(0);

  const canView = can('instagram:view');
  const canManage = can('instagram:manage');
  const atLimit = accountCount >= MAX_INSTAGRAM_ACCOUNTS;

  return (
    <div className="_instagram-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <div className="flex h-full flex-col gap-4 px-4 py-5 md:pt-0">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-instagram flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg shadow-pink-500/25">
              <InstagramLogoIcon size={24} weight="bold" />
            </div>
            <div className="min-w-0">
              <h2 className="text-primary text-[17px] leading-tight font-bold">{t('title')}</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">{t('subtitle')}</p>
            </div>
          </div>

          {canView && (
            <div className="flex items-center gap-2.5">
              <span className="text-primary inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold">
                {t('count_badge', { count: accountCount, max: MAX_INSTAGRAM_ACCOUNTS })}
              </span>
              <Button size="sm" disabled={atLimit || !canManage} asChild={!atLimit && canManage}>
                {atLimit || !canManage ? (
                  <span className="flex items-center gap-1.5">
                    <PlusIcon className="size-4" />
                    {t('addAccount')}
                  </span>
                ) : (
                  <Link href="/connect">
                    <PlusIcon className="size-4" />
                    {t('addAccount')}
                  </Link>
                )}
              </Button>
            </div>
          )}
        </div>

        {permissionsLoading ? (
          <div className="flex min-h-[280px] flex-1 items-center justify-center">
            <LoaderSpin />
          </div>
        ) : !canView ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <div className="flex size-13 items-center justify-center rounded-2xl bg-gray-200 text-gray-500">
              <LockKeyIcon size={26} weight="duotone" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">{t('permission_denied_title')}</h3>
            <p className="text-muted-foreground max-w-xs text-[13px]">
              {t('permission_denied_description')}
            </p>
          </div>
        ) : (
          <>
            {atLimit && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <WarningCircleIcon size={16} weight="fill" className="shrink-0 text-amber-500" />
                {t('limitReached')}
              </div>
            )}

            <Suspense>
              <div className="flex w-full flex-col items-start justify-center gap-3">
                <InstagramAccounts onCountChange={setAccountCount} />
              </div>
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
