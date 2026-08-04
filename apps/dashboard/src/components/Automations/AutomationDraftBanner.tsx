'use client';

import { useTranslations } from 'next-intl';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AutomationDraftBannerProps {
  onResume: () => void;
  onCreateNew: () => void;
}

export const AutomationDraftBanner = ({ onResume, onCreateNew }: AutomationDraftBannerProps) => {
  const t = useTranslations('Automations.DraftBanner');

  return (
    <div className="space-y-2">
      <Alert variant="note">
        <AlertDescription icon>{t('description')}</AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onResume}>
          {t('resume')}
        </Button>
        <Button type="button" variant="ghost" onClick={onCreateNew}>
          {t('createNew')}
        </Button>
      </div>
    </div>
  );
};
