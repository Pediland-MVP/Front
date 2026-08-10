'use client';

import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { LayoutCard } from '@/components/Layout/LayoutCard';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui-custom/SearchInput';
import { SearchToggleButton } from '@/components/ui-custom/SearchToggleButton';
import { DownloadIcon } from 'lucide-react';
import { ExcelExportSessionsDrawer } from '@/components/Sessions/excelExportSessions';
import SessionsTable from '@/components/Sessions/sessions.table';

export function SessionPage({ contentCycleId }: { contentCycleId: string }) {
  'use client';
  const router = useRouter();
  const t = useTranslations('Orders');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [effectiveSearch, setEffectiveSearch] = useState<string>('');

  const setTools = useHeaderFeatures((s) => s.setTools);
  const clearTools = useHeaderFeatures((s) => s.clearTools);
  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);
  const error = useHeaderFeatures((s) => s.error);

  const HeaderButton = useMemo(() => {
    return (
      <>
        <SearchToggleButton
          isSearchVisible={isSearchVisible}
          setIsSearchVisible={setIsSearchVisible}
        />
        <Button type="button" size="md" onClick={() => setExportDialogOpen(true)} disabled={error}>
          {t('ExcelExport.title')}
          <DownloadIcon />
        </Button>
      </>
    );
  }, [isSearchVisible, setIsSearchVisible, error, router]);

  useEffect(() => {
    setButtons(HeaderButton);
  }, [HeaderButton, setButtons]);

  useEffect(() => {
    return () => {
      clearButtons();
      clearTools();
    };
  }, [clearButtons, clearTools]);

  return (
    <LayoutCard className="_sessions">
      <ExcelExportSessionsDrawer
        onOpenChange={setExportDialogOpen}
        open={exportDialogOpen}
        contentCycleId={contentCycleId}
      />
      <SessionsTable contentCycleId={contentCycleId} />
    </LayoutCard>
  );
}
