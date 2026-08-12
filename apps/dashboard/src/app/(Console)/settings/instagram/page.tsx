'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { LockKeyIcon } from '@phosphor-icons/react/dist/ssr/LockKey';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';

import { InstagramAccounts } from '@/components/Settings/InstagramAccounts';
import { SetupInstagramDialog } from '@/components/Connect/SetupInstagramDialog';
import { IGW_RESUME_PARAM } from '@/components/Connect/useInstagramWizardResume';
import { Button } from '@/components/ui/button';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { usePermissions } from '@/hooks/usePermissions';
import { useAddInstagramGate } from '@/hooks/useAddInstagramGate';

const MAX_INSTAGRAM_ACCOUNTS = 5;

export default function Page() {
  const t = useTranslations('Settings.Accounts');
  const { can, isLoading: permissionsLoading } = usePermissions();
  // `null` until the accounts list resolves — see the note on `isAddBlocked` below.
  const [accountCount, setAccountCount] = useState<number | null>(null);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get(IGW_RESUME_PARAM) === '1') setIsSetupDialogOpen(true);
  }, [searchParams]);

  const canView = can('instagram:view');
  const canManage = can('instagram:manage');
  const knownAccountCount = accountCount ?? 0;
  const atLimit = knownAccountCount >= MAX_INSTAGRAM_ACCOUNTS;
  const hasInstagram = knownAccountCount > 0;

  // Same rule as /connect, from the same hook, so the two entry points into the
  // "add another account" journey cannot drift: the first account goes straight to
  // /connect, while a second or later one stops at SetupInstagramDialog whenever the
  // workspace has no unused coverage *or* holds a paid plan not yet bound to a page.
  const { requiresSetupDialog, isLoading: isGateLoading } = useAddInstagramGate(hasInstagram);

  // Hold the button back until both the account count and the gate inputs are known.
  // Acting early would answer "first account, no plan to worry about" — the one answer
  // that skips every check — and send the user into OAuth past the subscription step.
  const isAddBlocked = atLimit || !canManage || accountCount === null || isGateLoading;

  return (
    <div className="_instagram-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <SetupInstagramDialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen} />
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
                {t('count_badge', { count: knownAccountCount, max: MAX_INSTAGRAM_ACCOUNTS })}
              </span>
              <Button
                size="sm"
                disabled={isAddBlocked}
                asChild={!isAddBlocked && !requiresSetupDialog}
                onClick={
                  !isAddBlocked && requiresSetupDialog
                    ? () => setIsSetupDialogOpen(true)
                    : undefined
                }
              >
                {isAddBlocked ? (
                  <span className="flex items-center gap-1.5">
                    <PlusIcon className="size-4" />
                    {t('addAccount')}
                  </span>
                ) : requiresSetupDialog ? (
                  <>
                    <PlusIcon className="size-4" />
                    {t('addAccount')}
                  </>
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
