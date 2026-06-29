'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, Button } from '@/components/ui';

interface PagePromotionAlertProps {
  instagramId: string;
}

export function PagePromotionAlert({ instagramId }: PagePromotionAlertProps) {
  const t = useTranslations('Settings.Accounts');
  const router = useRouter();

  return (
    <Alert variant="note" className="mt-2 flex-col items-start gap-2 p-2 text-xs">
      <AlertDescription>{t('page_promotion_alert')}</AlertDescription>
      <Button
        size="sm"
        variant="outline"
        onClick={() => router.push(`/settings/subscription?instagramId=${instagramId}`)}
      >
        {t('page_promotion_cta')}
      </Button>
    </Alert>
  );
}
