'use client';

import { useTranslations } from 'next-intl';
import { DevicesIcon } from '@phosphor-icons/react';

import { LayoutSettings } from '@/components/Layout/LayoutSettings';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { useAccountSessions } from './hooks/useAccountSessions';
import { AccountSessionsTable } from './account-sessions-table';

export default function AccountSessionManagementPage() {
  const t = useTranslations('Settings.AccountSessions');
  const { sessions, error, isLoading, mutate } = useAccountSessions();

  return (
    <LayoutSettings className="_account-sessions-page">
      <div className="mb-5">
        <h2 className="text-primary mb-1 font-semibold">{t('title')}</h2>
        <div className="text-muted-foreground inline-flex flex-wrap items-center gap-1 text-sm">
          <DevicesIcon size={20} weight="duotone" />
          <span>{t('description')}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {isLoading ? (
          <LoaderSpin />
        ) : error ? (
          <div className="text-destructive text-center text-sm">{t('empty')}</div>
        ) : sessions.length === 0 ? (
          <div className="text-muted-foreground text-center text-sm">{t('empty')}</div>
        ) : (
          <AccountSessionsTable sessions={sessions} onTerminated={() => mutate()} />
        )}
      </div>
    </LayoutSettings>
  );
}
