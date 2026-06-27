'use client';

import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { ExcelExportDirectsDrawer } from './components/excelExportDirects.drawer';

import { Button } from '@/components/ui';

export default function page() {
  const t = useTranslations('Directs');
  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setButtons([
      <Button size="md" onClick={() => setOpen(true)}>
        {t('ExcelExport.title')}
      </Button>,
    ]);
  }, [setButtons, t]);

  useEffect(() => {
    return () => {
      clearButtons();
    };
  }, [clearButtons]);

  return (
    <div className="_orders">
      <ExcelExportDirectsDrawer onOpenChange={setOpen} open={open} />
    </div>
  );
}
