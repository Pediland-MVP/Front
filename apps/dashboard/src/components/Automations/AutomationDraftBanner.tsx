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
    <Alert
      variant="note"
      className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <AlertDescription icon className="min-w-0 flex-1">
        {t('description')}
      </AlertDescription>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onResume}
          className="flex-1 bg-amber-600 text-white hover:bg-amber-700 sm:flex-none"
        >
          {t('resume')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCreateNew}
          className="flex-1 text-amber-700 hover:bg-amber-100 hover:text-amber-800 sm:flex-none"
        >
          {t('createNew')}
        </Button>
      </div>
    </Alert>
  );
};
