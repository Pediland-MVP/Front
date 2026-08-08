'use client';

import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { LayoutSettings } from '@/components/Layout/LayoutSettings';
import { TeamManager } from '@/components/Settings/TeamManager';
import { SearchInput } from '@/components/ui-custom/SearchInput';
import { SearchToggleButton } from '@/components/ui-custom/SearchToggleButton';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { usePermissions } from '@/hooks/usePermissions';
import { LockKeyIcon } from '@phosphor-icons/react/dist/csr/LockKey';

export default function Page() {
  const t = useTranslations('Settings.Team');
  const { can, isLoading: isLoadingPermissions } = usePermissions();
  const canView = can('team:view');
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [effectiveSearch, setEffectiveSearch] = useState<string>('');

  const setTools = useHeaderFeatures((s) => s.setTools);
  const clearTools = useHeaderFeatures((s) => s.clearTools);
  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);
  const error = useHeaderFeatures((s) => s.error);

  const HeaderButton = useMemo(
    () => (
      <SearchToggleButton
        isSearchVisible={isSearchVisible}
        setIsSearchVisible={setIsSearchVisible}
      />
    ),
    [isSearchVisible, setIsSearchVisible],
  );

  const HeaderTools = useMemo(
    () => (
      <SearchInput
        value={search}
        onChange={setSearch}
        onEffectiveSearchChange={setEffectiveSearch}
        visible={isSearchVisible}
        disabled={error}
      />
    ),
    [search, isSearchVisible, setSearch, error, setEffectiveSearch],
  );

  useEffect(() => {
    if (!canView) return;
    setButtons(HeaderButton);
    setTools(HeaderTools);
  }, [canView, HeaderButton, HeaderTools, setButtons, setTools]);

  useEffect(() => {
    return () => {
      clearButtons();
      clearTools();
    };
  }, [clearButtons, clearTools]);

  return (
    <LayoutSettings className="_team-members">
      <div className="space-y-1 px-1 pb-4">
        <h2 className="text-primary text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground text-xs">{t('description')}</p>
      </div>
      {isLoadingPermissions ? (
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
        <TeamManager search={effectiveSearch} />
      )}
    </LayoutSettings>
  );
}
