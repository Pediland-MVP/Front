'use client';

import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { LayoutCard } from '@/components/Layout/LayoutCard';
import { TeamManager } from '@/components/Settings/TeamManager';
import { SearchInput } from '@/components/ui-custom/SearchInput';
import { SearchToggleButton } from '@/components/ui-custom/SearchToggleButton';
import { usePermissions } from '@/hooks/usePermissions';

export default function Page() {
  const t = useTranslations('Settings.Team');
  const { can } = usePermissions();
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
    setButtons(HeaderButton);
    setTools(HeaderTools);
  }, [HeaderButton, HeaderTools, setButtons, setTools]);

  useEffect(() => {
    return () => {
      clearButtons();
      clearTools();
    };
  }, [clearButtons, clearTools]);

  if (!can('team:view')) return null;

  return (
    <LayoutCard className="_team-members">
      <div className="space-y-1 px-1 pb-4">
        <h2 className="text-primary text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground text-xs">{t('description')}</p>
      </div>
      <TeamManager search={effectiveSearch} />
    </LayoutCard>
  );
}
